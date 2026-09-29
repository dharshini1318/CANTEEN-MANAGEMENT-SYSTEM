import { useState, useEffect, useMemo } from 'react'
import { getAllOrders, completeOrder } from '../../services/api'
import { Button } from '../../components/ui/button'

function OrderCard({ order, onComplete }) {
  const [completing, setCompleting] = useState(false)
  const [optimisticCompleted, setOptimisticCompleted] = useState(false)

  const isPreparing = order.orderStatus === 'PREPARING' && !optimisticCompleted

  const handleComplete = async () => {
    if (completing) return
    setCompleting(true)
    try {
      await onComplete(order.token)
      setOptimisticCompleted(true)
    } catch (e) {
      alert(e.message || "Failed to complete order")
    } finally {
      setCompleting(false)
    }
  }

  const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date(order.createdAt))

  return (
    <div className={`bg-card border rounded-2xl p-6 transition-colors shadow-sm ${!isPreparing ? 'opacity-70' : ''}`}>
      <div className="flex justify-between items-start mb-4 pb-4 border-b border-border/50">
        <div>
          <div className="font-mono text-lg font-bold mb-1">{order.orderNumber}</div>
          <div className="text-sm font-medium">{order.customerName}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground mb-1">Pickup Code</div>
          <div className="font-mono text-xl font-bold tracking-widest">{order.pickupCode}</div>
          <div className="text-xs text-muted-foreground mt-1">{time}</div>
        </div>
      </div>

      <div className="mb-6 space-y-3">
        {order.items.map(item => (
          <div key={item.id} className="flex gap-4 items-start">
            <span className="font-bold text-foreground text-lg w-8 text-right bg-muted px-1.5 rounded">{item.quantity}</span>
            <span className="text-base font-medium mt-0.5">{item.name}</span>
          </div>
        ))}
      </div>

      {isPreparing ? (
        <Button 
          size="lg" 
          className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90" 
          onClick={handleComplete}
          disabled={completing}
        >
          {completing ? 'Marking...' : 'Mark as picked up'}
        </Button>
      ) : (
        <div className="w-full py-3 text-center bg-muted text-muted-foreground font-semibold rounded-md text-sm">
          Completed
        </div>
      )}
    </div>
  )
}

export function FoodServiceDashboard() {
  const [orders, setOrders] = useState([])
  const [view, setView] = useState('PREPARING') // PREPARING or COMPLETED

  const fetchOrders = async () => {
    try {
      const data = await getAllOrders()
      setOrders(data)
    } catch (err) {
      console.error("Failed to fetch orders:", err)
    }
  }

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 8000)
    return () => clearInterval(interval)
  }, [])

  const handleComplete = async (token) => {
    await completeOrder(token)
    // Optimistic update handles UI visually.
  }

  const filteredOrders = useMemo(() => {
    return orders.filter(o => o.paymentStatus === 'PAID' && o.orderStatus === view)
  }, [orders, view])

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 md:px-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Food Service</h1>
        
        <div className="flex bg-muted rounded-lg p-1">
          <button
            onClick={() => setView('PREPARING')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              view === 'PREPARING' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Active Queue
          </button>
          <button
            onClick={() => setView('COMPLETED')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              view === 'COMPLETED' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Recently Completed
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredOrders.length === 0 ? (
          <div className="md:col-span-2 py-16 text-center border rounded-2xl bg-card/50">
            <p className="text-lg font-medium text-muted-foreground">Queue is empty</p>
            <p className="text-sm text-muted-foreground mt-1">No {view.toLowerCase()} orders right now.</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <OrderCard key={order.token} order={order} onComplete={handleComplete} />
          ))
        )}
      </div>
    </div>
  )
}
