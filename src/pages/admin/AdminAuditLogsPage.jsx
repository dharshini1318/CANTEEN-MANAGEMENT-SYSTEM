import { useState, useEffect, useMemo } from 'react'
import { getAuditLogs } from '../../services/api'
import { Input } from '../../components/ui/input'
import { Search } from 'lucide-react'
import { formatPrice } from '../../utils/format'

export function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([])
  const [actionFilter, setActionFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  useEffect(() => {
    getAuditLogs().then(setLogs).catch(console.error)
  }, [])

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (actionFilter !== 'ALL' && log.action !== actionFilter) return false
      
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!log.actor.toLowerCase().includes(q) && !log.entity.toLowerCase().includes(q)) {
          return false
        }
      }
      return true
    })
  }, [logs, search, actionFilter])

  const actions = Array.from(new Set(logs.map(l => l.action)))

  const formatDetails = (log) => {
    const d = log.details || {}
    if (log.action === 'CONFIRM_PAYMENT') return `${d.method || ''} • ${formatPrice(d.amount || 0)}`
    if (log.action === 'CREATE_WORKER') return `Role: ${d.role || ''}`
    if (log.action === 'CHANGE_WORKER_ROLE') return `${d.oldRole || ''} ➔ ${d.newRole || ''}`
    if (log.action === 'CLOSE_DAY') return `Total Sales: ${formatPrice(d.totalSales || 0)}`
    if (log.action === 'ADD_CORRECTION') return `${formatPrice(d.amount || 0)} (${d.reason || ''})`
    return '—'
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Audit Logs</h1>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search actor or entity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <select 
          className="px-3 py-2 border rounded-md text-sm bg-background w-full md:w-auto"
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
        >
          <option value="ALL">All Actions</option>
          {actions.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-muted text-muted-foreground text-xs border-b">
              <tr>
                <th className="px-6 py-4 font-semibold w-48">Timestamp</th>
                <th className="px-6 py-4 font-semibold w-32">Actor</th>
                <th className="px-6 py-4 font-semibold">Action</th>
                <th className="px-6 py-4 font-semibold">Entity</th>
                <th className="px-6 py-4 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-muted/30">
                    <td className="px-6 py-3 text-muted-foreground text-xs">
                      {new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' }).format(new Date(log.created_at || log.timestamp))}
                    </td>
                    <td className="px-6 py-3">
                      <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-xs font-medium">{log.actor}</span>
                    </td>
                    <td className="px-6 py-3 text-xs">{log.action}</td>
                    <td className="px-6 py-3 font-medium">{log.entity}</td>
                    <td className="px-6 py-3 text-muted-foreground text-xs">{formatDetails(log)}</td>
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
