import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const fmt = (n: any) => Number(n || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);

  useEffect(() => {
    api.get('/invoices/stats').then(r => setStats(r.data)).catch(() => {});
    api.get('/invoices').then(r => setRecentInvoices(r.data.slice(0, 5))).catch(() => {});
  }, []);

  const statusBadge = (s: string) => <span className={`badge badge-${s}`}>{s}</span>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <div style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>
            Welcome back, {user?.fullName || user?.email}
          </div>
        </div>
        <button className="btn-primary" onClick={() => navigate('/invoices')}>+ New Invoice</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value" style={{ color: 'var(--text)' }}>€{fmt(stats?.totals?.total)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Paid</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>€{fmt(stats?.totals?.paid)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Outstanding</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>€{fmt(stats?.totals?.outstanding)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Overdue</div>
          <div className="stat-value" style={{ color: 'var(--red)' }}>€{fmt(stats?.totals?.overdue)}</div>
        </div>
      </div>

      {/* Status breakdown */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 28 }}>
          {['draft', 'sent', 'paid', 'overdue', 'cancelled'].map(s => (
            <div key={s} className="card" style={{ textAlign: 'center', padding: '14px' }}>
              <div style={{ marginBottom: 6 }}>{statusBadge(s)}</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.byStatus?.[s] || 0}</div>
            </div>
          ))}
        </div>
      )}

      {/* Recent invoices */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Recent Invoices</h2>
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => navigate('/invoices')}>View all</button>
        </div>
        {recentInvoices.length === 0 ? (
          <div className="empty-state"><p>No invoices yet</p></div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Number</th><th>Customer</th><th>Issue Date</th><th>Due Date</th><th>Status</th><th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map(inv => (
                <tr key={inv.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/invoices/${inv.id}`)}>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{inv.invoiceNumber}</td>
                  <td>{inv.customer?.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{inv.issueDate}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{inv.dueDate}</td>
                  <td>{statusBadge(inv.status)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--mono)' }}>€{fmt(inv.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
