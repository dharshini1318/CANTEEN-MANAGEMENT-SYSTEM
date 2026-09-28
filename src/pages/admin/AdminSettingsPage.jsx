import { useState, useEffect } from 'react'
import { getSettings, saveSettings, logAuditEvent } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card } from '../../components/ui/card'

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function AdminSettingsPage() {
  const [settings, setSettings] = useState(null)
  const { session } = useAuth()
  
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setSettings(getSettings())
  }, [])

  const handleSave = (e) => {
    e.preventDefault()
    setIsSaving(true)
    saveSettings(settings)
    logAuditEvent(session.username, 'UPDATE_SETTINGS', 'Settings')
    setTimeout(() => setIsSaving(false), 500)
  }

  const handleHourChange = (day, field, value) => {
    setSettings(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours[day],
          [field]: value
        }
      }
    }))
  }

  if (!settings) return null

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 pb-24">
      <h1 className="text-2xl font-bold">Settings</h1>

      <form onSubmit={handleSave} className="space-y-8">
        
        <Card className="p-6 bg-card">
          <h2 className="text-lg font-semibold mb-4">General Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium">Cafeteria Name</label>
              <Input 
                value={settings.cafeteriaName}
                onChange={e => setSettings(prev => ({ ...prev, cafeteriaName: e.target.value }))}
                className="mt-1"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">Displayed to customers on the landing page</p>
            </div>
            <div>
              <label className="text-sm font-medium">UPI VPA</label>
              <Input 
                value={settings.upiVpa}
                onChange={e => setSettings(prev => ({ ...prev, upiVpa: e.target.value }))}
                className="mt-1"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">Used to generate payment QR codes</p>
            </div>
          </div>
        </Card>

        <Card className="p-0 overflow-hidden bg-card">
          <div className="p-6 border-b bg-muted/30">
            <h2 className="text-lg font-semibold">Operating Hours</h2>
            <p className="text-sm text-muted-foreground mt-1">Customers will see "Cafeteria Closed" and cannot place orders outside these hours.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-muted text-muted-foreground text-xs border-b">
                <tr>
                  <th className="px-6 py-4 font-semibold w-40">Day</th>
                  <th className="px-6 py-4 font-semibold text-center w-24">Open</th>
                  <th className="px-6 py-4 font-semibold">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {WEEKDAYS.map(day => {
                  const dayConfig = settings.hours[day] || { isOpen: false, open: '08:00', close: '20:00' }
                  return (
                    <tr key={day} className="hover:bg-muted/30">
                      <td className="px-6 py-4 font-medium">{day}</td>
                      <td className="px-6 py-4 text-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 accent-foreground"
                          checked={dayConfig.isOpen}
                          onChange={e => handleHourChange(day, 'isOpen', e.target.checked)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-3 ${!dayConfig.isOpen ? 'opacity-40 pointer-events-none' : ''}`}>
                          <Input 
                            type="time" 
                            value={dayConfig.open} 
                            onChange={e => handleHourChange(day, 'open', e.target.value)}
                            className="w-32"
                            required={dayConfig.isOpen}
                          />
                          <span className="text-muted-foreground">to</span>
                          <Input 
                            type="time" 
                            value={dayConfig.close} 
                            onChange={e => handleHourChange(day, 'close', e.target.value)}
                            className="w-32"
                            required={dayConfig.isOpen}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  )
}
