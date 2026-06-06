import { useMemo } from 'react'

/**
 * Semi-circular fraud risk gauge with animated needle.
 * Colors: Green (<13.9%) → Yellow (13.9-50%) → Red (>50%)
 */
export default function FraudGauge({ probability = 0, threshold = 0.139 }) {
  const pct = Math.min(Math.max(probability * 100, 0), 100)

  const { label, labelColor, needleColor } = useMemo(() => {
    if (pct < threshold * 100) {
      return { label: 'LOW RISK', labelColor: '#10B981', needleColor: '#059669' }
    } else if (pct < 50) {
      return { label: 'MEDIUM RISK', labelColor: '#F59E0B', needleColor: '#D97706' }
    } else {
      return { label: 'HIGH RISK', labelColor: '#EF4444', needleColor: '#E60000' }
    }
  }, [pct, threshold])

  // Needle angle: -90deg (0%) to +90deg (100%)
  const needleAngle = -90 + (pct / 100) * 180
  // Threshold marker angle
  const thresholdAngle = -90 + (threshold * 100 / 100) * 180

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 120" className="w-56 h-auto">
        {/* Background arc track */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="16"
          strokeLinecap="round"
        />

        {/* Green zone (0% to threshold) */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${pct * 2.51} 251`}
        />

        {/* Gradient */}
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="14%" stopColor="#10B981" />
            <stop offset="30%" stopColor="#F59E0B" />
            <stop offset="60%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#E60000" />
          </linearGradient>
        </defs>

        {/* Threshold marker */}
        <line
          x1="100"
          y1="100"
          x2="100"
          y2="30"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1.5"
          strokeDasharray="3 3"
          transform={`rotate(${thresholdAngle}, 100, 100)`}
        />
        <text
          x="100"
          y="22"
          textAnchor="middle"
          fill="rgba(255,255,255,0.4)"
          fontSize="7"
          fontFamily="Inter"
          transform={`rotate(${thresholdAngle}, 100, 100)`}
        >
          {(threshold * 100).toFixed(1)}%
        </text>

        {/* Needle */}
        <g transform={`rotate(${needleAngle}, 100, 100)`} style={{ animation: 'needle-sweep 1s cubic-bezier(0.16,1,0.3,1)' }}>
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="28"
            stroke={needleColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>

        {/* Center dot */}
        <circle cx="100" cy="100" r="6" fill={needleColor} />
        <circle cx="100" cy="100" r="3" fill="var(--color-navy)" />
      </svg>

      {/* Percentage + Label */}
      <div className="flex flex-col items-center -mt-4">
        <span className="text-3xl font-display font-bold" style={{ color: labelColor }}>
          {pct.toFixed(1)}%
        </span>
        <span
          className="text-[11px] font-bold tracking-widest mt-1 px-3 py-0.5 rounded-full"
          style={{
            color: labelColor,
            backgroundColor: `${labelColor}15`,
          }}
        >
          {label}
        </span>
      </div>
    </div>
  )
}
