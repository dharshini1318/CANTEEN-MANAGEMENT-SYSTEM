import { useState, useEffect } from 'react'
import { Outlet, Navigate, useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getWorkers } from '../../services/api'
import { useTheme } from '../ThemeProvider'
import { Button } from '../../components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../../components/ui/sheet'
import { Menu, LogOut, LayoutDashboard, ShoppingBag, Receipt, Utensils, Users, BarChart3, Settings, AlertCircle, Sun, Moon } from 'lucide-react'

const navItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
  { label: 'Transactions', path: '/admin/transactions', icon: Receipt },
  { label: 'Menu & Inventory', path: '/admin/menu', icon: Utensils },
  { label: 'Categories', path: '/admin/categories', icon: Utensils },
  { label: 'Workers', path: '/admin/workers', icon: Users },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Daily Closing', path: '/admin/daily-closing', icon: Receipt },
  { label: 'Audit Logs', path: '/admin/audit-logs', icon: AlertCircle },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
]

function SidebarContent({ pathname, onNavigate }) {
  return (
    <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
      {navItems.map(item => {
        const Icon = item.icon
        const isActive = pathname === item.path
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-base font-medium transition-colors ${
              isActive 
                ? 'bg-primary/10 text-primary' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon className="w-5 h-5" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function AdminLayout() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    if (session) {
      // Fallback check can be removed since we use JWT tokens
      // The backend will reject invalid tokens
    }
  }, [session, location.pathname, logout, navigate])

  if (!session || session.role !== 'ADMIN') {
    return <Navigate to="/admin/login" replace />
  }

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-background flex text-foreground font-sans">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-card sticky top-0 h-screen shrink-0">
        <div className="h-16 flex items-center justify-between px-6 border-b">
          <div className="font-bold text-lg tracking-tight">CampusBite Admin</div>
        </div>
        <SidebarContent pathname={location.pathname} />
        <div className="p-4 border-t space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 mr-3" /> : <Moon className="w-5 h-5 mr-3" />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Mobile Header */}
        <header className="md:hidden h-16 border-b bg-card flex items-center justify-between px-4 sticky top-0 z-40">
          <div className="font-bold text-lg tracking-tight">CampusBite</div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-full"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 flex flex-col">
                <SheetHeader className="h-16 border-b flex items-center px-6 justify-center text-left">
                  <SheetTitle className="font-bold text-lg tracking-tight">Admin Panel</SheetTitle>
                </SheetHeader>
                <SidebarContent 
                  pathname={location.pathname} 
                  onNavigate={() => setMobileOpen(false)} 
                />
                <div className="p-4 border-t">
                  <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
                    <LogOut className="w-5 h-5 mr-3" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

    </div>
  )
}

export function ProtectedAdminRoute({ children }) {
  const { session } = useAuth()

  if (!session || session.role !== 'ADMIN') {
    return <Navigate to="/admin/login" replace />
  }

  return children
}
