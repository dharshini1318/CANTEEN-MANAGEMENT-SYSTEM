import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMenuItem, getCategories, saveMenuItem, getEffectiveState, uploadImage } from '../../services/api'
import { formatPrice, parsePrice } from '../../utils/format'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card } from '../../components/ui/card'
import { ChevronLeft } from 'lucide-react'

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function AdminMenuItemPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [categories, setCategories] = useState([])
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('DETAILS')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const res = await uploadImage(file)
      setItem({ ...item, image_url: res.url })
    } catch (err) {
      alert(err.message || 'Image upload failed')
    } finally {
      setUploadingImage(false)
      e.target.value = '' // Reset input
    }
  }

  // Form states
  const [priceStr, setPriceStr] = useState('')
  const [stockAddReason, setStockAddReason] = useState('')
  const [stockAddAmount, setStockAddAmount] = useState('')

  // Override future form
  const [overrideDate, setOverrideDate] = useState('')
  const [overrideType, setOverrideType] = useState('SPECIAL')
  const [overrideValue, setOverrideValue] = useState(true)

  const isNew = id === 'new'

  useEffect(() => {
    getCategories().then(cats => setCategories(cats.map(c => c.name || c).filter(c => c !== 'All'))).catch(console.error)
    
    if (isNew) {
      setItem({
        id: `item-${Date.now()}`,
        name: '',
        description: '',
        price: 0,
        category: '',
        is_active: true,
        inventory_mode: 'AVAILABILITY_ONLY',
        remaining: 0,
        image_url: '',
        schedules: {},
        overrides: [],
        inventory_log: []
      })
      setPriceStr('0')
      setLoading(false)
    } else {
      const fetchData = async () => {
        try {
          const data = await getMenuItem(id)
          if (!data) {
            navigate('/admin/menu')
            return
          }
          setItem(data)
          setPriceStr((data.price / 100).toString())
        } catch (err) {
          console.error("Failed to fetch menu item:", err)
        } finally {
          setLoading(false)
        }
      }
      fetchData()
    }
  }, [id, navigate, isNew])

  const handleSave = async (updatedItem = item) => {
    await saveMenuItem(updatedItem)
    setItem(updatedItem)
    if (isNew) {
      navigate(`/admin/menu/${updatedItem.id}`, { replace: true })
    }
  }

  const handleDetailsSave = async (e) => {
    e.preventDefault()
    const finalPrice = parsePrice(priceStr)
    const updated = { ...item, price: finalPrice }
    if (isNew && updated.inventory_mode === 'QUANTITY_TRACKED') {
      updated.inventory_log = [{
        type: 'INITIAL',
        change: updated.remaining,
        reason: 'Initial setup',
        timestamp: new Date().toISOString()
      }]
    }
    await handleSave(updated)
  }

  const handleToggleActive = () => {
    setShowConfirmModal(true)
  }

  const confirmToggleActive = async () => {
    const updated = { ...item, is_active: !item.is_active }
    await handleSave(updated)
    setShowConfirmModal(false)
  }

  const handleStockAdjust = async (e) => {
    e.preventDefault()
    const amount = parseInt(stockAddAmount)
    if (isNaN(amount) || amount === 0 || !stockAddReason.trim()) return

    const updated = { ...item }
    updated.remaining += amount
    updated.inventory_log = [
      {
        type: 'MANUAL',
        change: amount,
        reason: stockAddReason,
        timestamp: new Date().toISOString()
      },
      ...(updated.inventory_log || [])
    ]
    await handleSave(updated)
    setStockAddAmount('')
    setStockAddReason('')
  }

  const handleScheduleToggle = async (day, field) => {
    const updated = { ...item }
    if (!updated.schedules) updated.schedules = {}
    
    // Default is available: true, special: false
    const currentDay = updated.schedules[day] || { available: true, special: false }
    const newDay = { ...currentDay, [field]: !currentDay[field] }
    
    // If it matches default exactly, remove the row
    if (newDay.available === true && newDay.special === false) {
      delete updated.schedules[day]
    } else {
      updated.schedules[day] = newDay
    }
    
    await handleSave(updated)
  }

  const applyOverrideForToday = async (type, value) => {
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
    await addOverride(todayStr, type, value)
  }

  const revertOverrideForToday = async (type) => {
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
    const updated = { ...item }
    updated.overrides = (updated.overrides || []).filter(o => !(o.date === todayStr && o.type === type))
    await handleSave(updated)
  }

  const addOverride = async (dateStr, type, value) => {
    if (!dateStr) return
    const updated = { ...item }
    updated.overrides = (updated.overrides || []).filter(o => !(o.date === dateStr && o.type === type))
    updated.overrides.push({ date: dateStr, type, value })
    await handleSave(updated)
    
    setOverrideDate('')
  }

  if (loading) return null

  // Compute Today's State for Overrides Tab
  const todayDate = new Date()
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(todayDate)
  const todayWeekday = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' }).format(todayDate)
  
  const todayEffective = getEffectiveState(item, todayDate)
  const todayScheduled = item.schedules?.[todayWeekday] || { available: true, special: false }
  
  const todayOverrideSpecial = (item.overrides || []).find(o => o.date === todayStr && o.type === 'SPECIAL')
  const todayOverrideAvailable = (item.overrides || []).find(o => o.date === todayStr && o.type === 'AVAILABLE')

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/menu')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{isNew ? 'New Menu Item' : item.name}</h1>
          {!isNew && (
            <div className="flex gap-2 mt-1">
              {!item.is_active && <span className="text-[10px] uppercase tracking-wider font-semibold bg-muted px-2 py-0.5 rounded text-muted-foreground">Disabled</span>}
              {todayEffective.special && <span className="text-[10px] uppercase tracking-wider font-semibold bg-accent/10 px-2 py-0.5 rounded text-accent">Special</span>}
            </div>
          )}
        </div>
      </div>

      <div className="flex border-b">
        {['DETAILS', 'INVENTORY', 'SCHEDULE', 'OVERRIDES'].map(tab => {
          if (tab === 'INVENTORY' && item.inventory_mode !== 'QUANTITY_TRACKED') return null
          
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab 
                  ? 'border-primary text-foreground' 
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          )
        })}
      </div>

      {activeTab === 'DETAILS' && (
        <Card className="p-6">
          <form onSubmit={handleDetailsSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input required value={item.name} onChange={e => setItem({ ...item, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea 
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    rows={3}
                    value={item.description}
                    onChange={e => setItem({ ...item, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Price (₹)</label>
                    <Input required type="number" step="0.01" min="0" value={priceStr} onChange={e => setPriceStr(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <select 
                      required
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      value={item.category}
                      onChange={e => setItem({ ...item, category: e.target.value })}
                    >
                      <option value="" disabled>Select category</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Image URL</label>
                  <div className="flex gap-2 mt-1">
                    <Input placeholder="https://..." value={item.image_url || ''} onChange={e => setItem({ ...item, image_url: e.target.value })} className="flex-1" />
                    <div className="relative overflow-hidden inline-block">
                      <Button type="button" variant="outline" disabled={uploadingImage}>
                        {uploadingImage ? 'Uploading...' : 'Upload'}
                      </Button>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploadingImage}
                      />
                    </div>
                  </div>
                  {item.image_url && (
                    <div className="mt-3 aspect-video w-full rounded-lg bg-muted overflow-hidden">
                      <img src={item.image_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Inventory Mode</label>
                  <select 
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm mt-1"
                    value={item.inventory_mode}
                    disabled={!isNew}
                    onChange={e => setItem({ ...item, inventory_mode: e.target.value })}
                  >
                    <option value="AVAILABILITY_ONLY">Availability Only</option>
                    <option value="QUANTITY_TRACKED">Quantity Tracked</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {!isNew ? 'Inventory mode cannot be changed after creation.' : ''}
                  </p>
                </div>

                {isNew && item.inventory_mode === 'QUANTITY_TRACKED' && (
                  <div>
                    <label className="text-sm font-medium">Initial Stock Quantity</label>
                    <Input required type="number" min="0" value={item.remaining} onChange={e => setItem({ ...item, remaining: parseInt(e.target.value) || 0 })} />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t">
              {!isNew ? (
                <Button 
                  type="button" 
                  variant={item.is_active ? "destructive" : "default"} 
                  onClick={handleToggleActive}
                >
                  {item.is_active ? 'Disable Item' : 'Enable Item'}
                </Button>
              ) : <div></div>}
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'INVENTORY' && item.inventory_mode === 'QUANTITY_TRACKED' && (
        <div className="space-y-6">
          <Card className="p-6 border-l-4 border-l-primary">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Current Stock</h3>
            <div className="text-4xl font-bold">{item.remaining}</div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Adjust Stock</h3>
            <form onSubmit={handleStockAdjust} className="flex gap-4 items-end">
              <div className="w-32">
                <label className="text-sm font-medium">Adjustment (+/-)</label>
                <Input required type="number" placeholder="-5 or 10" value={stockAddAmount} onChange={e => setStockAddAmount(e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium">Reason</label>
                <Input required placeholder="e.g. Restock from kitchen, Waste" value={stockAddReason} onChange={e => setStockAddReason(e.target.value)} />
              </div>
              <Button type="submit">Update</Button>
            </form>
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="p-4 bg-muted border-b font-semibold">Activity Log</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-card text-muted-foreground text-xs border-b">
                  <tr>
                    <th className="px-4 py-2 font-medium">Time</th>
                    <th className="px-4 py-2 font-medium">Type</th>
                    <th className="px-4 py-2 font-medium">Change</th>
                    <th className="px-4 py-2 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(item.inventory_log || []).map((log, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }).format(new Date(log.timestamp))}
                      </td>
                      <td className="px-4 py-3 text-xs">{log.type}</td>
                      <td className="px-4 py-3 font-medium">{log.change > 0 ? `+${log.change}` : log.change}</td>
                      <td className="px-4 py-3">{log.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'SCHEDULE' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-6 bg-muted border-b">
            <h3 className="font-semibold">Weekly Schedule</h3>
            <p className="text-sm text-muted-foreground mt-1">Defaults: Available, Not Special. Only changes from default are saved.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-card text-muted-foreground border-b">
                <tr>
                  <th className="px-6 py-4 font-semibold">Day</th>
                  <th className="px-6 py-4 font-semibold text-center">Available</th>
                  <th className="px-6 py-4 font-semibold text-center">Special</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {WEEKDAYS.map(day => {
                  const sched = item.schedules?.[day] || { available: true, special: false }
                  return (
                    <tr key={day} className="hover:bg-muted/30">
                      <td className="px-6 py-4 font-medium">{day}</td>
                      <td className="px-6 py-4 text-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 accent-foreground"
                          checked={sched.available} 
                          onChange={() => handleScheduleToggle(day, 'available')} 
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 accent-foreground"
                          checked={sched.special} 
                          onChange={() => handleScheduleToggle(day, 'special')} 
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'OVERRIDES' && (
        <div className="space-y-6">
          <Card className="p-6 border-l-4 border-l-primary flex justify-between items-center bg-primary/5">
            <div>
              <h3 className="text-sm font-semibold text-primary mb-1">Today's Effective State</h3>
              <p className="text-xl font-bold">
                {todayEffective.special ? 'Special' : 'Not Special'} • {todayEffective.available ? 'Available' : 'Unavailable'}
              </p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>Schedule: {todayScheduled.special ? 'Special' : 'Not Special'}</p>
              {(todayOverrideSpecial || todayOverrideAvailable) && <p className="text-primary font-medium mt-1">Override Active</p>}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Today's Overrides</h3>
            
            <div className="space-y-4">
              {/* Special Override Logic */}
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Special Status</p>
                  <p className="text-sm text-muted-foreground">Scheduled as {todayScheduled.special ? 'Special' : 'Not Special'}</p>
                </div>
                <div>
                  {todayOverrideSpecial ? (
                    <Button variant="outline" onClick={() => revertOverrideForToday('SPECIAL')}>Revert to Schedule</Button>
                  ) : (
                    todayScheduled.special ? (
                      <Button variant="secondary" onClick={() => applyOverrideForToday('SPECIAL', false)}>Remove today's special</Button>
                    ) : (
                      <Button variant="secondary" onClick={() => applyOverrideForToday('SPECIAL', true)}>Make today's special</Button>
                    )
                  )}
                </div>
              </div>

              {/* Available Override Logic */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">Availability</p>
                  <p className="text-sm text-muted-foreground">Scheduled as {todayScheduled.available ? 'Available' : 'Unavailable'}</p>
                </div>
                <div>
                  {todayOverrideAvailable ? (
                    <Button variant="outline" onClick={() => revertOverrideForToday('AVAILABLE')}>Revert to Schedule</Button>
                  ) : (
                    todayScheduled.available ? (
                      <Button variant="secondary" onClick={() => applyOverrideForToday('AVAILABLE', false)}>Make unavailable today</Button>
                    ) : (
                      <Button variant="secondary" onClick={() => applyOverrideForToday('AVAILABLE', true)}>Make available today</Button>
                    )
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Schedule Future Override</h3>
            <form onSubmit={(e) => { e.preventDefault(); addOverride(overrideDate, overrideType, overrideValue) }} className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input required type="date" value={overrideDate} onChange={e => setOverrideDate(e.target.value)} min={todayStr} className="w-auto" />
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <select className="flex h-9 w-32 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm mt-1" value={overrideType} onChange={e => setOverrideType(e.target.value)}>
                  <option value="SPECIAL">Special</option>
                  <option value="AVAILABLE">Available</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Value</label>
                <select className="flex h-9 w-32 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm mt-1" value={overrideValue.toString()} onChange={e => setOverrideValue(e.target.value === 'true')}>
                  <option value="true">True (Yes)</option>
                  <option value="false">False (No)</option>
                </select>
              </div>
              <Button type="submit">Add Override</Button>
            </form>

            {item.overrides && item.overrides.length > 0 && (
              <div className="mt-8">
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">All Overrides</h4>
                <div className="space-y-2">
                  {item.overrides.map((ov, i) => (
                    <div key={i} className="flex justify-between items-center text-sm p-2 bg-muted rounded">
                      <span><span className="mr-3">{ov.date}</span> {ov.type}: {ov.value.toString()}</span>
                      <button onClick={() => addOverride(ov.date, ov.type, !ov.value)} className="text-muted-foreground hover:text-foreground">Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {showConfirmModal && item && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl shadow-lg w-full max-w-sm p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">{item.is_active ? 'Disable' : 'Enable'} Item?</h2>
            <p className="text-muted-foreground mb-6 text-sm">
              Are you sure you want to {item.is_active ? 'disable' : 'enable'} {item.name}? It will be {item.is_active ? 'hidden from' : 'visible on'} the menu.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowConfirmModal(false)}>
                Cancel
              </Button>
              <Button variant={item.is_active ? "destructive" : "default"} className="flex-1" onClick={confirmToggleActive}>
                Yes, {item.is_active ? 'Disable' : 'Enable'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
