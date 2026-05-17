interface ProgressRingProps {
  score: number | null;       // 0–1+
  size?: number;              // diameter px
  strokeWidth?: number;
  label?: string;
}

export default function ProgressRing({
  score,
  size = 80,
  strokeWidth = 8,
  label,
}: ProgressRingProps) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = score === null ? 0 : Math.min(score, 1);
  const offset = circ - pct * circ;

  const color =
    score === null
      ? '#e5e7eb'
      : score >= 0.8
      ? '#10b981'
      : score >= 0.5
      ? '#f59e0b'
      : '#ef4444';

  const displayPct =
    score === null ? 'N/A' : `${Math.round(score * 100)}%`;

  return (
    <div
      className="progress-ring"
      style={{ width: size, height: size, position: 'relative' }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: size < 64 ? '0.6rem' : '0.75rem',
            fontWeight: 800,
            color,
            lineHeight: 1,
          }}
        >
          {displayPct}
        </span>
        {label && (
          <span
            style={{
              fontSize: '0.55rem',
              color: '#9ca3af',
              marginTop: 2,
              fontWeight: 600,
            }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
