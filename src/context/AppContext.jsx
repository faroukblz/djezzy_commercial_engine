import { createContext, useContext, useState, useCallback } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [currentRole, setCurrentRole] = useState('marketing')
  const [marketingData, setMarketingData] = useState(null)
  const [supportData, setSupportData] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const value = {
    currentRole,
    setCurrentRole,
    marketingData,
    setMarketingData,
    supportData,
    setSupportData,
    toast,
    showToast,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
