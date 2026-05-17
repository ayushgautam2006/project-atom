'use client';

export default function UsersAdminPage() {
  const USERS = [
    { id: 'u1', name: 'Priya Sharma', email: 'priya@company.com', role: 'Employee', department: 'Sales', manager: 'Arjun Mehta' },
    { id: 'u2', name: 'Rahul Verma', email: 'rahul@company.com', role: 'Employee', department: 'Operations', manager: 'Arjun Mehta' },
    { id: 'u3', name: 'Arjun Mehta', email: 'arjun@company.com', role: 'Manager', department: 'Sales', manager: '—' },
    { id: 'u4', name: 'Neha Singh', email: 'neha@company.com', role: 'Admin/HR', department: 'HR', manager: '—' },
  ];

  const ROLE_STYLE: Record<string, { bg: string; text: string }> = {
    Employee:  { bg: '#eff6ff', text: '#1d4ed8' },
    Manager:   { bg: '#f0fdf4', text: '#15803d' },
    'Admin/HR':{ bg: '#faf5ff', text: '#7e22ce' },
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Users & Org Hierarchy</h1>
          <p className="page-subtitle">System users and their reporting structure.</p>
        </div>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Reports To</th>
            </tr>
          </thead>
          <tbody>
            {USERS.map((u) => {
              const rs = ROLE_STYLE[u.role] ?? { bg: '#f3f4f6', text: '#6b7280' };
              return (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 9,
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: '0.68rem',
                          flexShrink: 0,
                        }}
                      >
                        {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <span style={{ fontWeight: 700, color: '#111827' }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ color: '#6b7280', fontSize: '0.85rem' }}>{u.email}</td>
                  <td>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 999,
                        background: rs.bg,
                        color: rs.text,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td style={{ color: '#374151' }}>{u.department}</td>
                  <td style={{ color: '#6b7280' }}>{u.manager}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="alert alert-info" style={{ marginTop: 16 }}>
        <span>ℹ</span>
        <span>
          This is a read-only view. In production, user management would be integrated with your HRMS.
        </span>
      </div>
    </div>
  );
}
