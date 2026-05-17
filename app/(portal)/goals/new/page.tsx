'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { THRUST_AREAS } from '@/app/_lib/types';

const UOM_OPTIONS = [
  {
    value: 'numeric_min',
    icon: '📈',
    name: 'Numeric (Higher is Better)',
    desc: 'e.g. Sales Revenue, NPS Score',
  },
  {
    value: 'numeric_max',
    icon: '📉',
    name: 'Numeric (Lower is Better)',
    desc: 'e.g. TAT, Cost, Error Rate',
  },
  {
    value: 'timeline',
    icon: '📅',
    name: 'Timeline (Date-based)',
    desc: 'Completion date vs. Deadline',
  },
  {
    value: 'zero',
    icon: '⚡',
    name: 'Zero-based',
    desc: 'e.g. Safety Incidents — Zero = 100%',
  },
] as const;

type Step = 1 | 2 | 3;

export default function NewGoalPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  // Form state
  const [thrustArea, setThrustArea] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uom, setUom] = useState('');
  const [target, setTarget] = useState('');
  const [weightage, setWeightage] = useState(10);

  function handleNext() {
    setError('');
    if (step === 1) {
      if (!thrustArea || !title.trim()) { setError('Please fill in all required fields.'); return; }
      setStep(2);
    } else if (step === 2) {
      if (!uom || !target.trim()) { setError('Please select UoM and enter target.'); return; }
      if (weightage < 10 || weightage > 100) { setError('Weightage must be between 10 and 100.'); return; }
      setStep(3);
    }
  }

  function handleSubmit() {
    setError('');
    startTransition(async () => {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thrustArea, title, description, uom, target: String(target), weightage }),
      });
      const j = await res.json();
      if (!j.ok) { setError(j.error); return; }
      router.push('/goals');
    });
  }

  const steps = [
    { n: 1, label: 'Goal Details' },
    { n: 2, label: 'Measurement' },
    { n: 3, label: 'Review' },
  ] as const;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 680, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Create New Goal</h1>
          <p className="page-subtitle">Fill in the details to add a goal to your sheet.</p>
        </div>
        <button className="btn btn-ghost" onClick={() => router.push('/goals')}>
          ← Back
        </button>
      </div>

      {/* Step indicator */}
      <div className="step-list" style={{ marginBottom: 32 }}>
        {steps.map((s, i) => (
          <div key={s.n} className="step-item">
            {i > 0 && (
              <div
                className={`step-line${step > s.n || (step === s.n && step > 1) ? ' done' : ''}`}
              />
            )}
            <div className={`step-dot ${step > s.n ? 'done' : step === s.n ? 'active' : 'pending'}`}>
              {step > s.n ? '✓' : s.n}
            </div>
            <span className={`step-label${step === s.n ? ' active' : ''}`}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 28 }}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            ⚠ {error}
          </div>
        )}

        {/* ── Step 1: Details ── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group">
              <label className="form-label">Thrust Area *</label>
              <select
                id="thrust-area-select"
                className="form-select"
                value={thrustArea}
                onChange={(e) => setThrustArea(e.target.value)}
              >
                <option value="">Select a Thrust Area…</option>
                {THRUST_AREAS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Goal Title *</label>
              <input
                id="goal-title-input"
                type="text"
                className="form-input"
                placeholder="e.g. Achieve Q4 Sales Target"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Goal Description</label>
              <textarea
                id="goal-desc-textarea"
                className="form-textarea"
                rows={3}
                placeholder="Describe what success looks like for this goal…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>
        )}

        {/* ── Step 2: Measurement ── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="form-group">
              <label className="form-label">Unit of Measurement (UoM) *</label>
              <div className="uom-grid" style={{ marginTop: 6 }}>
                {UOM_OPTIONS.map((o) => (
                  <div
                    key={o.value}
                    id={`uom-${o.value}`}
                    className={`uom-card${uom === o.value ? ' selected' : ''}`}
                    onClick={() => setUom(o.value)}
                  >
                    <div className="uom-icon">{o.icon}</div>
                    <div className="uom-name">{o.name}</div>
                    <div className="uom-desc">{o.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">
                  {uom === 'timeline' ? 'Target Deadline *' : 'Target Value *'}
                </label>
                <input
                  id="goal-target-input"
                  type={uom === 'timeline' ? 'date' : 'text'}
                  className="form-input"
                  placeholder={uom === 'zero' ? '0' : 'e.g. 5000000'}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  readOnly={uom === 'zero'}
                  onClick={() => uom === 'zero' && setTarget('0')}
                />
                {uom === 'zero' && (
                  <p className="form-hint">Target is automatically 0 for zero-based goals.</p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Weightage (%) *</label>
                <input
                  id="goal-weightage-input"
                  type="number"
                  className="form-input"
                  min={10}
                  max={100}
                  step={5}
                  value={weightage}
                  onChange={(e) => setWeightage(Number(e.target.value))}
                />
                <p className="form-hint">Minimum 10%. Total across all goals must equal 100%.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Review ── */}
        {step === 3 && (
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', marginBottom: 16 }}>
              Review & Confirm
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                background: '#f9fafb',
                borderRadius: 10,
                padding: 20,
                border: '1px solid #e5e7eb',
              }}
            >
              {[
                ['Thrust Area', thrustArea],
                ['Goal Title', title],
                ['UoM', UOM_OPTIONS.find((o) => o.value === uom)?.name ?? uom],
                ['Target', uom === 'zero' ? '0 (Zero-based)' : target],
                ['Weightage', `${weightage}%`],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                    {k}
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{v}</div>
                </div>
              ))}
              {description && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                    Description
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#374151' }}>{description}</div>
                </div>
              )}
            </div>

            <div className="alert alert-info" style={{ marginTop: 16 }}>
              <span>ℹ</span>
              <span>
                This goal will be saved as a <strong>draft</strong>. You can add more goals and
                submit your full sheet when the total weightage reaches 100%.
              </span>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 28,
            paddingTop: 20,
            borderTop: '1px solid #e5e7eb',
          }}
        >
          {step > 1 ? (
            <button className="btn btn-secondary" onClick={() => setStep((s) => (s - 1) as Step)}>
              ← Back
            </button>
          ) : (
            <div />
          )}
          {step < 3 ? (
            <button id="next-step-btn" className="btn btn-primary" onClick={handleNext}>
              Next →
            </button>
          ) : (
            <button
              id="create-goal-btn"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <span className="spinner" style={{ width: 14, height: 14 }} />
                  Saving…
                </>
              ) : (
                '✓ Save Goal'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
