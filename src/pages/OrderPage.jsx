import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getOrderByToken, confirmPayment, expireOrder, completeOrder, getSettings, cancelOrder } from '../services/api'
import { formatPrice } from '../utils/format'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '../components/ui/button'
import { Check, Circle } from 'lucide-react'

function StatusStepper({ order }) {
  // Ordered steps. `orderStatus` maps to these.
  const steps = [
    { id: 'CREATED', label: 'Order Created' },
    { id: 'PAID', label: 'Payment Confirmed' },
    { id: 'PREPARING', label: 'Preparing' },
    { id: 'COMPLETED', label: 'Completed' }
  ]

  let currentIndex = 0
  if (order.paymentStatus === 'PAID') {
    if (order.orderStatus === 'PREPARING') currentIndex = 2
    else if (order.orderStatus === 'COMPLETED') currentIndex = 3
    else currentIndex = 1 // Fallback just in case
  }

  return (
    <div className="w-full max-w-sm mx-auto my-8">
      <ol aria-current="step" className="relative border-l-2 border-border ml-3">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex || (index === 3 && currentIndex === 3)
          const isCurrent = index === currentIndex && currentIndex !== 3
          const isUpcoming = index > currentIndex

          return (
            <li key={step.id} className="mb-8 ml-6 last:mb-0">
              <span className={`absolute flex items-center justify-center w-6 h-6 rounded-full -left-[13px] ring-4 ring-background transition-colors duration-300 ${
                isCompleted ? 'bg-primary text-primary-foreground' : isCurrent ? 'bg-foreground text-background' : 'bg-background border-2 border-border text-transparent'
              }`}>
                {isCompleted ? (
                  <Check className="w-3 h-3" />
                ) : isCurrent ? (
                  <div className="w-2 h-2 rounded-full bg-background" />
                ) : (
                  <Circle className="w-4 h-4 text-border" />
                )}
              </span>
              <h3 className={`font-medium leading-tight ${isUpcoming ? 'text-muted-foreground' : 'text-foreground'}`}>
                {step.label}
              </h3>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export function OrderPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())
  const [tick, setTick] = useState(0) 
  const [settings, setSettings] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(false)

  useEffect(() => {
    let isMounted = true
    getOrderByToken(token).then(data => {
      if (isMounted) {
        setOrder(data)
        setSettings(getSettings())
        setLoading(false)
      }
    })

    const intervalId = setInterval(async () => {
      const data = await getOrderByToken(token)
      if (isMounted && data) {
        setOrder(data)
        if (['COMPLETED', 'EXPIRED', 'CANCELLED'].includes(data.paymentStatus) || data.orderStatus === 'COMPLETED' || data.orderStatus === 'CANCELLED') {
          clearInterval(intervalId)
        }
      }
    }, 3000)

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [token, tick])

  useEffect(() => {
    if (!order || order.paymentStatus !== 'PENDING') return
    
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    
    return () => clearInterval(interval)
  }, [order])

  // Auto-expire when countdown reaches zero
  useEffect(() => {
    if (order && order.paymentStatus === 'PENDING') {
      const expiresAtMs = new Date(order.expiresAt).getTime()
      if (Date.now() >= expiresAtMs) {
        expireOrder(token).then(() => setTick(t => t + 1))
      }
    }
  }, [order, now, token])

  const handleSimulateConfirm = async () => {
    await confirmPayment(token)
    setTick(t => t + 1)
  }

  const handleSimulateExpire = async () => {
    await expireOrder(token)
    setTick(t => t + 1)
  }

  const handleSimulateComplete = async () => {
    await completeOrder(token)
    setTick(t => t + 1)
  }

  const handleCancelOrder = () => {
    setShowCancelModal(true)
  }

  const confirmCancelOrder = async () => {
    await cancelOrder(token)
    setTick(t => t + 1)
    setShowCancelModal(false)
    navigate('/menu')
  }

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center p-4">Loading...</div>
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-medium mb-4">We couldn't find that order</h2>
        <Button onClick={() => navigate('/menu')}>Browse Menu</Button>
      </div>
    )
  }

  const expiresAt = new Date(order.expiresAt).getTime()
  const remainingMs = Math.max(0, expiresAt - now)
  const remainingMins = Math.floor(remainingMs / 60000)
  const remainingSecs = Math.floor((remainingMs % 60000) / 1000)

  return (
    <div className="min-h-screen bg-background py-12 px-4 flex flex-col items-center">
      <div className="max-w-md w-full flex flex-col items-center text-center">
        <div className="text-sm font-medium text-muted-foreground mb-2">Order</div>
        <h1 className="text-4xl font-semibold mb-8 font-mono">{order.orderNumber}</h1>

        {order.paymentStatus === 'PENDING' && (
          <div className="w-full flex flex-col items-center">
            {order.paymentMethod === 'UPI' && settings ? (
              <div className="bg-white p-4 rounded-2xl mb-6 shadow-sm">
                <QRCodeSVG 
                  value={`upi://pay?pa=${settings.upiVpa}&pn=${settings.cafeteriaName}&am=${(order.subtotal / 100).toFixed(2)}&tn=${order.orderNumber}`}
                  size={200}
                />
              </div>
            ) : null}

            {order.paymentMethod === 'UPI' ? (
              <p className="text-muted-foreground mb-8">
                Scan to pay <span className="font-medium text-foreground">{formatPrice(order.subtotal)}</span> via any UPI app, then wait a moment — a cashier will confirm your payment.
              </p>
            ) : (
              <p className="text-muted-foreground mb-8">
                Please pay <span className="font-medium text-foreground">{formatPrice(order.subtotal)}</span> at the counter within 15 minutes.
              </p>
            )}

            <div className="w-full bg-card border rounded-xl p-6 mb-8 flex justify-between items-center text-left">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Order ID</div>
                <div className="font-medium font-mono">{order.orderNumber}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground mb-1">Pickup Code</div>
                <div className="font-medium text-2xl tracking-widest font-mono">{order.pickupCode}</div>
              </div>
            </div>

            <div className="text-warning mb-6">
              Expires in {String(remainingMins).padStart(2, '0')}:{String(remainingSecs).padStart(2, '0')}
            </div>

            <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleCancelOrder}>
              Cancel Order
            </Button>
          </div>
        )}

        {order.paymentStatus === 'PAID' && (
          <div className="w-full text-left">
            <StatusStepper order={order} />
            <Button 
              className="w-full mt-4" 
              variant="outline" 
              onClick={() => navigate(`/receipt/${token}`)}
            >
              View Receipt
            </Button>
          </div>
        )}

        {order.paymentStatus === 'EXPIRED' && (
          <div className="py-12">
            <p className="text-muted-foreground mb-6">
              This order has expired. Reserved items have been released — you're welcome to place a new order.
            </p>
            <Button onClick={() => navigate('/menu')}>Browse Menu</Button>
          </div>
        )}

        {order.paymentStatus === 'CANCELLED' && (
          <div className="py-12">
            <h2 className="text-2xl font-bold mb-4">Order Cancelled</h2>
            <p className="text-muted-foreground mb-6">
              Your order was cancelled successfully.
            </p>
            <Button onClick={() => navigate('/menu')}>Browse Menu</Button>
          </div>
        )}

        {/* Dev Controls */}
        {import.meta.env.DEV && order.paymentStatus !== 'EXPIRED' && order.orderStatus !== 'COMPLETED' && (
          <div className="mt-12 w-full border-2 border-dashed border-border p-4 rounded-lg flex flex-col gap-3">
            <div className="text-xs text-muted-foreground mb-3">Dev Only (Simulation)</div>
            {order.paymentStatus === 'PENDING' && (
              <>
                <Button variant="secondary" size="sm" onClick={handleSimulateConfirm}>
                  Simulate cashier confirmation
                </Button>
                <Button variant="outline" size="sm" onClick={handleSimulateExpire}>
                  Simulate expiration
                </Button>
              </>
            )}
            {order.orderStatus === 'PREPARING' && (
              <Button variant="secondary" size="sm" onClick={handleSimulateComplete}>
                Simulate marking as picked up
              </Button>
            )}
          </div>
        )}
      </div>
      
      {showCancelModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl shadow-lg w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-semibold mb-2">Cancel Order?</h2>
            <p className="text-muted-foreground mb-6 text-sm">Are you sure you want to cancel this order? This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowCancelModal(false)}>
                Go Back
              </Button>
              <Button variant="destructive" className="flex-1" onClick={confirmCancelOrder}>
                Yes, Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
