import { useState, useMemo, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { predictFraud } from '../services/api'
import SMSModal from '../components/SMSModal'
import FraudGauge from '../components/FraudGauge'
import ExplainabilityPanel from '../components/ExplainabilityPanel'
import { SkeletonGauge } from '../components/LoadingSkeleton'
import { Upload, Search, ShieldAlert, Activity, DollarSign, TrendingDown, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function SupportDashboard() {
  const { supportData, showToast } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTx, setSelectedTx] = useState(null)
  const [fraudResult, setFraudResult] = useState(null)
  const [scoring, setScoring] = useState(false)
  const [smsModal, setSmsModal] = useState({ open: false, context: '', type: 'approve' })
  const [scoredClients, setScoredClients] = useState([])
  const [autoScoring, setAutoScoring] = useState(false)
  const [minFraudProb, setMinFraudProb] = useState(0)

  const data = supportData || []

  useEffect(() => {
    if (data.length > 0 && scoredClients.length === 0 && !autoScoring) {
      const scoreFirstTen = async () => {
        setAutoScoring(true)
        const firstTen = data.slice(0, 10)
        
        const results = await Promise.all(firstTen.map(async (tx, idx) => {
          const payload = {
            step: tx.step,
            type: tx.type,
            amount: tx.amount,
            oldbalanceOrg: tx.oldbalanceOrg,
            newbalanceOrig: tx.newbalanceOrig,
            oldbalanceDest: tx.oldbalanceDest,
            newbalanceDest: tx.newbalanceDest,
            balanceChangeOrig: tx.balanceChangeOrig,
            balanceChangeDest: tx.balanceChangeDest,
            errorBalanceOrig: tx.errorBalanceOrig,
            errorBalanceDest: tx.errorBalanceDest,
          }
          const { data: res } = await predictFraud(payload)
          return { ...tx, _id: idx, fraudResult: res }
        }))
        
        setScoredClients(results)
        setAutoScoring(false)
      }
      scoreFirstTen()
    }
  }, [data, autoScoring, scoredClients.length])

  const stats = useMemo(() => {
    if (!data.length) return { total: 0, fraudRate: 0, avgAmount: 0 }
    const fraudCount = data.filter((r) => r.isFraud === 1).length
    const avgAmount = data.reduce((s, r) => s + (r.amount || 0), 0) / data.length
    return {
      total: data.length,
      fraudRate: ((fraudCount / data.length) * 100).toFixed(2),
      avgAmount: avgAmount.toFixed(0),
    }
  }, [data])

  const handleSearch = async () => {
    const idx = parseInt(searchQuery, 10)
    if (isNaN(idx) || idx < 0 || idx >= data.length) {
      showToast(`Invalid Transaction ID. Enter a number between 0 and ${data.length - 1}.`, 'error')
      return
    }
    const tx = data[idx]
    setSelectedTx({ ...tx, _id: idx })
    setFraudResult(null)

    // Auto-score the transaction
    setScoring(true)
    const payload = {
      step: tx.step,
      type: tx.type,
      amount: tx.amount,
      oldbalanceOrg: tx.oldbalanceOrg,
      newbalanceOrig: tx.newbalanceOrig,
      oldbalanceDest: tx.oldbalanceDest,
      newbalanceDest: tx.newbalanceDest,
      balanceChangeOrig: tx.balanceChangeOrig,
      balanceChangeDest: tx.balanceChangeDest,
      errorBalanceOrig: tx.errorBalanceOrig,
      errorBalanceDest: tx.errorBalanceDest,
    }
    const { data: result, error } = await predictFraud(payload)
    setScoring(false)

    if (error) {
      showToast(`Fraud scoring failed: ${error}`, 'error')
    } else {
      setFraudResult(result)
    }
  }

  const openSMSModal = (type) => {
    const tx = selectedTx
    const context = `Transaction ID: ${tx._id}\nType: ${tx.type}\nAmount: ${Number(tx.amount)?.toLocaleString()} DZD\nFraud Probability: ${((fraudResult?.fraud_probability || 0) * 100).toFixed(1)}%\nIs Fraud: ${fraudResult?.is_fraud ? 'YES' : 'NO'}\nTop Risk Features: ${(fraudResult?.top_risk_features || []).map(f => f.feature).join(', ')}\nOriginal Balance: ${Number(tx.oldbalanceOrg)?.toLocaleString()}\nNew Balance: ${Number(tx.newbalanceOrig)?.toLocaleString()}`
    setSmsModal({ open: true, context, type })
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
            Upload Support Data
          </h2>
          <p className="text-sm text-text-secondary mb-1">
            Upload <code className="px-1.5 py-0.5 rounded bg-navy-mid text-xs font-mono text-accent-info">support_daily_fetch_simulation.csv</code> from the fraud model to begin.
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
        <h2 className="font-display text-2xl font-bold text-text-primary">Customer Support Hub</h2>
        <p className="text-sm text-text-secondary mt-1">Real-time fraud detection, TabNet explainability & refund handling</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent-info/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-accent-info" />
            </div>
            <div>
              <p className="text-[11px] text-text-muted font-medium">Transactions Loaded</p>
              <p className="text-xl font-bold text-text-primary">{stats.total.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="glass-card px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-djezzy-red/10 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-djezzy-red" />
            </div>
            <div>
              <p className="text-[11px] text-text-muted font-medium">Ground Truth Fraud Rate</p>
              <p className="text-xl font-bold text-text-primary">{stats.fraudRate}%</p>
            </div>
          </div>
        </div>
        <div className="glass-card px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent-warning/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-accent-warning-light" />
            </div>
            <div>
              <p className="text-[11px] text-text-muted font-medium">Avg Transaction Amount</p>
              <p className="text-xl font-bold text-text-primary">{Number(stats.avgAmount).toLocaleString()} DZD</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-card px-5 py-4">
        <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">
          Live Search — Enter Transaction ID
        </label>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={`Enter row index (0 to ${data.length - 1})...`}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-navy-mid border border-border-subtle focus:border-djezzy-red focus:outline-none text-sm text-text-primary placeholder:text-text-muted transition-colors"
            />
          </div>
          <button
            onClick={handleSearch}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-djezzy-red hover:bg-djezzy-red-dark text-white text-sm font-semibold transition-all cursor-pointer"
          >
            <Search className="w-4 h-4" />
            Score
          </button>
        </div>
      </div>

      {/* Scored Clients List */}
      {(scoredClients.length > 0 || autoScoring) && (
        <div className="glass-card overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between px-5 py-4 border-b border-border-subtle gap-4">
            <h3 className="text-sm font-semibold text-text-primary">Recent Transactions (Auto-Scored)</h3>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <label className="text-xs text-text-muted whitespace-nowrap">Min Risk Score:</label>
              <select
                value={minFraudProb}
                onChange={(e) => setMinFraudProb(Number(e.target.value))}
                className="px-3 py-1.5 rounded-lg bg-navy-mid border border-border-subtle focus:border-djezzy-red focus:outline-none text-xs text-text-primary transition-colors w-full md:w-auto"
              >
                <option value={0}>All Levels (0%+)</option>
                <option value={14}>Suspicious (&gt;14%)</option>
                <option value={50}>High Risk (&gt;50%)</option>
                <option value={80}>Critical (&gt;80%)</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {autoScoring ? (
              <div className="flex flex-col items-center justify-center p-8 gap-3">
                <Loader2 className="w-6 h-6 text-djezzy-red animate-spin" />
                <p className="text-xs text-text-secondary">Auto-scoring first 10 transactions with TabNet...</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle bg-navy-elevated/50">
                    {['ID', 'Type', 'Amount', 'Old Bal (Orig)', 'Risk Score', 'Decision', 'Action'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {scoredClients.filter(c => ((c.fraudResult?.fraud_probability || 0) * 100) >= minFraudProb).map(client => {
                    const prob = (client.fraudResult?.fraud_probability || 0) * 100;
                    const isFraud = client.fraudResult?.is_fraud;
                    
                    return (
                      <tr key={client._id} className="hover:bg-navy-mid/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-accent-info">#{client._id}</td>
                        <td className="px-4 py-3 text-text-secondary text-xs font-semibold">{client.type}</td>
                        <td className="px-4 py-3 text-text-primary font-medium">{Number(client.amount)?.toLocaleString()} DZD</td>
                        <td className="px-4 py-3 text-text-secondary">{Number(client.oldbalanceOrg)?.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${prob > 50 ? 'text-djezzy-red bg-djezzy-red/10' : prob > 14 ? 'text-accent-warning-light bg-accent-warning/10' : 'text-accent-success-light bg-accent-success/10'}`}>
                            {prob.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isFraud ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-djezzy-red uppercase">
                              <ShieldAlert className="w-3 h-3" /> Flagged
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-accent-success-light uppercase">
                              <CheckCircle className="w-3 h-3" /> Legit
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => {
                              setSelectedTx(client);
                              setFraudResult(client.fraudResult);
                              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                            }}
                            className="px-3 py-1.5 rounded-lg bg-navy-mid hover:bg-navy-hover border border-border-subtle hover:border-border-strong hover:text-djezzy-red text-xs font-medium text-text-secondary transition-colors cursor-pointer"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Results Panel */}
      {selectedTx && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Profile + Gauge */}
          <div className="space-y-6">
            {/* User Profile Card */}
            <div className="glass-card px-6 py-5">
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-widest mb-4">Transaction Profile</h3>
              <div className="grid grid-cols-2 gap-4">
                <ProfileField label="Transaction ID" value={`#${selectedTx._id}`} />
                <ProfileField label="Type" value={selectedTx.type} highlight />
                <ProfileField label="Amount" value={`${Number(selectedTx.amount)?.toLocaleString()} DZD`} />
                <ProfileField label="Step" value={selectedTx.step} />
                <ProfileField label="Old Balance (Orig)" value={Number(selectedTx.oldbalanceOrg)?.toLocaleString()} />
                <ProfileField label="New Balance (Orig)" value={Number(selectedTx.newbalanceOrig)?.toLocaleString()} />
                <ProfileField label="Old Balance (Dest)" value={Number(selectedTx.oldbalanceDest)?.toLocaleString()} />
                <ProfileField label="New Balance (Dest)" value={Number(selectedTx.newbalanceDest)?.toLocaleString()} />
                <ProfileField label="Ground Truth" value={selectedTx.isFraud === 1 ? 'FRAUD' : 'LEGIT'} highlight={selectedTx.isFraud === 1} />
              </div>
            </div>

            {/* Fraud Gauge */}
            <div className="glass-card px-6 py-6">
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-widest mb-4 text-center">
                AI Fraud Risk Score
              </h3>
              {scoring ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Loader2 className="w-8 h-8 text-djezzy-red animate-spin" />
                  <p className="text-sm text-text-secondary">Scoring with TabNet...</p>
                </div>
              ) : fraudResult ? (
                <FraudGauge
                  probability={fraudResult.fraud_probability}
                  threshold={fraudResult.optimal_threshold}
                />
              ) : (
                <SkeletonGauge />
              )}
            </div>
          </div>

          {/* Right: Explainability + Actions */}
          <div className="space-y-6">
            {/* Explainability */}
            {fraudResult && (
              <div className="glass-card px-6 py-5">
                <ExplainabilityPanel features={fraudResult.top_risk_features || []} />
              </div>
            )}

            {/* Decision info */}
            {fraudResult && (
              <div className={`glass-card px-6 py-4 border-l-4 ${fraudResult.is_fraud ? 'border-djezzy-red' : 'border-accent-success'}`}>
                <div className="flex items-center gap-3">
                  {fraudResult.is_fraud ? (
                    <ShieldAlert className="w-6 h-6 text-djezzy-red" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-accent-success-light" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {fraudResult.is_fraud ? 'FLAGGED AS SUSPICIOUS' : 'TRANSACTION APPEARS LEGITIMATE'}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      Decision threshold: {((fraudResult.optimal_threshold || 0.139) * 100).toFixed(1)}% | Score: {((fraudResult.fraud_probability || 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {fraudResult && (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => openSMSModal('approve')}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent-success/15 hover:bg-accent-success/25 border border-accent-success/30 text-accent-success-light text-sm font-semibold transition-all cursor-pointer"
                >
                  <CheckCircle className="w-5 h-5" />
                  Approve Refund
                </button>
                <button
                  onClick={() => openSMSModal('deny')}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-djezzy-red/15 hover:bg-djezzy-red/25 border border-djezzy-red/30 text-djezzy-red text-sm font-semibold transition-all cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                  Deny Refund
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SMS Modal */}
      <SMSModal
        isOpen={smsModal.open}
        onClose={() => setSmsModal({ open: false, context: '', type: 'approve' })}
        context={smsModal.context}
        type={smsModal.type}
      />
    </div>
  )
}

function ProfileField({ label, value, highlight }) {
  return (
    <div>
      <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-medium mt-0.5 ${highlight ? 'text-djezzy-red' : 'text-text-primary'}`}>
        {value ?? '—'}
      </p>
    </div>
  )
}
