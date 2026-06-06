import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { predictSegment } from '../services/api'
import SMSModal from '../components/SMSModal'
import { SkeletonRow } from '../components/LoadingSkeleton'
import { Upload, Sparkles, Users, BarChart3, DollarSign, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

const SEGMENT_COLORS = [
  { bg: 'bg-accent-info/15', text: 'text-accent-info', label: 'Explorer' },
  { bg: 'bg-djezzy-red/15', text: 'text-djezzy-red', label: 'Power User' },
  { bg: 'bg-accent-success/15', text: 'text-accent-success-light', label: 'Segment 2' },
  { bg: 'bg-accent-violet/15', text: 'text-accent-violet', label: 'Segment 3' },
  { bg: 'bg-accent-warning/15', text: 'text-accent-warning-light', label: 'Segment 4' },
]

const PAGE_SIZE = 15

export default function MarketingDashboard() {
  const { marketingData, showToast } = useApp()
  const [page, setPage] = useState(0)
  const [segments, setSegments] = useState({}) // userId -> cluster_id
  const [loadingSegments, setLoadingSegments] = useState({})
  const [batchLoading, setBatchLoading] = useState(false)
  const [smsModal, setSmsModal] = useState({ open: false, context: '', type: 'marketing' })
  const [searchQuery, setSearchQuery] = useState('')
  const [segmentFilter, setSegmentFilter] = useState('all')

  const data = marketingData || []
  
  const filteredData = useMemo(() => {
    return data.filter(row => {
      const userId = row['Customer ID']?.toString() || ''
      const cluster = segments[userId]
      
      const matchesSearch = userId.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSegment = segmentFilter === 'all' || cluster === Number(segmentFilter)
      
      return matchesSearch && matchesSegment
    })
  }, [data, searchQuery, segmentFilter, segments])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE))
  const pageData = filteredData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const stats = useMemo(() => {
    if (!data.length) return { total: 0, avgGB: 0, avgRevenue: 0 }
    const avgGB = data.reduce((s, r) => s + (r['Avg Monthly GB Download'] || 0), 0) / data.length
    const avgRevenue = data.reduce((s, r) => s + (r['Total Revenue'] || r['Monthly Charge'] || 0), 0) / data.length
    return { total: data.length, avgGB: avgGB.toFixed(1), avgRevenue: avgRevenue.toFixed(0) }
  }, [data])

  const uniqueSegments = useMemo(() => new Set(Object.values(segments)).size, [segments])

  const handleSegmentRow = async (row, idx) => {
    const userId = row['Customer ID'] || `row-${idx}`
    setLoadingSegments((prev) => ({ ...prev, [userId]: true }))

    // Extract numeric features from the row for the API
    const numericCols = Object.entries(row)
      .filter(([key, val]) => typeof val === 'number' && key !== 'Zip Code' && key !== 'Latitude' && key !== 'Longitude' && key !== 'Population')
      .map(([, val]) => val)

    // Pad or trim to 40 features
    const features = numericCols.slice(0, 40)
    while (features.length < 40) features.push(0)

    const { data: result, error } = await predictSegment(features)
    setLoadingSegments((prev) => ({ ...prev, [userId]: false }))

    if (error) {
      showToast(`Segmentation failed: ${error}`, 'error')
    } else {
      setSegments((prev) => ({ ...prev, [userId]: result.cluster_id }))
    }
  }

  const handleBatchSegment = async () => {
    setBatchLoading(true)
    showToast('Running AI segmentation on all users...', 'info')

    // Process in batches of 5 for rate limiting
    for (let i = 0; i < data.length; i += 5) {
      const batch = data.slice(i, i + 5)
      await Promise.all(batch.map((row, bIdx) => handleSegmentRow(row, i + bIdx)))
    }

    setBatchLoading(false)
    showToast('Segmentation complete!', 'success')
  }

  const openSMSModal = (row) => {
    const userId = row['Customer ID'] || 'Unknown'
    const cluster = segments[userId]
    const segLabel = cluster !== undefined ? SEGMENT_COLORS[cluster % SEGMENT_COLORS.length].label : 'Unclassified'
    const context = `Customer ID: ${userId}\nSegment: ${segLabel} (Cluster ${cluster ?? 'N/A'})\nAge: ${row['Age'] || 'N/A'}\nGender: ${row['Gender'] || 'N/A'}\nMonthly GB Download: ${row['Avg Monthly GB Download'] || 'N/A'} GB\nMonthly Charge: ${row['Monthly Charge'] || 'N/A'} DZD\nContract: ${row['Contract'] || 'N/A'}\nInternet Type: ${row['Internet Type'] || 'N/A'}\nTenure: ${row['Tenure in Months'] || 'N/A'} months`
    setSmsModal({ open: true, context, type: 'marketing' })
  }

  // Empty state
  if (!data.length) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="glass-card p-12 text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-djezzy-red/10 flex items-center justify-center mx-auto mb-5">
            <Upload className="w-8 h-8 text-djezzy-red" />
          </div>
          <h2 className="font-display text-xl font-bold text-text-primary mb-2">
            Upload Marketing Data
          </h2>
          <p className="text-sm text-text-secondary mb-1">
            Upload <code className="px-1.5 py-0.5 rounded bg-navy-mid text-xs font-mono text-accent-info">daily_fetch_simulation.csv</code> from the segmentation model to begin.
          </p>
          <p className="text-xs text-text-muted">
            Use the Upload CSV button in the sidebar →
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl font-bold text-text-primary">Marketing Campaign Engine</h2>
        <p className="text-sm text-text-secondary mt-1">AI-powered customer segmentation & personalized SMS generation</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent-info/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-accent-info" />
            </div>
            <div>
              <p className="text-[11px] text-text-muted font-medium">Total Users</p>
              <p className="text-xl font-bold text-text-primary">{stats.total.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="glass-card px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent-success/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-accent-success-light" />
            </div>
            <div>
              <p className="text-[11px] text-text-muted font-medium">Segments Found</p>
              <p className="text-xl font-bold text-text-primary">{uniqueSegments}</p>
            </div>
          </div>
        </div>
        <div className="glass-card px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent-violet/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-accent-violet" />
            </div>
            <div>
              <p className="text-[11px] text-text-muted font-medium">Avg GB/Month</p>
              <p className="text-xl font-bold text-text-primary">{stats.avgGB} GB</p>
            </div>
          </div>
        </div>
        <div className="glass-card px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-djezzy-red/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-djezzy-red" />
            </div>
            <div>
              <p className="text-[11px] text-text-muted font-medium">Avg Revenue</p>
              <p className="text-xl font-bold text-text-primary">{stats.avgRevenue} DZD</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls: Search, Filter, Batch Segment */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search Customer ID..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            className="px-3.5 py-2 rounded-lg bg-navy-mid border border-border-subtle focus:border-djezzy-red focus:outline-none text-sm text-text-primary placeholder:text-text-muted transition-colors w-full md:w-64"
          />
          <select
            value={segmentFilter}
            onChange={(e) => { setSegmentFilter(e.target.value); setPage(0); }}
            className="px-3.5 py-2 rounded-lg bg-navy-mid border border-border-subtle focus:border-djezzy-red focus:outline-none text-sm text-text-primary transition-colors"
          >
            <option value="all">All Segments</option>
            {SEGMENT_COLORS.map((seg, i) => (
              <option key={i} value={i}>{seg.label} (Cluster {i})</option>
            ))}
            <option value="unclassified">Unclassified</option>
          </select>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <p className="text-xs text-text-muted">{Object.keys(segments).length} of {data.length} users segmented</p>
        <button
          onClick={handleBatchSegment}
          disabled={batchLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-djezzy-red hover:bg-djezzy-red-dark disabled:opacity-50 text-white text-sm font-semibold transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          {batchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {batchLoading ? 'Segmenting...' : 'Run AI Segmentation'}
        </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                {['Customer ID', 'Age', 'Gender', 'GB/Month', 'Monthly Charge', 'Contract', 'Internet', 'Segment', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {pageData.map((row, i) => {
                const userId = row['Customer ID'] || `row-${page * PAGE_SIZE + i}`
                const cluster = segments[userId]
                const isLoading = loadingSegments[userId]
                const seg = cluster !== undefined ? SEGMENT_COLORS[cluster % SEGMENT_COLORS.length] : null

                return (
                  <tr key={userId} className="hover:bg-navy-mid/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-accent-info">{userId}</td>
                    <td className="px-4 py-3 text-text-primary">{row['Age'] || '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{row['Gender'] || '—'}</td>
                    <td className="px-4 py-3 text-text-primary font-medium">{row['Avg Monthly GB Download'] || '—'}</td>
                    <td className="px-4 py-3 text-text-primary">{row['Monthly Charge'] || '—'}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{row['Contract'] || '—'}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{row['Internet Type'] || '—'}</td>
                    <td className="px-4 py-3">
                      {isLoading ? (
                        <div className="skeleton h-5 w-20 rounded-full" />
                      ) : seg ? (
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${seg.bg} ${seg.text}`}>
                          {seg.label}
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openSMSModal(row)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-navy-mid hover:bg-navy-hover border border-border-subtle text-text-secondary hover:text-djezzy-red text-xs font-medium transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        SMS
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border-subtle">
          <p className="text-xs text-text-muted">
            Showing {filteredData.length === 0 ? 0 : page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredData.length)} of {filteredData.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg hover:bg-navy-mid disabled:opacity-30 text-text-muted transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs text-text-secondary">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg hover:bg-navy-mid disabled:opacity-30 text-text-muted transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* SMS Modal */}
      <SMSModal
        isOpen={smsModal.open}
        onClose={() => setSmsModal({ open: false, context: '', type: 'marketing' })}
        context={smsModal.context}
        type={smsModal.type}
      />
    </div>
  )
}
