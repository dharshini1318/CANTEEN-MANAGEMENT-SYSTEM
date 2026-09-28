import { useState, useEffect } from 'react'
import { getWorkers, saveWorkers, logAuditEvent } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card } from '../../components/ui/card'
import { Plus, UserX, UserCheck, Key, Shield } from 'lucide-react'

export function AdminWorkersPage() {
  const [workers, setWorkers] = useState([])
  const { session } = useAuth()
  
  // Create form state
  const [showCreate, setShowCreate] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newRole, setNewRole] = useState('CASHIER')
  const [newPassword, setNewPassword] = useState('')

  // Temporary password display
  const [tempPasswordMsg, setTempPasswordMsg] = useState(null)

  useEffect(() => {
    setWorkers(getWorkers())
  }, [])

  const handleSave = (updatedWorkers) => {
    saveWorkers(updatedWorkers)
    setWorkers(updatedWorkers)
  }

  const handleCreate = (e) => {
    e.preventDefault()
    if (!newUsername.trim() || !newPassword.trim()) return

    const newWorker = {
      id: `worker-${Date.now()}`,
      username: newUsername.trim(),
      role: newRole,
      password: newPassword,
      isActive: true,
      mustChangePassword: true,
      createdAt: new Date().toISOString()
    }

    const updated = [...workers, newWorker]
    handleSave(updated)
    logAuditEvent(session.username, 'CREATE_WORKER', newWorker.username, { role: newRole })
    
    setShowCreate(false)
    setNewUsername('')
    setNewPassword('')
    setNewRole('CASHIER')
  }

  const toggleStatus = (worker) => {
    const updated = workers.map(w => w.id === worker.id ? { ...w, isActive: !w.isActive } : w)
    handleSave(updated)
    const action = worker.isActive ? 'DISABLE_WORKER' : 'ENABLE_WORKER'
    logAuditEvent(session.username, action, worker.username)
  }

  const changeRole = (worker, newRole) => {
    if (worker.role === newRole) return
    const updated = workers.map(w => w.id === worker.id ? { ...w, role: newRole } : w)
    handleSave(updated)
    logAuditEvent(session.username, 'CHANGE_WORKER_ROLE', worker.username, { oldRole: worker.role, newRole })
  }

  const resetPassword = (worker) => {
    const tempPass = Math.random().toString(36).slice(-8)
    const updated = workers.map(w => w.id === worker.id ? { ...w, password: tempPass, mustChangePassword: true } : w)
    handleSave(updated)
    logAuditEvent(session.username, 'RESET_WORKER_PASSWORD', worker.username)
    setTempPasswordMsg(`Password for ${worker.username} reset to: ${tempPass}`)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Worker Accounts</h1>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Worker
        </Button>
      </div>

      {tempPasswordMsg && (
        <Card className="p-4 border-primary/50 bg-primary/5 flex justify-between items-center">
          <span className="text-primary font-medium">{tempPasswordMsg}</span>
          <Button variant="ghost" size="sm" onClick={() => setTempPasswordMsg(null)}>Dismiss</Button>
        </Card>
      )}

      {showCreate && (
        <Card className="p-6 bg-card border">
          <h2 className="text-lg font-semibold mb-4">Create New Worker</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-sm font-medium">Username</label>
              <Input required value={newUsername} onChange={e => setNewUsername(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <select 
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm mt-1"
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
              >
                <option value="CASHIER">Cashier</option>
                <option value="FOOD_SERVICE">Food Service</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Initial Password</label>
              <Input required value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit">Create</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-muted text-muted-foreground text-xs border-b">
              <tr>
                <th className="px-6 py-4 font-semibold">Username</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {workers.map(worker => (
                <tr key={worker.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium">{worker.username}</td>
                  <td className="px-6 py-4">
                    <select 
                      className="px-2 py-1 border rounded text-xs bg-background"
                      value={worker.role}
                      onChange={e => changeRole(worker, e.target.value)}
                      disabled={worker.username === session.username} // Can't change own role
                    >
                      <option value="CASHIER">Cashier</option>
                      <option value="FOOD_SERVICE">Food Service</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    {worker.isActive ? (
                      <span className="px-2 py-1 text-[10px] uppercase font-semibold rounded bg-success/10 text-success">Active</span>
                    ) : (
                      <span className="px-2 py-1 text-[10px] uppercase font-semibold rounded bg-muted text-muted-foreground">Disabled</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        title="Reset Password"
                        onClick={() => resetPassword(worker)}
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                      
                      <Button 
                        variant={worker.isActive ? 'secondary' : 'outline'}
                        size="sm"
                        disabled={worker.username === session.username} // Can't disable self
                        onClick={() => toggleStatus(worker)}
                        title={worker.isActive ? "Disable Worker" : "Enable Worker"}
                      >
                        {worker.isActive ? <UserX className="w-4 h-4 text-warning" /> : <UserCheck className="w-4 h-4 text-success" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
