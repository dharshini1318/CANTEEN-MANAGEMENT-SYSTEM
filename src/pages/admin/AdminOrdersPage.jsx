import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getAllOrders } from '../../services/api'
import { formatPrice } from '../../utils/format'
import { Input } from '../../components/ui/input'
import { Search } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet'

function StatusBadge({ status, type = 'default' }) {
  if (!status) return null
  
  if (status === 'EXPIRED') {
    return <span className="inline-block px-2 py-1 text-xs font-semibold uppercase tracking-wider rounded-md bg-muted text-muted-foreground">EXPIRED</span>
  }
  if (status === 'PENDING') {
    return <span className="inline-block px-2 py-1 text-xs font-semibold uppercase tracking-wider rounded-md bg-warning/10 text-warning border border-warning/20">PENDING</span>
  }
  if (status === 'PREPARING') {
    return <span className="inline-block px-2 py-1 text-xs font-semibold uppercase tracking-wider rounded-md bg-primary/10 text-primary border border-primary/20">PREPARING</span>
  }
  if (status === 'COMPLETED' || status === 'PAID') {
    return <span className="inline-block px-2 py-1 text-xs font-semibold uppercase tracking-wider rounded-md bg-success/10 text-success border border-success/20">{status}</span>
  }
  
  return <span className="inline-block px-2 py-1 text-xs font-semibold uppercase tracking-wider rounded-md bg-muted text-foreground">{status}</span>
}

function OrderDetailsSheet({ order, open, onOpenChange }) {
  if (!order) return null

  const formatTime = (ts) => {
    if (!ts) return ''
    return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ts))
  }

  const timeline = [
    { label: 'Created', time: order.createdAt },
    order.paidAt && { label: 'Paid', time: order.paidAt },
    order.completedAt && { label: 'Completed', time: order.completedAt },
    order.expiredAt && { label: 'Expired', time: order.expiredAt },
  ].filter(Boolean)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-6">
        <SheetHeader className="mb-6 border-b pb-4">
          <SheetTitle className="text-xl flex justify-between items-center">
            <span className="font-mono">{order.orderNumber}</span>
            <StatusBadge status={order.orderStatus === 'CREATED' ? order.paymentStatus : order.orderStatus} />
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-8">
          
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Customer Details</h3>
            <p className="font-medium">{order.customerName}</p>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Order Items</h3>
            <div className="space-y-2">
              {order.items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span><span className="text-muted-foreground mr-2">{item.quantity}x</span>{item.name}</span>
                  <span >{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center mt-4 pt-4 border-t font-medium">
                <span>Subtotal</span>
                <span >{formatPrice(order.subtotal)}</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Payment</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block mb-1">Method</span>
                <span className="font-medium">{order.paymentMethod}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Status</span>
                <StatusBadge status={order.paymentStatus} />
              </div>
            </div>
            
            {order.paymentStatus === 'PAID' && (
              <div className="mt-4">
                <Link to={`/receipt/${order.token}`} className="text-primary hover:underline text-sm font-medium">
                  View Receipt
                </Link>
              </div>
            )}
          </section>

          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Timeline</h3>
            <div className="relative border-l-2 border-border ml-3 mt-4 space-y-6">
              {timeline.map((event, idx) => (
                <div key={idx} className="ml-6 relative">
                  <span className="absolute flex items-center justify-center w-3 h-3 rounded-full -left-[29px] top-1.5 bg-foreground ring-4 ring-background" />
                  <p className="font-medium text-sm">{event.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatTime(event.time)}</p>
                </div>
              ))}
            </div>
          </section>

        </div>
      </SheetContent>
    </Sheet>
  )
}

export function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    getAllOrders().then(setOrders).catch(console.error)
  }, [])

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (methodFilter !== 'ALL' && o.paymentMethod !== methodFilter) return false
      
      if (statusFilter !== 'ALL') {
        const aggregatedStatus = o.orderStatus === 'CREATED' ? o.paymentStatus : o.orderStatus
        if (aggregatedStatus !== statusFilter) return false
      }
      
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!o.orderNumber.toLowerCase().includes(q) && !o.customerName.toLowerCase().includes(q)) {
          return false
        }
      }
      return true
    })
  }, [orders, search, methodFilter, statusFilter])

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Orders Overview</h1>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search ID or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-4 w-full md:w-auto overflow-x-auto">
          <select 
            className="px-3 py-2 border rounded-md text-sm bg-background"
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value)}
          >
            <option value="ALL">All Methods</option>
            <option value="UPI">UPI</option>
            <option value="CASH">Cash</option>
          </select>

          <select 
            className="px-3 py-2 border rounded-md text-sm bg-background"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="AWAITING_CONFIRMATION">Awaiting Confirmation</option>
            <option value="PREPARING">Preparing</option>
            <option value="COMPLETED">Completed</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground border rounded-lg bg-card/50">
            No orders found matching the criteria.
          </div>
        ) : (
          filteredOrders.map(order => {
            const time = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }).format(new Date(order.createdAt))
            const aggregatedStatus = order.orderStatus === 'CREATED' ? order.paymentStatus : order.orderStatus

            return (
              <div 
                key={order.token} 
                onClick={() => setSelectedOrder(order)}
                className="bg-card border rounded-lg p-4 flex flex-wrap items-center gap-4 justify-between cursor-pointer hover:border-foreground/30 transition-colors"
              >
                <div className="flex items-center gap-6 min-w-[240px]">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Order ID</div>
                    <div className="font-mono font-medium">{order.orderNumber}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Customer</div>
                    <div className="text-sm font-medium">{order.customerName}</div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs text-muted-foreground mb-1">Date</div>
                    <div className="text-sm">{time}</div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1 text-right">Total</div>
                    <div className="text-sm font-medium">{formatPrice(order.subtotal)}</div>
                  </div>
                  <div className="w-32 text-right">
                    <StatusBadge status={aggregatedStatus} />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <OrderDetailsSheet 
        order={selectedOrder} 
        open={!!selectedOrder} 
        onOpenChange={(isOpen) => !isOpen && setSelectedOrder(null)} 
      />
    </div>
  )
}
