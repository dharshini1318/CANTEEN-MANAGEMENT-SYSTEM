import { useState, useEffect, useMemo } from 'react'
import { getAllOrders, getAdminMenu, getEffectiveState } from '../../services/api'
import { formatPrice } from '../../utils/format'
import { Card } from '../../components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts'

function ElevatedCard({ title, value, subtitle }) {
  return (
    <Card variant="elevated" className="p-6">
      <div className="text-sm font-medium text-muted-foreground mb-1">{title}</div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {subtitle && <div className="text-sm text-muted-foreground mt-1">{subtitle}</div>}
    </Card>
  )
}

export function AdminDashboard() {
  const [orders, setOrders] = useState([])
  const [menu, setMenu] = useState([])

  useEffect(() => {
    getAllOrders().then(setOrders).catch(console.error)
    getAdminMenu().then(setMenu).catch(console.error)
  }, [])

  // Calculate metrics for Today
  const metrics = useMemo(() => {
    const today = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
    
    let todayOrders = 0
    let todaySales = 0
    let upiSales = 0
    let cashSales = 0
    let activeOrders = 0

    orders.forEach(order => {
      const orderDate = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(order.createdAt))
      
      if (orderDate === today) {
        todayOrders++
        if (order.paymentStatus === 'PAID' || order.paymentStatus === 'COMPLETED') {
          todaySales += order.subtotal
          if (order.paymentMethod === 'UPI') upiSales += order.subtotal
          if (order.paymentMethod === 'CASH') cashSales += order.subtotal
        }
      }

      if (order.paymentStatus === 'PENDING' || order.orderStatus === 'PREPARING') {
        activeOrders++
      }
    })

    const avgOrderValue = todayOrders > 0 ? Math.floor(todaySales / todayOrders) : 0

    return { todayOrders, todaySales, avgOrderValue, upiSales, cashSales, activeOrders }
  }, [orders])

  // Chart data: Last 7 days sales and orders
  const chartData = useMemo(() => {
    const data = {}
    const formatter = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric' })
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = formatter.format(d)
      data[dateStr] = { date: dateStr, sales: 0, orders: 0 }
    }

    orders.forEach(order => {
      if (order.paymentStatus === 'PAID' || order.paymentStatus === 'COMPLETED') {
        const d = new Date(order.createdAt)
        const dateStr = formatter.format(d)
        if (data[dateStr]) {
          data[dateStr].sales += (order.subtotal / 100)
          data[dateStr].orders += 1
        }
      }
    })

    return Object.values(data)
  }, [orders])

  const paymentSplitData = useMemo(() => {
    return [
      { name: 'UPI', value: metrics.upiSales / 100 },
      { name: 'Cash', value: metrics.cashSales / 100 }
    ].filter(d => d.value > 0)
  }, [metrics])

  const PIE_COLORS = ['#3b82f6', '#10b981'] // Blue, Green

  // Menu insights
  const lowStock = menu.filter(m => m.inventory_mode === 'QUANTITY_TRACKED' && m.remaining <= 8 && m.remaining > 0)
  const soldOut = menu.filter(m => {
    if (m.is_active === false) return false
    return !getEffectiveState(m, new Date()).available
  })
  
  const specials = menu.filter(m => {
    if (m.is_active === false) return false
    return getEffectiveState(m, new Date()).special
  })

  const recentActiveOrders = orders
    .filter(o => o.paymentStatus === 'PENDING' || o.orderStatus === 'PREPARING')
    .slice(0, 5)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ElevatedCard 
          title="Today's Sales" 
          value={formatPrice(metrics.todaySales)} 
          subtitle={`${formatPrice(metrics.upiSales)} UPI • ${formatPrice(metrics.cashSales)} Cash`} 
        />
        <ElevatedCard 
          title="Today's Orders" 
          value={metrics.todayOrders} 
        />
        <ElevatedCard 
          title="Average Order Value" 
          value={formatPrice(metrics.avgOrderValue)} 
        />
        <ElevatedCard 
          title="Active Orders" 
          value={metrics.activeOrders} 
          subtitle="Awaiting or Preparing"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="col-span-1 lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sales Bar Chart */}
          <Card className="p-6 overflow-hidden relative shadow-lg ring-1 ring-primary/10">
            <div className="absolute top-0 right-0 p-4 opacity-10 blur-xl">
              <div className="w-32 h-32 bg-primary rounded-full"></div>
            </div>
            <h2 className="text-xl font-bold mb-6 text-foreground">Revenue Flow (7 Days)</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                  <Tooltip 
                    cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'var(--primary)', borderRadius: '0.5rem', color: '#fff', boxShadow: '0 0 15px rgba(var(--primary-rgb), 0.5)' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="sales" fill="var(--primary)" radius={[4, 4, 0, 0]} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Orders Line Chart */}
          <Card className="p-6 overflow-hidden relative shadow-lg ring-1 ring-accent/10">
            <div className="absolute top-0 left-0 p-4 opacity-10 blur-xl">
              <div className="w-32 h-32 bg-accent rounded-full"></div>
            </div>
            <h2 className="text-xl font-bold mb-6 text-foreground">Order Volume Pulse</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'var(--accent)', borderRadius: '0.5rem', color: '#fff', boxShadow: '0 0 15px rgba(var(--accent-rgb), 0.5)' }}
                  />
                  <Line type="monotone" dataKey="orders" stroke="var(--accent)" strokeWidth={4} dot={{ r: 4, fill: 'var(--accent)', strokeWidth: 2, stroke: 'var(--card)' }} activeDot={{ r: 8 }} animationDuration={1500} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="col-span-1 lg:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Split Pie Chart */}
          <Card className="p-6 overflow-hidden relative shadow-lg ring-1 ring-border">
            <h2 className="text-xl font-bold mb-2 text-foreground">Payment Channels</h2>
            <div className="h-64 flex items-center justify-center">
              {paymentSplitData.length === 0 ? (
                <p className="text-muted-foreground text-sm">No sales today yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentSplitData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      animationDuration={1500}
                    >
                      {paymentSplitData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'var(--border)', borderRadius: '0.5rem', color: '#fff' }}
                      formatter={(value) => `₹${value}`}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Live Orders */}
          <Card className="p-6 col-span-1 lg:col-span-2 shadow-lg ring-1 ring-border relative overflow-hidden">
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
              </span>
              <span className="text-xs font-bold text-destructive uppercase tracking-widest">Live</span>
            </div>
            <h2 className="text-xl font-bold mb-6 text-foreground">Active Missions</h2>
          {recentActiveOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm">No active orders right now.</p>
          ) : (
            <div className="space-y-4">
              {recentActiveOrders.map(o => (
                <div key={o.token} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                  <div>
                    <div className="font-mono font-medium">{o.orderNumber}</div>
                    <div className="text-xs text-muted-foreground">{o.customerName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold px-2 py-1 rounded bg-muted">
                      {o.orderStatus === 'PREPARING' ? 'PREPARING' : 'AWAITING'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

      </div>
      </div>

      {/* Inventory Snippets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-l-4 border-l-warning">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            Low Stock 
            <span className="bg-warning/10 text-warning px-2 py-0.5 rounded-full text-xs">{lowStock.length}</span>
          </h3>
          <ul className="text-sm space-y-2">
            {lowStock.length === 0 ? <li className="text-muted-foreground">All items stocked.</li> : null}
            {lowStock.map(item => (
              <li key={item.id} className="flex justify-between">
                <span>{item.name}</span>
                <span className="text-muted-foreground">{item.remaining} left</span>
              </li>
            ))}
          </ul>
        </Card>
        
        <Card className="p-6 border-l-4 border-l-destructive">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            Sold Out
            <span className="bg-destructive/10 text-destructive px-2 py-0.5 rounded-full text-xs">{soldOut.length}</span>
          </h3>
          <ul className="text-sm space-y-2">
            {soldOut.length === 0 ? <li className="text-muted-foreground">Nothing sold out.</li> : null}
            {soldOut.map(item => (
              <li key={item.id}>{item.name}</li>
            ))}
          </ul>
        </Card>

        <Card className="p-6 border-l-4 border-l-accent">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            Today's Specials
            <span className="bg-accent/10 text-accent px-2 py-0.5 rounded-full text-xs">{specials.length}</span>
          </h3>
          <ul className="text-sm space-y-2">
            {specials.length === 0 ? <li className="text-muted-foreground">No specials today.</li> : null}
            {specials.map(item => (
              <li key={item.id}>{item.name}</li>
            ))}
          </ul>
        </Card>
      </div>

    </div>
  )
}
