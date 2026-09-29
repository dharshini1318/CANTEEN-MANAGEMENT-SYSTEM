import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAdminMenu, getCategories, getEffectiveState, saveMenuItem } from '../../services/api'
import { formatPrice } from '../../utils/format'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Search, Plus } from 'lucide-react'

function EffectiveBadge({ item }) {
  if (item.is_active === false) {
    return <span className="px-2 py-0.5 text-[10px] uppercase font-semibold rounded bg-muted text-muted-foreground">Disabled</span>
  }

  const { available, special } = getEffectiveState(item)
  
  if (!available) {
    return <span className="px-2 py-0.5 text-[10px] uppercase font-semibold rounded bg-destructive/10 text-destructive border border-destructive/20">Sold Out</span>
  }
  
  if (special) {
    return <span className="px-2 py-0.5 text-[10px] uppercase font-semibold rounded bg-accent/10 text-accent border border-accent/20">Special</span>
  }

  return <span className="px-2 py-0.5 text-[10px] uppercase font-semibold rounded bg-success/10 text-success border border-success/20">Available</span>
}

export function AdminMenuPage() {
  const [menu, setMenu] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuData, categoriesData] = await Promise.all([
          getAdminMenu(),
          getCategories()
        ])
        setMenu(menuData)
        setCategories(categoriesData)
      } catch (err) {
        console.error("Failed to fetch menu data:", err)
      }
    }
    fetchData()
  }, [])

  const filteredMenu = useMemo(() => {
    return menu.filter(m => {
      if (categoryFilter !== 'ALL' && m.category !== categoryFilter) return false
      
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!m.name.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [menu, search, categoryFilter])

  const toggleActive = async (item) => {
    try {
      const updated = { ...item, is_active: !item.is_active }
      await saveMenuItem(updated)
      setMenu(menu.map(m => m.id === item.id ? updated : m))
    } catch (err) {
      console.error("Failed to toggle active state:", err)
      alert("Failed to save changes. Please try again.")
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Menu Items</h1>
        <Button onClick={() => navigate('/admin/menu/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <select 
          className="px-3 py-2 border rounded-md text-sm bg-background w-full md:w-auto"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="ALL">All Categories</option>
          {categories.map(c => (
            <option key={c.id || c} value={c.name || c}>{c.name || c}</option>
          ))}
        </select>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-muted text-muted-foreground text-xs border-b">
              <tr>
                <th className="px-6 py-4 font-semibold w-16">Image</th>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Price</th>
                <th className="px-6 py-4 font-semibold">Mode</th>
                <th className="px-6 py-4 font-semibold">State</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredMenu.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    No menu items found.
                  </td>
                </tr>
              ) : (
                filteredMenu.map(item => (
                  <tr key={item.id} className={`hover:bg-muted/30 transition-colors ${!item.is_active ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-3">
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                        {item.image_url ? (
                          <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] text-muted-foreground">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      <Link to={`/admin/menu/${item.id}`} className="hover:underline">{item.name}</Link>
                    </td>
                    <td className="px-6 py-4">{item.category}</td>
                    <td className="px-6 py-4">{formatPrice(item.price)}</td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {item.inventory_mode === 'QUANTITY_TRACKED' ? 'TRACKED' : 'AVAILABILITY'}
                    </td>
                    <td className="px-6 py-4">
                      <EffectiveBadge item={item} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleActive(item)}
                          className={item.is_active ? 'text-warning hover:text-warning hover:bg-warning/10' : 'text-success hover:text-success hover:bg-success/10'}
                        >
                          {item.is_active ? 'Disable' : 'Enable'}
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/admin/menu/${item.id}`}>Edit</Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
