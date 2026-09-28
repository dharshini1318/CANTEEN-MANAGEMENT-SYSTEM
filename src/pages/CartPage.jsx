import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../components/ui/sheet'
import { useCart } from '../contexts/CartContext'
import { formatPrice } from '../utils/format'
import { Button } from '../components/ui/button'
import { Minus, Plus, Trash2 } from 'lucide-react'

export function CartPage({ standalone = false }) {
  const { cart, updateQuantity, removeItem, subtotal } = useCart()
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)
  const isNavigatingAway = useRef(false)

  // Disable transitions if user prefers reduced motion
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen)
    if (!isOpen && !isNavigatingAway.current) {
      if (prefersReducedMotion) {
        navigate(-1)
      } else {
        setTimeout(() => navigate(-1), 300)
      }
    }
  }

  const handleRemove = (id) => {
    if (prefersReducedMotion) {
      removeItem(id)
      return
    }
    
    const el = document.getElementById(`cart-item-${id}`)
    if (el) {
      el.style.opacity = '0'
      el.style.height = '0'
      el.style.paddingTop = '0'
      el.style.paddingBottom = '0'
      el.style.marginTop = '0'
      el.style.marginBottom = '0'
      el.style.overflow = 'hidden'
      setTimeout(() => removeItem(id), 250)
    } else {
      removeItem(id)
    }
  }

  const CartContentBody = () => (
    <div className="flex flex-col h-full max-h-full">
      <SheetHeader className="pb-6 border-b shrink-0">
        <SheetTitle className="text-2xl font-semibold">Your Cart</SheetTitle>
      </SheetHeader>
      
      <div className="flex-1 overflow-y-auto py-6 no-scrollbar">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <p className="text-muted-foreground text-lg">Your cart's empty.</p>
            <Button variant="outline" onClick={() => navigate('/menu')}>
              Browse Menu
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {cart.map(item => (
              <div 
                id={`cart-item-${item.id}`}
                key={item.id} 
                className="flex gap-4 items-start transition-all duration-250 ease-out overflow-hidden"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-foreground leading-snug">{item.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{formatPrice(item.price)}</p>
                </div>
                
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center bg-secondary rounded-md h-8 overflow-hidden">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="h-full px-2 text-secondary-foreground hover:bg-muted focus:outline-none"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs w-6 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="h-full px-2 text-secondary-foreground hover:bg-muted focus:outline-none"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm">{formatPrice(item.price * item.quantity)}</span>
                    <button 
                      onClick={() => handleRemove(item.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="pt-6 border-t mt-auto shrink-0">
          <div className="flex justify-between items-center mb-6">
            <span className="font-medium text-lg">Subtotal</span>
            <span className="font-semibold text-lg">{formatPrice(subtotal)}</span>
          </div>
          <Button 
            className="w-full" 
            size="lg"
            onClick={() => {
              isNavigatingAway.current = true
              setOpen(false)
              setTimeout(() => navigate('/checkout'), prefersReducedMotion ? 0 : 300)
            }}
          >
            Proceed to Checkout
          </Button>
        </div>
      )}
    </div>
  )

  if (standalone) {
    return (
      <div className="min-h-screen bg-background pt-8 pb-12 px-4">
        <div className="max-w-md mx-auto h-[85vh] border rounded-xl bg-card p-6 flex flex-col">
          <CartContentBody />
        </div>
      </div>
    )
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-6 h-full">
        <CartContentBody />
      </SheetContent>
    </Sheet>
  )
}
