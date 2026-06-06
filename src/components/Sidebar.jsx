import { useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { BarChart3, ShieldAlert, Upload, Zap } from 'lucide-react'
import Papa from 'papaparse'

const navItems = [
  { id: 'marketing', label: 'Marketing Engine', icon: BarChart3, path: '/marketing' },
  { id: 'support', label: 'Fraud Detection', icon: ShieldAlert, path: '/support' },
]

export default function Sidebar() {
  const { setCurrentRole, setMarketingData, setSupportData, showToast } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const fileRef = useRef(null)

  const handleNav = (item) => {
    setCurrentRole(item.id)
    navigate(item.path)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cols = results.meta.fields || []
        // Detect which CSV it is by checking for unique columns
        if (cols.includes('Customer ID') || cols.includes('Avg Monthly GB Download')) {
          setMarketingData(results.data)
          setCurrentRole('marketing')
          navigate('/marketing')
          showToast(`Marketing data loaded: ${results.data.length} users`, 'success')
        } else if (cols.includes('isFraud') || cols.includes('balanceChangeOrig')) {
          // For support data, limit to first 5000 rows for browser performance
          const limited = results.data.slice(0, 5000)
          setSupportData(limited)
          setCurrentRole('support')
          navigate('/support')
          showToast(`Support data loaded: ${limited.length} transactions (of ${results.data.length})`, 'success')
        } else {
          showToast('Unrecognized CSV format. Expected marketing or support simulation data.', 'error')
        }
      },
      error: (err) => {
        showToast(`CSV parse error: ${err.message}`, 'error')
      },
    })

    // Reset so the same file can be re-uploaded
    e.target.value = ''
  }

  return (
    <aside className="w-64 h-screen flex flex-col bg-navy border-r border-border-subtle shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border-subtle">
        <div className="w-9 h-9 rounded-lg bg-djezzy-red flex items-center justify-center shadow-glow-red">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-display text-base font-bold text-text-primary tracking-tight">Djezzy AI Hub</h1>
          <p className="text-[11px] text-text-muted font-medium">Telecom Intelligence</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 pb-2 text-[10px] font-semibold text-text-muted uppercase tracking-widest">Modules</p>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer
                ${isActive
                  ? 'bg-djezzy-red/10 text-djezzy-red border-l-[3px] border-djezzy-red pl-[9px]'
                  : 'text-text-secondary hover:bg-navy-mid hover:text-text-primary border-l-[3px] border-transparent pl-[9px]'
                }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Upload Button */}
      <div className="px-3 pb-5">
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileUpload}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-navy-mid hover:bg-navy-hover border border-border-subtle hover:border-border-strong text-text-secondary hover:text-text-primary text-sm font-medium transition-all duration-200 cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          Upload CSV Data
        </button>
        <p className="mt-2 text-center text-[10px] text-text-muted">
          Auto-detects Marketing or Support CSV
        </p>
      </div>
    </aside>
  )
}
