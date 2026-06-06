import { useState } from 'react'
import { X, Sparkles, Copy, Check } from 'lucide-react'
import { generateSMS } from '../services/api'

export default function SMSModal({ isOpen, onClose, context, type }) {
  const [customInstructions, setCustomInstructions] = useState('')
  const [generatedSMS, setGeneratedSMS] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    const { data, error: apiError } = await generateSMS({
      context,
      customInstructions,
      type,
    })
    setLoading(false)
    if (apiError) {
      setError(apiError)
    } else {
      setGeneratedSMS(data)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedSMS)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setCustomInstructions('')
    setGeneratedSMS('')
    setError(null)
    setCopied(false)
    onClose()
  }

  const typeLabels = {
    marketing: 'Promotional Campaign SMS',
    approve: 'Refund Approval SMS',
    deny: 'Refund Denial SMS',
  }

  const typeColors = {
    marketing: 'text-accent-info',
    approve: 'text-accent-success-light',
    deny: 'text-djezzy-red',
  }

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={handleClose}
    >
      <div
        className="modal-content w-full max-w-lg glass-card p-0 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Sparkles className={`w-5 h-5 ${typeColors[type]}`} />
            <h3 className="font-display text-base font-semibold text-text-primary">
              {typeLabels[type] || 'Generate SMS'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-navy-mid text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Context Preview */}
          <div className="glass-elevated px-4 py-3 rounded-lg">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-1">Customer Context</p>
            <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap max-h-24 overflow-y-auto">
              {context}
            </p>
          </div>

          {/* Custom Instructions */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Custom Instructions (optional)
            </label>
            <input
              type="text"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g. Add a holiday greeting, Focus on data usage..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-navy-mid border border-border-subtle focus:border-djezzy-red focus:outline-none text-sm text-text-primary placeholder:text-text-muted transition-colors"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-djezzy-red hover:bg-djezzy-red-dark disabled:opacity-50 text-white text-sm font-semibold transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="spinner" />
                Generating with Llama 3.3...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate SMS
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 rounded-lg bg-djezzy-red/10 border border-djezzy-red/30 text-djezzy-red text-xs">
              {error}
            </div>
          )}

          {/* Generated Output */}
          {generatedSMS && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-text-secondary">Generated SMS</label>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-accent-success-light" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <textarea
                value={generatedSMS}
                onChange={(e) => setGeneratedSMS(e.target.value)}
                rows={4}
                className="w-full px-3.5 py-3 rounded-lg bg-navy-mid border border-border-subtle focus:border-accent-info focus:outline-none text-sm text-text-primary resize-none transition-colors"
              />
              <p className="text-[10px] text-text-muted text-right">
                {generatedSMS.length} characters
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
