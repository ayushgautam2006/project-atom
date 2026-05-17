'use client';

import { useState, useTransition } from 'react';
import ProgressRing from '@/app/_components/ProgressRing';

type ReportRow = {
  employee: string;
  department: string;
  thrustArea: string;
  goalTitle: string;
  uom: string;
  target: string;
  weightage: number;
  Q1_actual: string;
  Q1_status: string;
  Q1_score: string;
  Q2_actual: string;
  Q2_status: string;
  Q2_score: string;
  Q3_actual: string;
  Q3_status: string;
  Q3_score: string;
  Q4_actual: string;
  Q4_status: string;
  Q4_score: string;
};

export default function ReportsPage() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);
  const [dept, setDept] = useState('');

  function loadReport() {
    startTransition(async () => {
      const url = `/api/reports${dept ? `?department=${dept}` : ''}`;
      const r = await fetch(url);
      const j = await r.json();
      if (j.ok) { setRows(j.data); setLoaded(true); }
    });
  }

  function downloadCSV() {
    const url = `/api/reports?format=csv${dept ? `&department=${dept}` : ''}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'achievement-report.csv';
    a.click();
  }

  function scoreColor(s: string) {
    const n = parseInt(s);
    if (!n) return '#9ca3af';
    if (n >= 80) return '#15803d';
    if (n >= 50) return '#92400e';
    return '#b91c1c';
  }

  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'] as const;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Achievement Reports</h1>
          <p className="page-subtitle">Export planned vs. actual data for all employees and quarters.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select
            id="report-dept-filter"
            className="form-select"
            style={{ width: 160 }}
            value={dept}
            onChange={(e) => setDept(e.target.value)}
          >
            <option value="">All Departments</option>
            <option value="Sales">Sales</option>
            <option value="Operations">Operations</option>
            <option value="HR">HR</option>
          </select>
          <button
            id="load-report-btn"
            className="btn btn-secondary"
            onClick={loadReport}
            disabled={loading}
          >
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '🔍'} Preview
          </button>
          <button id="export-csv-btn" className="btn btn-primary" onClick={downloadCSV}>
            📤 Export CSV
          </button>
        </div>
      </div>

      {!loaded ? (
        <div className="empty-state" style={{ padding: 80 }}>
          <span style={{ fontSize: '3rem' }}>📊</span>
          <h3 style={{ fontWeight: 700, color: '#374151' }}>No preview loaded</h3>
          <p style={{ fontSize: '0.875rem' }}>Click <strong>Preview</strong> to load the report data.</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="empty-state" style={{ padding: 60 }}>
          <span style={{ fontSize: '2.5rem' }}>📭</span>
          <p>No approved goals found for selected filters.</p>
        </div>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Dept</th>
                <th>Goal</th>
                <th>UoM</th>
                <th>Target</th>
                <th>Wt%</th>
                {quarters.map((q) => (
                  <th key={q} colSpan={2} style={{ textAlign: 'center', borderLeft: '2px solid #e5e7eb' }}>
                    {q}
                  </th>
                ))}
              </tr>
              <tr>
                <th colSpan={6} />
                {quarters.map((q) => (
                  <>
                    <th key={`${q}-a`} style={{ borderLeft: '2px solid #e5e7eb' }}>Actual</th>
                    <th key={`${q}-s`}>Score</th>
                  </>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: '#111827' }}>{r.employee}</td>
                  <td style={{ color: '#6b7280', fontSize: '0.78rem' }}>{r.department}</td>
                  <td>
                    <div style={{ fontWeight: 500, color: '#374151', fontSize: '0.8rem' }}>{r.goalTitle}</div>
                    <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{r.thrustArea}</div>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: '#6b7280' }}>{r.uom.replace(/_/g, ' ')}</td>
                  <td style={{ fontWeight: 600, color: '#374151' }}>{r.target}</td>
                  <td style={{ fontWeight: 700, color: '#4f46e5' }}>{r.weightage}%</td>
                  {quarters.map((q) => {
                    const actual = r[`${q}_actual` as keyof ReportRow] as string;
                    const score = r[`${q}_score` as keyof ReportRow] as string;
                    return (
                      <>
                        <td key={`${q}-a`} style={{ borderLeft: '2px solid #e5e7eb', color: actual ? '#111827' : '#d1d5db' }}>
                          {actual || '—'}
                        </td>
                        <td key={`${q}-s`}>
                          {score ? (
                            <span style={{ fontWeight: 700, fontSize: '0.78rem', color: scoreColor(score) }}>
                              {score}
                            </span>
                          ) : (
                            <span style={{ color: '#d1d5db' }}>—</span>
                          )}
                        </td>
                      </>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
