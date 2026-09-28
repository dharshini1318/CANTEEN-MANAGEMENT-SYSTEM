import { useState, useEffect, useMemo } from 'react'
import { getAllOrders, getAdminMenu } from '../../services/api'
import { formatPrice } from '../../utils/format'
import { Card } from '../../components/ui/card'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { ArrowDownAZ, ArrowUpAZ, ArrowUpDown } from 'lucide-react'

export function AdminAnalyticsPage() {
  const [orders, setOrders] = useState([])
  const [menu, setMenu] = useState([])
  
  const [rangeType, setRangeType] = useState('TODAY')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  useEffect(() => {
    getAllOrders().then(setOrders)
    getAdminMenu().then(setMenu)
  }, [])

  const { startMs, endMs } = useMemo(() => {
    const now = new Date()
    const tz = 'Asia/Kolkata'
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(now)
    
    if (rangeType === 'TODAY') {
      const start = new Date(`${todayStr}T00:00:00+05:30`).getTime()
      return { startMs: start, endMs: start + 24 * 60 * 60 * 1000 - 1 }
    }
    if (rangeType === 'WEEK') {
      const start = new Date(`${todayStr}T00:00:00+05:30`).getTime() - 6 * 24 * 60 * 60 * 1000
      return { startMs: start, endMs: new Date(`${todayStr}T00:00:00+05:30`).getTime() + 24 * 60 * 60 * 1000 - 1 }
    }
    if (rangeType === 'MONTH') {
      const start = new Date(`${todayStr}T00:00:00+05:30`).getTime() - 29 * 24 * 60 * 60 * 1000
      return { startMs: start, endMs: new Date(`${todayStr}T00:00:00+05:30`).getTime() + 24 * 60 * 60 * 1000 - 1 }
    }
    if (rangeType === 'CUSTOM' && customStart && customEnd) {
      const start = new Date(`${customStart}T00:00:00+05:30`).getTime()
      const end = new Date(`${customEnd}T00:00:00+05:30`).getTime() + 24 * 60 * 60 * 1000 - 1
      return { startMs: start, endMs: end }
    }
    return { startMs: 0, endMs: Infinity }
  }, [rangeType, customStart, customEnd])

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const time = new Date(o.createdAt).getTime()
      return time >= startMs && time <= endMs
    })
  }, [orders, startMs, endMs])

  const { stats, outcomes, hourlyData, productsMap } = useMemo(() => {
    let revenue = 0
    let upiRev = 0
    let cashRev = 0
    
    let completed = 0
    let cancelled = 0
    let expired = 0

    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0, display: `${i}:00` }))
    const pMap = {}

    filteredOrders.forEach(o => {
      const isPaid = o.paymentStatus === 'PAID' || o.paymentStatus === 'COMPLETED'
      
      if (o.orderStatus === 'CANCELLED') cancelled++
      else if (o.paymentStatus === 'EXPIRED') expired++
      else completed++

      if (isPaid) {
        revenue += o.subtotal
        if (o.paymentMethod === 'UPI') upiRev += o.subtotal
        if (o.paymentMethod === 'CASH') cashRev += o.subtotal
        
        o.items.forEach(item => {
          if (!pMap[item.id]) {
            pMap[item.id] = { id: item.id, name: item.name, quantitySold: 0, revenue: 0 }
          }
          pMap[item.id].quantitySold += item.quantity
          pMap[item.id].revenue += (item.price * item.quantity)
        })
      }

      const orderHour = parseInt(new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false }).format(new Date(o.createdAt)), 10)
      const validHour = isNaN(orderHour) ? 0 : orderHour === 24 ? 0 : orderHour
      hours[validHour].count++
    })

    return {
      stats: {
        totalOrders: filteredOrders.length,
        revenue,
        upiRev,
        cashRev,
        aov: completed > 0 ? revenue / completed : 0
      },
      outcomes: { completed, cancelled, expired },
      hourlyData: hours,
      productsMap: pMap
    }
  }, [filteredOrders])

  const [sortField, setSortField] = useState('quantitySold')
  const [sortDesc, setSortDesc] = useState(true)

  const productsList = useMemo(() => {
    const list = Object.values(productsMap).map(p => {
      const menuItem = menu.find(m => m.id === p.id)
      return {
        ...p,
        remaining: menuItem && menuItem.inventory_mode === 'QUANTITY_TRACKED' ? menuItem.remaining : null
      }
    })
    
    list.sort((a, b) => {
      const valA = a[sortField]
      const valB = b[sortField]
      if (valA < valB) return sortDesc ? 1 : -1
      if (valA > valB) return sortDesc ? -1 : 1
      return 0
    })
    return list
  }, [productsMap, menu, sortField, sortDesc])

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDesc(!sortDesc)
    } else {
      setSortField(field)
      setSortDesc(true)
    }
  }

  const renderSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 inline opacity-40" />
    return sortDesc ? <ArrowDownAZ className="w-3 h-3 ml-1 inline text-primary" /> : <ArrowUpAZ className="w-3 h-3 ml-1 inline text-primary" />
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex gap-2 items-center bg-card p-1 rounded-lg border">
          {['TODAY', 'WEEK', 'MONTH', 'CUSTOM'].map(t => (
            <button
              key={t}
              onClick={() => setRangeType(t)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                rangeType === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {rangeType === 'CUSTOM' && (
        <Card className="p-4 flex gap-4 items-end bg-card">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Start Date</label>
            <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">End Date</label>
            <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="mt-1" />
          </div>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-card">
          <div className="text-sm text-muted-foreground mb-1">Total Revenue</div>
          <div className="text-2xl font-bold text-primary">{formatPrice(stats.revenue)}</div>
        </Card>
        <Card className="p-4 bg-card">
          <div className="text-sm text-muted-foreground mb-1">Total Orders</div>
          <div className="text-2xl font-bold">{stats.totalOrders}</div>
        </Card>
        <Card className="p-4 bg-card">
          <div className="text-sm text-muted-foreground mb-1">Avg Order Value</div>
          <div className="text-2xl font-bold">{formatPrice(stats.aov)}</div>
        </Card>
        <Card className="p-4 bg-card">
          <div className="text-sm text-muted-foreground mb-1">UPI Revenue</div>
          <div className="text-2xl font-bold">{formatPrice(stats.upiRev)}</div>
        </Card>
        <Card className="p-4 bg-card">
          <div className="text-sm text-muted-foreground mb-1">Cash Revenue</div>
          <div className="text-2xl font-bold">{formatPrice(stats.cashRev)}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="p-6 bg-card lg:col-span-2">
          <h3 className="font-semibold mb-6">Orders per Hour</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="display" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Outcomes */}
        <Card className="p-6 bg-card flex flex-col justify-center gap-6">
          <h3 className="font-semibold">Order Outcomes</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-success font-medium">Completed</span>
                <span >{outcomes.completed}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-success h-2 rounded-full" style={{ width: `${stats.totalOrders ? (outcomes.completed/stats.totalOrders)*100 : 0}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground font-medium">Expired</span>
                <span >{outcomes.expired}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-muted-foreground/50 h-2 rounded-full" style={{ width: `${stats.totalOrders ? (outcomes.expired/stats.totalOrders)*100 : 0}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-destructive font-medium">Cancelled</span>
                <span >{outcomes.cancelled}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-destructive h-2 rounded-full" style={{ width: `${stats.totalOrders ? (outcomes.cancelled/stats.totalOrders)*100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Products Table */}
      <Card className="overflow-hidden bg-card">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Product Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-muted/50 text-muted-foreground text-xs border-b">
              <tr>
                <th className="px-6 py-4 font-semibold">Product</th>
                <th 
                  className="px-6 py-4 font-semibold cursor-pointer hover:text-foreground select-none"
                  onClick={() => toggleSort('quantitySold')}
                >
                  Qty Sold {renderSortIcon('quantitySold')}
                </th>
                <th 
                  className="px-6 py-4 font-semibold text-right cursor-pointer hover:text-foreground select-none"
                  onClick={() => toggleSort('revenue')}
                >
                  Revenue {renderSortIcon('revenue')}
                </th>
                <th className="px-6 py-4 font-semibold text-right">Remaining Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {productsList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No sales data for this period.</td>
                </tr>
              ) : (
                productsList.map(p => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-6 py-3 font-medium">{p.name}</td>
                    <td className="px-6 py-3">{p.quantitySold}</td>
                    <td className="px-6 py-3 text-right">{formatPrice(p.revenue)}</td>
                    <td className="px-6 py-3 text-right">
                      {p.remaining !== null ? (
                        <span className={`${p.remaining <= 8 ? 'text-warning' : ''}`}>{p.remaining}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  )
}
