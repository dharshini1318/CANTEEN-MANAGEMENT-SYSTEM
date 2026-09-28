import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useTheme } from './ThemeProvider'
import { Button } from './ui/button'
import { Sun, Moon, ShoppingBag, Menu } from 'lucide-react'

export function Navbar() {
  const { totalItems } = useCart()
  const { theme, setTheme } = useTheme()
  const location = useLocation()
  
  return (
    <header className={`${location.pathname === '/' ? 'absolute bg-transparent pointer-events-none' : 'relative border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'} top-0 z-50 w-full`}>
      <div className={`w-full mx-auto px-4 md:px-8 xl:px-12 h-14 flex items-center ${location.pathname === '/' ? 'justify-end pointer-events-auto' : 'justify-between'}`}>
        {location.pathname !== '/' && (
          <div className="flex items-center gap-6">
            <Link to="/" className="font-fraunces font-bold text-xl tracking-tight">
              CampusBite
            </Link>
          </div>
        )}
        
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant={location.pathname === '/' ? 'outline' : 'ghost'}
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={location.pathname === '/' ? "fixed bottom-6 right-6 z-50 rounded-full shadow-lg bg-background/50 backdrop-blur border-border/50" : "rounded-full"}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          
          {location.pathname !== '/' && (
            <Button variant="ghost" size="icon" className="relative rounded-full" asChild>
              <Link to="/cart" state={{ backgroundLocation: location }}>
                <ShoppingBag className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {totalItems}
                  </span>
                )}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
