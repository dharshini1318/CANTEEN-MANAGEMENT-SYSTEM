import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getTodaysSpecial, getMenu, getSettings } from '../services/api'
import { formatPrice } from '../utils/format'
import { DotOrbBackground } from '../components/ui/dot-orb'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import { Card } from '../components/ui/card'
import { useInView } from '../hooks/use-in-view'
import { ArrowRight } from 'lucide-react'

function FeaturedMenu() {
  const { ref, isInView } = useInView({ threshold: 0.1, triggerOnce: true })
  const [items, setItems] = useState(null)
  const navigate = useNavigate()
  
  useEffect(() => {
    if (isInView && items === null) {
      getMenu().then(menu => {
        // Pick first 6 available items for the featured grid
        const available = menu.filter(m => m.is_available !== false && (m.inventory_mode !== 'QUANTITY_TRACKED' || m.remaining > 0))
        setItems(available.slice(0, 6))
      })
    }
  }, [isInView, items])

  return (
    <section 
      ref={ref} 
      className={`relative z-10 w-full max-w-6xl mx-auto px-6 py-20 fade-in ${isInView ? 'is-visible' : ''}`}
    >
      <div className="flex items-end justify-between mb-10">
        <div>
          <h2 className="text-3xl md:text-4xl font-fraunces font-medium text-foreground">From the kitchen</h2>
          <p className="text-muted-foreground mt-2 text-lg">Fresh, made to order, ready when you are.</p>
        </div>
        <Button variant="ghost" className="hidden sm:flex items-center gap-2" onClick={() => navigate('/menu')}>
          Full menu <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
      
      {items === null ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="overflow-hidden rounded-xl border bg-card shadow-none">
              <Skeleton className="w-full h-48 rounded-none" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <Card 
              key={item.id} 
              className="overflow-hidden rounded-xl border bg-card shadow-none hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => navigate('/menu')}
            >
              <div className="relative h-48 bg-muted overflow-hidden">
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-sm">
                    No image
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium text-foreground text-base">{item.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                <div className="mt-3 font-medium text-primary">{formatPrice(item.price)}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="sm:hidden mt-8 flex justify-center">
        <Button onClick={() => navigate('/menu')} className="w-full max-w-xs">
          View full menu <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </section>
  )
}

function TodaysSpecial() {
  const { ref, isInView } = useInView({ threshold: 0.1, triggerOnce: true })
  const [specials, setSpecials] = useState(null)
  
  useEffect(() => {
    if (isInView && specials === null) {
      getTodaysSpecial().then(setSpecials)
    }
  }, [isInView, specials])

  if (specials !== null && specials.length === 0) return null

  return (
    <section 
      ref={ref} 
      className={`relative z-10 w-full max-w-6xl mx-auto px-6 py-16 fade-in ${isInView ? 'is-visible' : ''}`}
    >
      <h2 className="text-3xl md:text-4xl font-fraunces font-medium text-foreground mb-10">Today's special</h2>
      
      {specials === null ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="pt-4 border-t-2 border-accent flex flex-col gap-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-16 mt-1" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {specials.map(item => (
            <div key={item.id} className="pt-4 border-t-2 border-accent flex flex-col gap-2">
              <h3 className="text-xl font-medium text-foreground">{item.name}</h3>
              <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              <div className="mt-1 text-foreground font-medium">{formatPrice(item.price)}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export function LandingPage() {
  const navigate = useNavigate()
  const [mounted, setMounted] = useState(false)
  const [cafeteriaName, setCafeteriaName] = useState('CampusBite')
  
  useEffect(() => {
    setMounted(true)
    setCafeteriaName(getSettings().cafeteriaName)
  }, [])

  return (
    <div className="h-[100dvh] w-full relative overflow-hidden bg-background">
      
      <div className="fixed inset-0 z-0 motion-reduce:hidden">
        <DotOrbBackground className="w-full h-full" />
      </div>
      
      <main className="relative z-10 flex flex-col h-full justify-center">
        <section className="h-full flex flex-col items-center justify-center px-4 text-center">
          <div 
            className={`fade-in ${mounted ? 'is-visible' : ''}`}
            style={{ transitionDelay: '0ms' }}
          >
          </div>
          <h1 
            className={`font-fraunces text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-foreground mb-4 drop-shadow-sm fade-in ${mounted ? 'is-visible' : ''}`}
            style={{ transitionDelay: '0ms' }}
          >
            {cafeteriaName}
          </h1>
          <h2 
            className={`font-fraunces text-xl sm:text-2xl md:text-3xl text-foreground/80 mb-3 fade-in ${mounted ? 'is-visible' : ''}`}
            style={{ transitionDelay: '120ms' }}
          >
            Fuel your day, the South Indian way.
          </h2>
          <p 
            className={`text-muted-foreground text-base sm:text-lg mb-10 max-w-lg mx-auto fade-in ${mounted ? 'is-visible' : ''}`}
            style={{ transitionDelay: '240ms' }}
          >
            Order ahead. Skip the line. Eat fresh.
          </p>
          <div 
            className={`fade-in ${mounted ? 'is-visible' : ''}`}
            style={{ transitionDelay: '360ms' }}
          >
            <Button size="lg" className="px-8 py-6 text-base" onClick={() => navigate('/menu')}>
              Explore the menu
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </section>

      </main>
    </div>
  )
}
