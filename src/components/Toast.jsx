import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react'

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const colors = {
  success: 'border-accent-success text-accent-success-light',
  error: 'border-djezzy-red text-djezzy-red',
  warning: 'border-accent-warning text-accent-warning-light',
  info: 'border-accent-info text-accent-info',
}

export default function Toast({ toast }) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setExiting(true), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  if (!toast) return null

  const Icon = icons[toast.type] || icons.info
  const color = colors[toast.type] || colors.info

  return (
    <div className="fixed top-6 right-6 z-[100]">
      <div
        className={`${exiting ? 'toast-exit' : 'toast-enter'} flex items-center gap-3 px-5 py-3.5 rounded-xl border-l-4 ${color} bg-navy-elevated shadow-elevated max-w-sm`}
      >
        <Icon className="w-5 h-5 shrink-0" />
        <p className="text-sm text-text-primary font-medium">{toast.message}</p>
      </div>
    </div>
  )
}
