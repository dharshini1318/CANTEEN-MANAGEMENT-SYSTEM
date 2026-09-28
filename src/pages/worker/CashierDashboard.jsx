import { useState, useEffect, useMemo } from 'react'
import { getAllOrders, confirmPayment } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { formatPrice } from '../../utils/format'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Search } from 'lucide-react'

function StatusBadge({ paymentStatus, orderStatus }) {
  if (paymentStatus === 'EXPIRED') {
    return <span className="inline-block px-2 py-1 text-xs font-semibold uppercase tracking-wider rounded-md bg-muted text-muted-foreground">EXPIRED</span>
  }
  
  if (paymentStatus === 'PENDING') {
    return <span className="inline-block px-2 py-1 text-xs font-semibold uppercase tracking-wider rounded-md bg-warning/10 text-warning border border-warning/20">PENDING</span>
  }
  
  if (paymentStatus === 'PAID') {
    if (orderStatus === 'PREPARING') {
      return <span className="inline-block px-2 py-1 text-xs font-semibold uppercase tracking-wider rounded-md bg-primary/10 text-primary border border-primary/20">PREPARING</span>
    }
    if (orderStatus === 'COMPLETED') {
      return <span className="inline-block px-2 py-1 text-xs font-semibold uppercase tracking-wider rounded-md bg-success/10 text-success border border-success/20">COMPLETED</span>
    }
  }
  
  return <span className="inline-block px-2 py-1 text-xs font-semibold uppercase tracking-wider rounded-md bg-muted text-foreground">{orderStatus || paymentStatus}</span>
}

function OrderRow({ order, onConfirm }) {
  const [expanded, setExpanded] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [optimisticConfirmed, setOptimisticConfirmed] = useState(false)

  const isAwaiting = order.paymentStatus === 'PENDING' && !optimisticConfirmed
  const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date(order.createdAt))
  
  const handleConfirm = async () => {
    if (confirming) return
    setConfirming(true)
    try {
      await onConfirm(order.token)
      setOptimisticConfirmed(true)
    } catch (e) {
      alert(e.message || "Failed to confirm payment")
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="bg-card border rounded-lg p-4 mb-3 flex flex-col gap-3 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* Basic Info */}
        <div className="flex items-center gap-4 min-w-[240px]">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Order ID</div>
            <div className="font-mono font-medium">{order.orderNumber}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Time</div>
            <div className="text-sm font-medium">{time}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Customer</div>
            <div className="text-sm font-medium">{order.customerName}</div>
          </div>
        </div>

        {/* Status & Method */}
        <div className="flex items-center gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Method</div>
            <div className="text-sm font-medium">{order.paymentMethod}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Status</div>
            <StatusBadge paymentStatus={optimisticConfirmed ? 'PAID' : order.paymentStatus} orderStatus={optimisticConfirmed ? 'PREPARING' : order.orderStatus} />
          </div>
        </div>
        
        {/* Pickup & Total */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-muted-foreground mb-1">Pickup Code</div>
            <div className="font-mono text-lg font-bold tracking-widest">{order.pickupCode}</div>
          </div>
          <div className="text-right w-[80px]">
            <div className="text-xs text-muted-foreground mb-1">Total</div>
            <div className="font-medium">{formatPrice(order.subtotal)}</div>
          </div>
        </div>
      </div>

      {/* Expandable Items & Actions */}
      <div className="flex items-end justify-between border-t pt-3 mt-1">
        <div>
          <button 
            onClick={() => setExpanded(!expanded)} 
            className="text-sm text-primary hover:underline font-medium"
          >
            {expanded ? 'Hide items' : `View ${order.items.length} items`}
          </button>
          
          {expanded && (
            <div className="mt-3 space-y-1">
              {order.items.map(item => (
                <div key={item.id} className="text-sm flex gap-4">
                  <span className="text-muted-foreground w-6 text-right">{item.quantity}x</span>
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div>
          {isAwaiting && (
            <Button 
              size="sm" 
              onClick={handleConfirm}
              disabled={confirming}
              className={`bg-warning hover:bg-warning/90 text-primary-foreground ${confirming ? 'opacity-50' : ''}`}
            >
              {order.paymentMethod === 'UPI' ? 'UPI Received' : 'Cash Received'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export function CashierDashboard() {
  const [orders, setOrders] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All') // All, AWAITING_CONFIRMATION, PREPARING, COMPLETED, EXPIRED
  const { session } = useAuth()

  const fetchOrders = async () => {
    const data = await getAllOrders()
    setOrders(data)
  }

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 8000)
    return () => clearInterval(interval)
  }, [])

  const handleConfirm = async (token) => {
    await confirmPayment(token, session?.username)
    // We let the optimistic update handle the UI immediately. 
    // The next poll will sync the real state.
  }

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Apply Filter
      if (filter !== 'All') {
        if (filter === 'PENDING' && o.paymentStatus !== 'PENDING') return false
        if (filter === 'EXPIRED' && o.paymentStatus !== 'EXPIRED') return false
        if (filter === 'PREPARING' && (o.paymentStatus !== 'PAID' || o.orderStatus !== 'PREPARING')) return false
        if (filter === 'COMPLETED' && (o.paymentStatus !== 'PAID' || o.orderStatus !== 'COMPLETED')) return false
      }
      
      // Apply Search
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!o.orderNumber.toLowerCase().includes(q) && !o.customerName.toLowerCase().includes(q)) {
          return false
        }
      }
      return true
    })
  }, [orders, search, filter])

  const filters = [
    { id: 'All', label: 'All' },
    { id: 'PENDING', label: 'Pending Payment' },
    { id: 'PREPARING', label: 'Preparing' },
    { id: 'COMPLETED', label: 'Completed' },
    { id: 'EXPIRED', label: 'Expired' }
  ]

  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold">Cashier Dashboard</h1>
        
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search ID or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
        </div>
      </div>

      <div className="flex overflow-x-auto no-scrollbar gap-2 mb-6 pb-2">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-colors border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              filter === f.id
                ? 'bg-foreground text-background border-foreground' 
                : 'bg-card text-foreground border-border hover:bg-muted'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground border rounded-lg bg-card/50 text-sm">
            No orders found matching the criteria.
          </div>
        ) : (
          filteredOrders.map(order => (
            <OrderRow key={order.token} order={order} onConfirm={handleConfirm} />
          ))
        )}
      </div>
    </div>
  )
}
