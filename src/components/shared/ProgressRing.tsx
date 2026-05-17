interface ProgressRingProps {
  pct: number
  size?: number
  stroke?: number
  color?: string
}

export function ProgressRing({ pct, size = 36, stroke = 3, color }: ProgressRingProps) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`${pct}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color ?? 'var(--accent)'}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-600 ease-out"
      />
      <text
        x={size / 2}
        y={size / 2 + 4}
        textAnchor="middle"
        fontSize={size < 32 ? 8 : 9}
        fill="var(--text-2)"
        fontWeight="600"
        fontFamily="var(--font)"
      >
        {pct}%
      </text>
    </svg>
  )
}
