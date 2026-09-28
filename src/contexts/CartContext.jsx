import { createContext, useContext, useReducer, useEffect } from 'react'

const CartContext = createContext()

const initialState = []

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.find(item => item.id === action.payload.id)
      if (existing) {
        return state.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + (action.payload.quantity || 1) }
            : item
        )
      }
      return [...state, { ...action.payload, quantity: action.payload.quantity || 1 }]
    }
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return state.filter(item => item.id !== action.payload.id)
      }
      return state.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      )
    }
    case 'REMOVE_ITEM': {
      return state.filter(item => item.id !== action.payload.id)
    }
    case 'CLEAR_CART': {
      return []
    }
    case 'INIT_CART': {
      return action.payload
    }
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, initialState)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('campusbite_cart')
      if (saved) {
        dispatch({ type: 'INIT_CART', payload: JSON.parse(saved) })
      }
    } catch (e) {
      console.error('Failed to parse cart from local storage', e)
    }
  }, [])

  // Save to localStorage whenever it changes
  // We use a flag to prevent saving the initial empty state before INIT happens
  useEffect(() => {
    localStorage.setItem('campusbite_cart', JSON.stringify(cart))
  }, [cart])

  const addItem = (item) => dispatch({ type: 'ADD_ITEM', payload: item })
  const updateQuantity = (id, quantity) => dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } })
  const removeItem = (id) => dispatch({ type: 'REMOVE_ITEM', payload: { id } })
  const clearCart = () => dispatch({ type: 'CLEAR_CART' })

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <CartContext.Provider value={{ cart, addItem, updateQuantity, removeItem, clearCart, totalItems, subtotal }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
