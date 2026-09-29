import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getOrderByToken } from '../services/api'
import { formatPrice } from '../utils/format'
import { Logo } from '../components/ui/logo'
import { Button } from '../components/ui/button'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { ChevronLeft } from 'lucide-react'

export function ReceiptPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exportError, setExportError] = useState('')
  const receiptRef = useRef(null)

  useEffect(() => {
    getOrderByToken(token).then(data => {
      setOrder(data)
      setLoading(false)
    })
  }, [token])

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

  if (order.paymentStatus !== 'PAID') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-xl font-medium mb-4">Your receipt will be available once payment is confirmed</h2>
        <Button onClick={() => navigate(`/order/${token}`)}>Back to Order Tracking</Button>
      </div>
    )
  }

  const formatterDate = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })

  const formatterTime = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })

  const createdAt = new Date(order.createdAt)
  const formattedDate = formatterDate.format(createdAt)
  const formattedTime = formatterTime.format(createdAt)

  const downloadPNG = async () => {
    setExportError('')
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff'
      })
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = `CampusBite_${order.orderNumber}.png`
      a.click()
    } catch (e) {
      setExportError("Couldn't generate the download — try again")
    }
  }

  const downloadPDF = async () => {
    setExportError('')
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff'
      })
      
      const imgData = canvas.toDataURL('image/png')
      
      // Calculate dimensions. Max width 80mm.
      const pdfWidth = 80
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      })
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`CampusBite_${order.orderNumber}.pdf`)
    } catch (e) {
      setExportError("Couldn't generate the download — try again")
    }
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 flex flex-col items-center">
      <div className="w-full max-w-[340px] flex items-center mb-6">
        <Link to={`/order/${token}`} className="text-muted-foreground hover:text-foreground flex items-center text-sm font-medium transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Order
        </Link>
      </div>

      <div 
        ref={receiptRef}
        className="w-full max-w-[340px] bg-white text-black p-6 font-mono text-sm leading-relaxed"
        style={{ color: '#000000', backgroundColor: '#ffffff' }}
      >
        <div className="text-center mb-4">
          <Logo className="h-24 w-auto mx-auto mb-3" />
          <div>CAMPUS CAFETERIA</div>
        </div>
        
        <div className="border-t border-dashed border-black/30 my-4" />
        
        <div>Order ID: {order.orderNumber}</div>
        <div>Name: {order.customerName}</div>
        <div className="flex justify-between">
          <span>Date: {formattedDate}</span>
          <span>Time: {formattedTime}</span>
        </div>
        
        <div className="border-t border-dashed border-black/30 my-4" />
        
        <div className="flex justify-between font-bold mb-2">
          <span className="w-1/2">ITEM</span>
          <span className="w-1/6 text-right">QTY</span>
          <span className="w-1/3 text-right">AMT</span>
        </div>
        
        {order.items.map(item => (
          <div key={item.id} className="flex justify-between mb-1">
            <span className="w-1/2 break-words pr-2">{item.name}</span>
            <span className="w-1/6 text-right">{item.quantity}</span>
            <span className="w-1/3 text-right">{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
        
        <div className="border-t border-dashed border-black/30 my-4" />
        
        <div className="flex justify-between font-bold text-base mb-2">
          <span>TOTAL</span>
          <span>{formatPrice(order.subtotal)}</span>
        </div>
        <div>Payment: {order.paymentMethod === 'UPI' ? 'UPI' : 'Cash'}</div>
        <div>Status: ✓ PAID</div>
        
        <div className="border-t border-dashed border-black/30 my-4" />
        
        <div className="text-center">
          <div className="mb-1">PICKUP CODE</div>
          <div className="text-3xl font-bold tracking-widest">{order.pickupCode}</div>
        </div>
        
        <div className="border-t border-dashed border-black/30 my-4" />
        
        <div className="text-center">Thank You!</div>
      </div>

      <div className="w-full max-w-[340px] mt-8 flex flex-col gap-3">
        {exportError && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20 text-center">
            {exportError}
          </div>
        )}
        <Button variant="outline" onClick={downloadPNG} aria-label="Download receipt as PNG image">
          Download as PNG
        </Button>
        <Button variant="outline" onClick={downloadPDF} aria-label="Download receipt as PDF document">
          Download as PDF
        </Button>
      </div>
    </div>
  )
}
