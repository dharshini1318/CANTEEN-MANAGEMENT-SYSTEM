import { useState, useEffect, useMemo } from 'react'
import { getAllOrders } from '../../services/api'
import { formatPrice } from '../../utils/format'
import { Input } from '../../components/ui/input'
import { Search } from 'lucide-react'

function TransactionStatusBadge({ status }) {
  if (status === 'EXPIRED' || status === 'FAILED') {
    return <span className="inline-block px-2 py-1 text-xs font-semibold uppercase tracking-wider rounded-md bg-destructive/10 text-destructive border border-destructive/20">{status}</span>
  }
  if (status === 'AWAITING_CONFIRMATION') {
    return <span className="inline-block px-2 py-1 text-xs font-semibold uppercase tracking-wider rounded-md bg-warning/10 text-warning border border-warning/20">PENDING</span>
  }
  if (status === 'PAID') {
    return <span className="inline-block px-2 py-1 text-xs font-semibold uppercase tracking-wider rounded-md bg-success/10 text-success border border-success/20">SUCCESS</span>
  }
  return <span className="inline-block px-2 py-1 text-xs font-semibold uppercase tracking-wider rounded-md bg-muted text-foreground">{status}</span>
}

export function AdminTransactionsPage() {
  const [orders, setOrders] = useState([])
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    getAllOrders().then(setOrders).catch(console.error)
  }, [])

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (methodFilter !== 'ALL' && o.paymentMethod !== methodFilter) return false
      
      let financialStatus = o.paymentStatus
      if (financialStatus === 'AWAITING_CONFIRMATION') financialStatus = 'PENDING'
      if (financialStatus === 'PAID') financialStatus = 'SUCCESS'

      if (statusFilter !== 'ALL' && financialStatus !== statusFilter) return false
      
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!o.orderNumber.toLowerCase().includes(q)) {
          return false
        }
      }
      return true
    })
  }, [orders, search, methodFilter, statusFilter])

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Transactions</h1>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search Order ID..."
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
            <option value="PENDING">Pending</option>
            <option value="SUCCESS">Success</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-muted text-muted-foreground text-xs border-b">
              <tr>
                <th className="px-6 py-4 font-semibold">Order ID</th>
                <th className="px-6 py-4 font-semibold">Date & Time</th>
                <th className="px-6 py-4 font-semibold">Method</th>
                <th className="px-6 py-4 font-semibold text-right">Amount</th>
                <th className="px-6 py-4 font-semibold">Confirmed By</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No transactions found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const time = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }).format(new Date(order.paidAt || order.createdAt))
                  return (
                    <tr key={order.token} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium">{order.orderNumber}</td>
                      <td className="px-6 py-4 text-muted-foreground">{time}</td>
                      <td className="px-6 py-4 font-medium">{order.paymentMethod}</td>
                      <td className="px-6 py-4 font-medium text-right">{formatPrice(order.subtotal)}</td>
                      <td className="px-6 py-4">
                        {order.confirmedBy ? (
                          <span className="inline-block px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs font-medium">
                            {order.confirmedBy}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <TransactionStatusBadge status={order.paymentStatus} />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
