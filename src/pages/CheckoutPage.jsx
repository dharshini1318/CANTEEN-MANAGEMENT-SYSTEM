import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { formatPrice } from '../utils/format'
import { createOrder, isWithinOperatingHours, getNextOpening } from '../services/api'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { ChevronLeft } from 'lucide-react'

export function CheckoutPage() {
  const { cart, subtotal, clearCart } = useCart()
  const navigate = useNavigate()
  
  const [name, setName] = useState('')
  const [method, setMethod] = useState(null)
  const [nameError, setNameError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateName = (val) => {
    if (!val.trim()) {
      setNameError('Name is required.')
      return false
    }
    if (val.trim().length > 100) {
      setNameError('Name must be 100 characters or less.')
      return false
    }
    setNameError('')
    return true
  }

  const handlePlaceOrder = async () => {
    setSubmitError('')
    if (!validateName(name)) return
    if (!method) return

    setIsSubmitting(true)
    try {
      const order = await createOrder({
        customerName: name.trim(),
        paymentMethod: method,
        items: cart,
      })
      clearCart()
      navigate(`/order/${order.token}`)
    } catch (e) {
      setSubmitError(e.message || 'Something went wrong placing your order — try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-medium mb-4">Your cart's empty</h2>
        <p className="text-muted-foreground mb-8">You need items in your cart to checkout.</p>
        <Button onClick={() => navigate('/menu')}>Browse Menu</Button>
      </div>
    )
  }

  if (!isWithinOperatingHours()) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Cafeteria Closed</h2>
        <p className="text-muted-foreground mb-8">Next opening: {getNextOpening()}</p>
        <Button onClick={() => navigate('/menu')}>Back to Menu</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-14 z-40 bg-background/80 backdrop-blur-md border-b border-border pt-4 pb-4 px-4">
        <div className="max-w-xl mx-auto flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Checkout</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-8 mt-4">
        {/* Order Summary */}
        <section>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-lg font-medium">Order Summary</h2>
            <button 
              onClick={() => navigate('/cart', { state: { backgroundLocation: { pathname: '/menu' } } })}
              className="text-sm text-primary hover:underline"
            >
              Edit cart
            </button>
          </div>
          <Card className="p-4 bg-muted/50 shadow-none border-none">
            <ul className="space-y-3">
              {cart.map(item => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    <span className="mr-2">{item.quantity}x</span> 
                    {item.name}
                  </span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between items-center mt-4 pt-4 border-t font-medium">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
          </Card>
        </section>

        {/* Details */}
        <section>
          <h2 className="text-lg font-medium mb-4">Your Details</h2>
          <div className="space-y-1.5">
            <label htmlFor="customerName" className="text-sm font-medium text-foreground">Name</label>
            <Input 
              id="customerName"
              placeholder="Enter your name" 
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (nameError) validateName(e.target.value)
              }}
              onBlur={() => validateName(name)}
              className={nameError ? 'border-destructive' : ''}
              disabled={isSubmitting}
            />
            {nameError && <p className="text-xs text-destructive">{nameError}</p>}
          </div>
        </section>

        {/* Payment Method */}
        <section>
          <h2 className="text-lg font-medium mb-4">Payment Method</h2>
          <div role="radiogroup" aria-label="Payment Method" className="space-y-3">
            <button
              role="radio"
              aria-checked={method === 'UPI'}
              onClick={() => setMethod('UPI')}
              className={`w-full text-left p-4 rounded-xl border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                method === 'UPI' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-card hover:bg-muted/50'
              }`}
              disabled={isSubmitting}
            >
              <div className="font-medium mb-1">UPI</div>
              <div className="text-sm text-muted-foreground">Scan and pay with any UPI app, then a cashier confirms it.</div>
            </button>
            <button
              role="radio"
              aria-checked={method === 'CASH'}
              onClick={() => setMethod('CASH')}
              className={`w-full text-left p-4 rounded-xl border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                method === 'CASH' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-card hover:bg-muted/50'
              }`}
              disabled={isSubmitting}
            >
              <div className="font-medium mb-1">Cash at Counter</div>
              <div className="text-sm text-muted-foreground">Pay in cash at the counter when you collect your order.</div>
            </button>
          </div>
        </section>

        {submitError && (
          <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20 flex flex-col gap-2">
            <div>{submitError}</div>
            {(submitError.includes('availability') || submitError.includes('price')) && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-fit border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => navigate('/cart', { state: { backgroundLocation: { pathname: '/menu' } } })}
              >
                Review Cart
              </Button>
            )}
          </div>
        )}

        <Button 
          size="lg" 
          className="w-full" 
          onClick={handlePlaceOrder}
          disabled={!name.trim() || !method || isSubmitting}
        >
          {isSubmitting ? 'Placing Order...' : 'Place Order'}
        </Button>
      </main>
    </div>
  )
}
