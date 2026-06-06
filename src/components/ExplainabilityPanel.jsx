import { AlertTriangle } from 'lucide-react'

/**
 * Displays TabNet's top risk features with importance bars.
 */
export default function ExplainabilityPanel({ features = [] }) {
  if (!features.length) return null

  const maxImportance = Math.max(...features.map((f) => f.importance), 1)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="w-4 h-4 text-accent-warning-light" />
        <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
          TabNet Explainability — Top Risk Factors
        </h4>
      </div>

      {features.map((feat, i) => {
        const widthPct = (feat.importance / maxImportance) * 100
        return (
          <div
            key={i}
            className="glass-elevated px-4 py-3 rounded-lg flex items-center gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-text-primary truncate">
                  {feat.feature}
                </span>
                <span className="text-xs font-mono text-accent-warning-light ml-2 shrink-0">
                  {feat.importance.toFixed(4)}
                </span>
              </div>
              <div className="h-1.5 w-full bg-navy-mid rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${widthPct}%`,
                    background: 'linear-gradient(90deg, #D97706, #EF4444)',
                  }}
                />
              </div>
            </div>
          </div>
        )
      })}

      <p className="text-[10px] text-text-muted italic">
        Flagged due to: High {features[0]?.feature || 'unknown feature'}
      </p>
    </div>
  )
}
