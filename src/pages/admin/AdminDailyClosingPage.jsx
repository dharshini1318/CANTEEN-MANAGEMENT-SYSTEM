import { useState, useEffect, useMemo } from 'react'
import { getAllOrders, getClosings, saveClosing, addCorrection, logAuditEvent } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { formatPrice } from '../../utils/format'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card } from '../../components/ui/card'

export function AdminDailyClosingPage() {
  const [orders, setOrders] = useState([])
  const [closings, setClosings] = useState([])
  const { session } = useAuth()
  
  const [correctionDesc, setCorrectionDesc] = useState('')
  const [correctionAmount, setCorrectionAmount] = useState('')

  useEffect(() => {
    getAllOrders().then(setOrders)
    setClosings(getClosings())
  }, [])

  const todayStr = useMemo(() => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
  }, [])

  const todayClosing = closings.find(c => c.date === todayStr)
  const isClosed = !!todayClosing

  const todayMetrics = useMemo(() => {
    if (isClosed) return todayClosing

    let totalOrders = 0
    let totalSales = 0
    let upiTotal = 0
    let cashTotal = 0
    let upiCount = 0
    let cashCount = 0
    let expiredCount = 0

    orders.forEach(order => {
      const orderDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(order.createdAt))
      if (orderDate === todayStr) {
        totalOrders++
        
        if (order.paymentStatus === 'PAID' || order.paymentStatus === 'COMPLETED') {
          totalSales += order.subtotal
          if (order.paymentMethod === 'UPI') {
            upiTotal += order.subtotal
            upiCount++
          } else if (order.paymentMethod === 'CASH') {
            cashTotal += order.subtotal
            cashCount++
          }
        }
        if (order.paymentStatus === 'EXPIRED') {
          expiredCount++
        }
      }
    })

    return { totalOrders, totalSales, upiTotal, cashTotal, upiCount, cashCount, expiredCount }
  }, [orders, isClosed, todayClosing, todayStr])

  const handleCloseDay = () => {
    if (isClosed) return
    const closingRecord = {
      date: todayStr,
      ...todayMetrics,
      closedBy: session.username,
      closedAt: new Date().toISOString(),
      corrections: []
    }
    saveClosing(closingRecord)
    setClosings(getClosings())
    logAuditEvent(session.username, 'CLOSE_DAY', todayStr, { totalSales: todayMetrics.totalSales })
  }

  const handleCorrection = (e) => {
    e.preventDefault()
    const amount = parseInt(correctionAmount)
    if (isNaN(amount) || amount === 0 || !correctionDesc.trim()) return

    const correction = {
      description: correctionDesc,
      amount: amount * 100, // assume input in INR, need paise if they type raw. Wait, formatPrice takes paise. If they type 10 for 10rs, we do 1000. Let's ask for INR.
      timestamp: new Date().toISOString()
    }
    
    addCorrection(todayStr, correction)
    setClosings(getClosings())
    logAuditEvent(session.username, 'ADD_CORRECTION', todayStr, { amount: correction.amount, reason: correctionDesc })
    
    setCorrectionDesc('')
    setCorrectionAmount('')
  }

  const sortedClosings = [...closings].sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold">Daily Closing</h1>
          <p className="text-muted-foreground mt-1">Business Date: {new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long' }).format(new Date())}</p>
        </div>
        <Button 
          size="lg" 
          disabled={isClosed} 
          onClick={handleCloseDay}
          variant={isClosed ? 'secondary' : 'default'}
        >
          {isClosed ? 'Day Closed' : 'Close Day'}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-card">
          <div className="text-sm text-muted-foreground mb-1">Total Sales</div>
          <div className="text-2xl font-bold">{formatPrice(todayMetrics.totalSales)}</div>
        </Card>
        <Card className="p-4 bg-card">
          <div className="text-sm text-muted-foreground mb-1">UPI Revenue</div>
          <div className="text-2xl font-bold">{formatPrice(todayMetrics.upiTotal)}</div>
          <div className="text-xs text-muted-foreground mt-1">{todayMetrics.upiCount} orders</div>
        </Card>
        <Card className="p-4 bg-card">
          <div className="text-sm text-muted-foreground mb-1">Cash Revenue</div>
          <div className="text-2xl font-bold">{formatPrice(todayMetrics.cashTotal)}</div>
          <div className="text-xs text-muted-foreground mt-1">{todayMetrics.cashCount} orders</div>
        </Card>
        <Card className="p-4 bg-card">
          <div className="text-sm text-muted-foreground mb-1">Order Activity</div>
          <div className="text-2xl font-bold">{todayMetrics.totalOrders} total</div>
          <div className="text-xs text-muted-foreground mt-1">{todayMetrics.expiredCount} expired</div>
        </Card>
      </div>

      {isClosed && (
        <Card className="p-6 border-warning/50 bg-warning/5">
          <h3 className="font-semibold mb-4">Add Correction</h3>
          <form onSubmit={handleCorrection} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium">Description</label>
              <Input required placeholder="e.g. Cash shortage, refund..." value={correctionDesc} onChange={e => setCorrectionDesc(e.target.value)} />
            </div>
            <div className="w-32">
              <label className="text-sm font-medium">Amount (₹)</label>
              <Input required type="number" placeholder="-50 or 20" value={correctionAmount} onChange={e => setCorrectionAmount(e.target.value)} />
            </div>
            <Button type="submit">Submit Correction</Button>
          </form>

          {todayClosing.corrections && todayClosing.corrections.length > 0 && (
            <div className="mt-6 space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Today's Corrections</h4>
              {todayClosing.corrections.map((corr, i) => (
                <div key={i} className="flex justify-between items-center text-sm p-2 bg-background border rounded">
                  <span>{corr.description}</span>
                  <span className="font-medium text-warning">{corr.amount > 0 ? '+' : ''}{formatPrice(corr.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <div>
        <h2 className="text-xl font-bold mb-4 mt-12">Closing History</h2>
        <div className="bg-card border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-muted text-muted-foreground text-xs border-b">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Total Orders</th>
                  <th className="px-6 py-4 font-semibold text-right">UPI Total</th>
                  <th className="px-6 py-4 font-semibold text-right">Cash Total</th>
                  <th className="px-6 py-4 font-semibold text-right">Total Sales</th>
                  <th className="px-6 py-4 font-semibold">Closed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedClosings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">No past closing records found.</td>
                  </tr>
                ) : (
                  sortedClosings.map(c => (
                    <tr key={c.date} className="hover:bg-muted/30">
                      <td className="px-6 py-4 font-medium">{c.date}</td>
                      <td className="px-6 py-4">{c.totalOrders}</td>
                      <td className="px-6 py-4 text-right">{formatPrice(c.upiTotal)}</td>
                      <td className="px-6 py-4 text-right">{formatPrice(c.cashTotal)}</td>
                      <td className="px-6 py-4 font-bold text-right">{formatPrice(c.totalSales)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-xs font-medium">{c.closedBy}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  )
}
