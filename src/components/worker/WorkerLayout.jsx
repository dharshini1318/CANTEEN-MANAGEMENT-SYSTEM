import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getWorkers } from '../../services/api'
import { Button } from '../../components/ui/button'
import { useTheme } from '../ThemeProvider'
import { Sun, Moon } from 'lucide-react'
import { Logo } from '../ui/logo'

export function WorkerLayout() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    if (session) {
      // Fallback check can be removed since we use JWT tokens
      // The backend will reject invalid tokens
    }
  }, [session, location.pathname, logout, navigate])

  if (!session) {
    return <Navigate to="/worker" replace />
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="bg-card border-b px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="font-bold text-lg tracking-tight flex items-center gap-2">
            <Logo className="h-5 w-auto" />
          </div>
          <div className="text-sm font-medium px-2 py-1 bg-muted rounded-md text-muted-foreground hidden sm:block">
            {session.username} ({session.role.replace('_', ' ')})
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-full"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              logout()
              navigate('/worker')
            }}
          >
            Logout
          </Button>
        </div>
      </header>
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  )
}

export function ProtectedWorkerRoute({ allowedRole, children }) {
  const { session } = useAuth()

  if (!session) {
    return <Navigate to="/worker" replace />
  }

  if (session.role !== allowedRole) {
    const fallback = session.role === 'CASHIER' ? '/worker/cashier' : '/worker/food-service'
    return <Navigate to={fallback} replace />
  }

  return children
}
