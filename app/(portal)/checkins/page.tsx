'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CheckIn } from '@/app/_lib/types';

type TeamMember = { id: string; department: string };

export default function CheckInsPage() {
  const router = useRouter();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [goals, setGoals] = useState<{ employeeId: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/checkins').then((r) => r.json()),
      fetch('/api/goals').then((r) => r.json()),
    ]).then(([cj, gj]) => {
      if (cj.ok) setCheckIns(cj.data);
      if (gj.ok) setGoals(gj.data);
    }).finally(() => setLoading(false));
  }, []);

  const empIds = [...new Set(goals.map((g) => g.employeeId))];
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  function hasCi(empId: string, q: string) {
    return checkIns.some((c) => c.employeeId === empId && c.quarter === q);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <span className="spinner" style={{ width: 36, height: 36 }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Check-ins</h1>
          <p className="page-subtitle">Quarterly check-in status for your team.</p>
        </div>
      </div>

      {empIds.length === 0 ? (
        <div className="empty-state" style={{ padding: 80 }}>
          <span style={{ fontSize: '3rem' }}>📋</span>
          <h3 style={{ fontWeight: 700 }}>No team members yet</h3>
          <p>Goals must be approved before check-ins can be logged.</p>
        </div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                {quarters.map((q) => <th key={q}>{q} Check-in</th>)}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {empIds.map((empId) => (
                <tr key={empId}>
                  <td style={{ fontWeight: 700, color: '#111827' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: '0.7rem',
                        }}
                      >
                        {empId.toUpperCase().slice(0, 2)}
                      </div>
                      {empId}
                    </div>
                  </td>
                  {quarters.map((q) => (
                    <td key={q}>
                      {hasCi(empId, q) ? (
                        <span className="badge badge-approved">Done</span>
                      ) : (
                        <span className="badge badge-draft">Pending</span>
                      )}
                    </td>
                  ))}
                  <td>
                    <button
                      id={`checkin-btn-${empId}`}
                      className="btn btn-sm btn-primary"
                      onClick={() => router.push(`/checkins/${empId}`)}
                    >
                      Open →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
