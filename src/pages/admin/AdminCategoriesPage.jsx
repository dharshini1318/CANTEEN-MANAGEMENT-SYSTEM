import { useState, useEffect } from 'react'
import { getCategories, updateCategories, getAdminMenu } from '../../services/api'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card } from '../../components/ui/card'
import { ArrowUp, ArrowDown, Edit2, Plus, AlertTriangle, Trash2 } from 'lucide-react'

// Mock categories are just strings in the store initially, 
// but to support "disable" we should either convert them to objects or filter them.
// Wait, the prompt says "disabling a category... won't be filterable... but still under All".
// Since they are strings, we need to upgrade the category schema to objects: { id, name, is_active }
// If we only have strings, we can migrate them on load.

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [menu, setMenu] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [showWarning, setShowWarning] = useState(null) // ID of category to disable

  useEffect(() => {
    // Migration: If categories are strings, convert to objects
    getCategories().then(data => {
      if (data.length > 0 && typeof data[0] === 'string') {
        const migrated = data.filter(c => c !== 'All').map(name => ({ id: name.toLowerCase(), name, is_active: true }))
        setCategories(migrated)
        updateCategories(migrated)
      } else {
        setCategories(data)
      }
    }).catch(console.error)
    getAdminMenu().then(setMenu).catch(console.error)
  }, [])

  const saveToStore = (newCats) => {
    setCategories(newCats)
    updateCategories(newCats)
  }

  const handleMove = (index, direction) => {
    if (direction === -1 && index === 0) return
    if (direction === 1 && index === categories.length - 1) return
    
    const newCats = [...categories]
    const temp = newCats[index]
    newCats[index] = newCats[index + direction]
    newCats[index + direction] = temp
    saveToStore(newCats)
  }

  const handleAdd = () => {
    const name = 'New Category'
    const newCats = [...categories, { id: Date.now().toString(), name, is_active: true }]
    saveToStore(newCats)
    setEditingId(newCats[newCats.length - 1].id)
    setEditName(name)
  }

  const handleSaveRename = (id) => {
    if (!editName.trim()) return
    const newCats = categories.map(c => c.id === id ? { ...c, name: editName.trim() } : c)
    saveToStore(newCats)
    setEditingId(null)
  }

  const handleAttemptDisable = (cat) => {
    if (!cat.is_active) {
      // Re-enable
      saveToStore(categories.map(c => c.id === cat.id ? { ...c, is_active: true } : c))
      return
    }

    const activeItems = menu.filter(m => m.category === cat.name && m.is_active)
    if (activeItems.length > 0) {
      setShowWarning({ cat, count: activeItems.length })
    } else {
      saveToStore(categories.map(c => c.id === cat.id ? { ...c, is_active: false } : c))
    }
  }

  const confirmDisable = () => {
    saveToStore(categories.map(c => c.id === showWarning.cat.id ? { ...c, is_active: false } : c))
    setShowWarning(null)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Button onClick={handleAdd} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {showWarning && (
        <Card className="p-4 border-warning/50 bg-warning/5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
            <div>
              <h3 className="font-semibold text-warning">Active items found</h3>
              <p className="text-sm text-foreground/80 mt-1">
                This category has {showWarning.count} active items. If you disable it, they will no longer be filterable by category on the customer menu, but will still appear under "All".
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowWarning(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={confirmDisable}>Disable Anyway</Button>
          </div>
        </Card>
      )}

      <div className="bg-card border rounded-lg overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No categories defined.</div>
        ) : (
          <div className="divide-y">
            {categories.map((cat, index) => {
              const itemCount = menu.filter(m => m.category === cat.name && m.is_active).length

              return (
                <div key={cat.id} className={`flex items-center justify-between p-4 transition-colors ${!cat.is_active ? 'opacity-60 bg-muted/30' : ''}`}>
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex flex-col gap-1">
                      <button 
                        disabled={index === 0} 
                        onClick={() => handleMove(index, -1)}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button 
                        disabled={index === categories.length - 1} 
                        onClick={() => handleMove(index, 1)}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1">
                      {editingId === cat.id ? (
                        <div className="flex items-center gap-2">
                          <Input 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(cat.id)}
                            autoFocus
                            className="w-48 h-8 text-sm"
                          />
                          <Button size="sm" onClick={() => handleSaveRename(cat.id)}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className={`font-medium ${!cat.is_active ? 'line-through' : ''}`}>{cat.name}</span>
                          <button 
                            onClick={() => { setEditingId(cat.id); setEditName(cat.name) }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">{itemCount} items</div>
                    </div>
                  </div>

                  <div>
                    <Button 
                      variant={cat.is_active ? "outline" : "secondary"}
                      size="sm"
                      onClick={() => handleAttemptDisable(cat)}
                    >
                      {cat.is_active ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
