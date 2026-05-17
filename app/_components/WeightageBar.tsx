interface WeightageBarProps {
  goals: { title: string; weightage: number }[];
  total: number;
}

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
];

export default function WeightageBar({ goals, total }: WeightageBarProps) {
  const valid = Math.round(total) === 100;
  const over = total > 100;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
          Weightage Allocation
        </span>
        <span
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: valid ? '#15803d' : over ? '#b91c1c' : '#92400e',
            background: valid ? '#f0fdf4' : over ? '#fef2f2' : '#fffbeb',
            padding: '2px 10px',
            borderRadius: 999,
          }}
        >
          {total}% / 100%
        </span>
      </div>

      {/* Stacked bar */}
      <div
        className="weightage-track"
        style={{ height: 10, borderRadius: 999, background: '#e5e7eb', overflow: 'hidden', display: 'flex' }}
      >
        {goals.map((g, i) => (
          <div
            key={i}
            title={`${g.title}: ${g.weightage}%`}
            style={{
              width: `${Math.min(g.weightage, 100)}%`,
              background: COLORS[i % COLORS.length],
              height: '100%',
              transition: 'width 0.4s ease',
            }}
          />
        ))}
      </div>

      {/* Legend */}
      {goals.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', marginTop: 8 }}>
          {goals.map((g, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: COLORS[i % COLORS.length],
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                {g.title.length > 24 ? g.title.slice(0, 22) + '…' : g.title} ({g.weightage}%)
              </span>
            </div>
          ))}
        </div>
      )}

      {!valid && (
        <div
          className="alert alert-warning animate-fade-in"
          style={{ marginTop: 10, padding: '8px 12px' }}
        >
          {over
            ? '⚠ Total exceeds 100%. Reduce weightage before submitting.'
            : `⚠ ${100 - total}% remaining — total must equal 100% to submit.`}
        </div>
      )}
    </div>
  );
}
