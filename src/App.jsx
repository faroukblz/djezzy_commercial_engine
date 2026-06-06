import { Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import Sidebar from './components/Sidebar'
import Toast from './components/Toast'
import MarketingDashboard from './pages/MarketingDashboard'
import SupportDashboard from './pages/SupportDashboard'

function AppContent() {
  const { toast } = useApp()

  return (
    <div className="flex w-full h-screen bg-midnight overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col relative">
        <Routes>
          <Route path="/" element={<Navigate to="/marketing" replace />} />
          <Route path="/marketing" element={<MarketingDashboard />} />
          <Route path="/support" element={<SupportDashboard />} />
        </Routes>
      </main>
      <Toast toast={toast} />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
