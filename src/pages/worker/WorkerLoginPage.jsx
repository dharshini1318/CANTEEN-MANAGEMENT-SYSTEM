import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { loginWorker } from '../../services/api'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card } from '../../components/ui/card'

export function WorkerLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { session, login } = useAuth()
  const navigate = useNavigate()

  if (session) {
    const fallback = session.role === 'CASHIER' ? '/worker/cashier' : '/worker/food-service'
    return <Navigate to={fallback} replace />
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const userData = await loginWorker(username, password)
      login(userData)
      navigate(userData.role === 'CASHIER' ? '/worker/cashier' : '/worker/food-service')
    } catch (err) {
      setError('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm p-6 space-y-6 bg-card border shadow-none">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Worker Login</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to your dashboard</p>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Username</label>
            <Input 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              disabled={loading}
              autoComplete="username"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Password</label>
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              disabled={loading}
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !username || !password}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="text-xs text-muted-foreground text-center pt-4 border-t border-border/50">
          <p>Demo accounts:</p>
          <p className="mt-1">cashier1 / cashier123</p>
          <p >foodservice1 / foodservice123</p>
        </div>
      </Card>
    </div>
  )
}
