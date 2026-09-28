import { useState, useEffect, useMemo } from 'react'
import { getMenu, getCategories, getEffectiveState, isWithinOperatingHours, getNextOpening, getSettings } from '../services/api'
import { useCart } from '../contexts/CartContext'
import { formatPrice } from '../utils/format'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Skeleton } from '../components/ui/skeleton'
import { Search, X, Minus, Plus } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

const slogans = [
  "Fuel your day, the South Indian way.",
  "Crispy dosas, hot sambar, ready for you.",
  "Freshly brewed filter coffee to awaken your senses.",
  "Authentic flavors, straight from the kitchen."
];

function AnimatedSlogan() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slogans.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-8 overflow-hidden relative flex flex-col items-center justify-center w-full mt-2">
      {slogans.map((slogan, i) => (
        <div
          key={i}
          className={`absolute transition-all duration-700 ease-in-out text-lg sm:text-xl text-muted-foreground w-full text-center ${
            i === index ? 'opacity-100 translate-y-0' : i < index || (index === 0 && i === slogans.length - 1) ? 'opacity-0 -translate-y-6' : 'opacity-0 translate-y-6'
          }`}
        >
          {slogan}
        </div>
      ))}
    </div>
  )
}

function MenuCard({ item }) {
  const { cart, addItem, updateQuantity } = useCart()
  const cartItem = cart.find(c => c.id === item.id)
  const quantity = cartItem ? cartItem.quantity : 0

  const effectiveState = getEffectiveState(item)
  const isSoldOut = !effectiveState.available
  const isLowStock = item.inventory_mode === 'QUANTITY_TRACKED' && item.remaining > 0 && item.remaining <= 8

  return (
    <Card className={`group flex flex-col overflow-hidden rounded-3xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)] transition-all duration-300 bg-card ${isSoldOut ? 'opacity-70 grayscale-[0.2]' : ''}`}>
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {item.image_url ? (
          <img 
            src={item.image_url} 
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 text-sm bg-muted">
            No image
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none"></div>
        {effectiveState.special && (
          <div className="absolute top-4 left-4 flex items-center gap-1.5 text-xs font-semibold text-white bg-accent/90 backdrop-blur-md px-3 py-1 rounded-full shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            Chef's Special
          </div>
        )}
      </div>
      
      <div className="flex-1 flex flex-col p-5 justify-between gap-4">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-foreground text-lg leading-tight">{item.name}</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{item.description}</p>
        </div>

        <div className="flex items-end justify-between mt-auto pt-2">
          <div className="flex flex-col">
            <span className="font-bold text-lg text-foreground">{formatPrice(item.price)}</span>
            {isSoldOut ? (
              <span className="text-xs font-medium text-destructive mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive"></span> Sold out
              </span>
            ) : item.inventory_mode === 'QUANTITY_TRACKED' ? (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {item.remaining} Available
              </span>
            ) : (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Available
              </span>
            )}
          </div>
          
          <div className="shrink-0">
            {isSoldOut ? (
              <span className="text-sm font-semibold text-muted-foreground bg-muted px-4 py-2 rounded-full min-h-[44px] flex items-center justify-center">Sold out</span>
            ) : quantity > 0 ? (
              <div className="flex items-center bg-primary/10 rounded-full min-h-[44px] h-11 overflow-hidden border border-primary/20 shadow-sm focus-within:ring-2 focus-within:ring-primary/40 focus-within:ring-offset-1 transition-all">
                <button 
                  onClick={() => updateQuantity(item.id, quantity - 1)}
                  className="h-full px-4 text-primary hover:bg-primary/20 transition-colors focus:outline-none min-w-[44px] flex items-center justify-center active:scale-95"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold min-w-[28px] text-center text-primary">{quantity}</span>
                <button 
                  onClick={() => {
                    if (item.inventory_mode === 'QUANTITY_TRACKED' && quantity >= item.remaining) return
                    updateQuantity(item.id, quantity + 1)
                  }}
                  className="h-full px-4 text-primary hover:bg-primary/20 transition-colors focus:outline-none disabled:opacity-50 min-w-[44px] flex items-center justify-center active:scale-95"
                  aria-label="Increase quantity"
                  disabled={item.inventory_mode === 'QUANTITY_TRACKED' && quantity >= item.remaining}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Button 
                size="sm" 
                variant="default" 
                className="min-h-[44px] h-11 px-6 rounded-full font-semibold shadow-md hover:shadow-lg transition-all active:scale-95 focus-visible:ring-offset-2"
                onClick={() => addItem({ id: item.id, name: item.name, price: item.price })}
              >
                Add
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

export function MenuPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { totalItems, subtotal } = useCart()
  const [menu, setMenu] = useState(null)
  const [categories, setCategories] = useState(null)
  const [activeCategory, setActiveCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [cafeteriaName, setCafeteriaName] = useState("CampusBite")
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    getMenu().then(setMenu)
    getCategories().then(setCategories)
    setCafeteriaName(getSettings().cafeteriaName)
  }, [])

  const filteredMenu = useMemo(() => {
    if (!menu) return []
    
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase()
      return menu.filter(item => item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q))
    }
    
    if (activeCategory === "All") {
      return menu
    }
    
    return menu.filter(item => item.category === activeCategory)
  }, [menu, searchQuery, activeCategory])

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Section */}
      <section 
        className="w-full py-28 px-4 bg-gradient-to-b from-primary/5 via-background to-background relative overflow-hidden flex flex-col items-center justify-center text-center isolate"
        style={{
          opacity: Math.max(0, 1 - scrollY / 400),
          transform: `translateY(${scrollY * 0.4}px)`,
        }}
      >
        {/* Subtle decorative blurs with reduced motion support */}
        <div className="absolute top-[-20%] left-[-10%] w-[40rem] h-[40rem] bg-primary/10 rounded-full blur-[120px] -z-10 mix-blend-multiply dark:mix-blend-screen pointer-events-none motion-safe:animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[40rem] h-[40rem] bg-accent/10 rounded-full blur-[120px] -z-10 mix-blend-multiply dark:mix-blend-screen pointer-events-none motion-safe:animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        <h1 className="font-fraunces font-bold tracking-tight text-balance text-6xl sm:text-7xl md:text-8xl text-foreground mb-6 drop-shadow-sm relative z-10">{cafeteriaName}</h1>
        <div className="relative z-10 w-full"><AnimatedSlogan /></div>
        
        <div className="mt-14 w-full max-w-xl relative z-10">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
          <Input 
            placeholder="Search your cravings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-16 pr-14 bg-card/80 backdrop-blur-2xl min-h-[64px] text-lg rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] border-border/50 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:border-primary/60 transition-all hover:shadow-[0_12px_40px_rgb(0,0,0,0.12)]"
            aria-label="Search menu"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-muted transition-colors active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </section>

      {/* Categories */}
      <header className="relative z-40 bg-background border-b border-border/50 py-4 px-4 shadow-sm">
        <div className="w-full px-2 md:px-8 xl:px-12 mx-auto flex overflow-x-auto no-scrollbar gap-3 -mx-4 sm:mx-0 sm:px-0 py-1 sm:justify-center">
            {categories === null ? (
              [1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-24 rounded-full shrink-0" />)
            ) : (
              categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat)
                    setSearchQuery("") // Clear search to show category
                  }}
                  aria-pressed={activeCategory === cat && !searchQuery}
                  className={`shrink-0 px-6 py-2.5 min-h-[44px] rounded-full text-sm font-semibold transition-all duration-300 border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95 ${
                    activeCategory === cat && !searchQuery
                      ? 'bg-foreground text-background border-foreground shadow-md' 
                      : 'bg-card text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground shadow-sm hover:shadow'
                  }`}
                >
                  {cat}
                </button>
              ))
            )}
          </div>
      </header>

      {/* Menu List */}
      <main className="w-full px-4 md:px-8 xl:px-12 mx-auto py-6">
        {!isWithinOperatingHours() ? (
          <div className="py-16 text-center">
            <h2 className="text-2xl font-bold mb-2">Cafeteria Closed</h2>
            <p className="text-muted-foreground">Next opening: {getNextOpening()}</p>
          </div>
        ) : menu === null ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-none">
                <Skeleton className="w-full h-48 rounded-none" />
                <div className="flex-1 p-4 flex flex-col gap-3 justify-between">
                  <div>
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-full mt-2" />
                    <Skeleton className="h-4 w-4/5 mt-1" />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-9 w-16" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredMenu.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No items found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredMenu.map(item => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>

      {/* Cart Indicator */}
      {isWithinOperatingHours() && totalItems > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-50 flex justify-center animate-in slide-in-from-bottom-8 fade-in duration-300">
          <button
            onClick={() => navigate('/cart', { state: { backgroundLocation: location } })}
            className="w-full max-w-sm bg-primary text-primary-foreground px-4 py-3 rounded-xl shadow-lg flex items-center justify-between hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center bg-primary-foreground/20 text-sm w-6 h-6 rounded-full">
                {totalItems}
              </span>
              <span className="font-medium">View cart</span>
            </div>
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </button>
        </div>
      )}
    </div>
  )
}
