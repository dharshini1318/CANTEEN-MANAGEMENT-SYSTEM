from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime, timedelta, timezone
import random
import string
from app.db.session import get_db
from app.models.order import Order, OrderItem, Payment, OrderStatus, PaymentStatus, OrderStatusHistory
from app.models.menu import MenuItem, Inventory, InventoryTransaction
from app.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

def check_and_expire_order(order: Order, db: Session) -> bool:
    if order.payment_status == PaymentStatus.PENDING and order.expires_at and datetime.now(timezone.utc) > order.expires_at.replace(tzinfo=timezone.utc):
        order.payment_status = PaymentStatus.EXPIRED
        order.order_status = OrderStatus.CANCELLED
        order.cancelled_at = order.expires_at
        if order.payment:
            order.payment.status = PaymentStatus.EXPIRED
            
        # Restore inventory
        for item in order.items:
            menu_item = db.query(MenuItem).filter(MenuItem.id == item.menu_item_id).first()
            if menu_item and menu_item.inventory_mode == "QUANTITY_TRACKED" and menu_item.inventory:
                menu_item.inventory.quantity += item.quantity
                txn = InventoryTransaction(
                    menu_item_id=menu_item.id,
                    change_amount=item.quantity,
                    reason="ORDER_EXPIRED",
                    created_by="system"
                )
                db.add(txn)
                
        status_hist = OrderStatusHistory(
            order_id=order.id,
            status=OrderStatus.CANCELLED,
            changed_by="system"
        )
        db.add(status_hist)
        db.commit()
        return True
    return False

def generate_token():
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=13))

def generate_order_number():
    return f"CB-{random.randint(1000, 9999)}"

def generate_pickup_code():
    return str(random.randint(1000, 9999))

@router.post("/", response_model=OrderResponse)
def create_order(order_data: OrderCreate, db: Session = Depends(get_db)):
    # Calculate subtotal and check inventory
    subtotal = 0
    db_items = []
    
    for item in order_data.items:
        menu_item = db.query(MenuItem).filter(MenuItem.id == item.id).first()
        if not menu_item:
            raise HTTPException(status_code=404, detail=f"Menu item {item.id} not found")
        
        if menu_item.inventory_mode == "QUANTITY_TRACKED":
            if not menu_item.inventory or menu_item.inventory.quantity < item.quantity:
                raise HTTPException(status_code=400, detail=f"Not enough inventory for {menu_item.name}")
            
            # Deduct inventory
            menu_item.inventory.quantity -= item.quantity
            
            # Record transaction
            txn = InventoryTransaction(
                menu_item_id=menu_item.id,
                change_amount=-item.quantity,
                reason="ORDER_CREATED",
                created_by="system"
            )
            db.add(txn)
            
        elif menu_item.inventory_mode == "AVAILABILITY_ONLY":
            if menu_item.inventory and not menu_item.inventory.is_available:
                raise HTTPException(status_code=400, detail=f"Item {menu_item.name} is not available")
                
        subtotal += menu_item.price * item.quantity
        
        db_items.append(OrderItem(
            menu_item_id=menu_item.id,
            menu_item_name=menu_item.name,
            quantity=item.quantity,
            price_at_time=menu_item.price
        ))
        
    order = Order(
        token=generate_token(),
        order_number=generate_order_number(),
        pickup_code=generate_pickup_code(),
        customer_name=order_data.customerName,
        subtotal=subtotal,
        payment_status=PaymentStatus.PENDING,
        order_status=OrderStatus.CREATED,
        expires_at=datetime.utcnow() + timedelta(minutes=15)
    )
    
    db.add(order)
    db.flush() # get order id
    
    for db_item in db_items:
        db_item.order_id = order.id
        db.add(db_item)
        
    payment = Payment(
        order_id=order.id,
        amount=subtotal,
        method=order_data.paymentMethod,
        status=PaymentStatus.PENDING
    )
    db.add(payment)
    
    status_hist = OrderStatusHistory(
        order_id=order.id,
        status=OrderStatus.CREATED,
        changed_by="customer"
    )
    db.add(status_hist)
    
    db.commit()
    db.refresh(order)
    
    # Format for response
    return {
        "token": order.token,
        "orderNumber": order.order_number,
        "pickupCode": order.pickup_code,
        "customerName": order.customer_name,
        "paymentMethod": payment.method,
        "subtotal": order.subtotal,
        "paymentStatus": order.payment_status.value,
        "orderStatus": order.order_status.value,
        "createdAt": order.created_at,
        "expiresAt": order.expires_at,
        "items": [
            {"id": i.menu_item_id, "name": i.menu_item_name, "quantity": i.quantity, "price": i.price_at_time}
            for i in order.items
        ]
    }

@router.get("/{token}", response_model=OrderResponse)
def get_order(token: str, db: Session = Depends(get_db)):
    order = db.query(Order).options(joinedload(Order.payment), joinedload(Order.items)).filter(Order.token == token).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    check_and_expire_order(order, db)
        
    return {
        "token": order.token,
        "orderNumber": order.order_number,
        "pickupCode": order.pickup_code,
        "customerName": order.customer_name,
        "paymentMethod": order.payment.method if order.payment else "CASH",
        "subtotal": order.subtotal,
        "paymentStatus": order.payment_status.value,
        "orderStatus": order.order_status.value,
        "createdAt": order.created_at,
        "expiresAt": order.expires_at,
        "paidAt": order.paid_at,
        "completedAt": order.completed_at,
        "cancelledAt": order.cancelled_at,
        "items": [
            {"id": i.menu_item_id, "name": i.menu_item_name, "quantity": i.quantity, "price": i.price_at_time}
            for i in order.items
        ]
    }

@router.get("/", response_model=List[OrderResponse])
def get_orders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["ADMIN", "CASHIER", "FOOD_SERVICE"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    orders = db.query(Order).options(joinedload(Order.payment), joinedload(Order.items)).order_by(Order.created_at.desc()).all()
    result = []
    for order in orders:
        check_and_expire_order(order, db)
        result.append({
            "token": order.token,
            "orderNumber": order.order_number,
            "pickupCode": order.pickup_code,
            "customerName": order.customer_name,
            "paymentMethod": order.payment.method if order.payment else "CASH",
            "subtotal": order.subtotal,
            "paymentStatus": order.payment_status.value,
            "orderStatus": order.order_status.value,
            "createdAt": order.created_at,
            "expiresAt": order.expires_at,
            "paidAt": order.paid_at,
            "completedAt": order.completed_at,
            "cancelledAt": order.cancelled_at,
            "items": [
                {"id": i.menu_item_id, "name": i.menu_item_name, "quantity": i.quantity, "price": i.price_at_time}
                for i in order.items
            ]
        })
    return result

@router.patch("/{token}/status")
def update_order_status(token: str, status_update: OrderStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "worker"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    order = db.query(Order).filter(Order.token == token).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if status_update.paymentStatus:
        order.payment_status = status_update.paymentStatus
        if order.payment:
            order.payment.status = status_update.paymentStatus
        if status_update.paymentStatus == PaymentStatus.PAID:
            order.paid_at = datetime.utcnow()
    
    if status_update.orderStatus:
        order.order_status = status_update.orderStatus
        if status_update.orderStatus == OrderStatus.COMPLETED:
            order.completed_at = datetime.utcnow()
        elif status_update.orderStatus == OrderStatus.CANCELLED:
            order.cancelled_at = datetime.utcnow()
            
        status_hist = OrderStatusHistory(
            order_id=order.id,
            status=status_update.orderStatus,
            changed_by="worker"
        )
        db.add(status_hist)
        
    db.commit()
    db.refresh(order)
    return {"status": "success"}
