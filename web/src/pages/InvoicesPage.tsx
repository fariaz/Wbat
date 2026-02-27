import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import InvoiceForm from '../components/InvoiceForm';

const fmt = (n: any) => Number(n || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const statusBadge = (s: string) => <span className={`badge badge-${s}`}>{s}</span>;

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = (status?: string) => {
    const params = status ? `?status=${status}` : '';
    api.get(`/invoices${params}`).then(r => setInvoices(r.data));
  };

  useEffect(() => { load(filter || undefined); }, [filter]);

  const handleCreated = () => { setShowForm(false); load(filter || undefined); };

  return (
    <div>
      <div className="page-header">
        <h1>Invoices</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ New Invoice</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['', 'draft', 'sent', 'paid', 'overdue', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{
              padding: '6px 14px', fontSize: 12, borderRadius: 999,
              background: filter === s ? 'var(--accent)' : 'var(--surface)',
              color: filter === s ? '#fff' : 'var(--text-muted)',
              border: `1px solid ${filter === s ? 'var(--accent)' : 'var(--border)'}`,
            }}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {invoices.length === 0 ? (
          <div className="empty-state"><p>No invoices found</p></div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Number</th><th>Customer</th><th>Issue Date</th><th>Due Date</th>
                <th>Status</th><th style={{ textAlign: 'right' }}>Total</th><th></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/invoices/${inv.id}`)}>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{inv.invoiceNumber}</td>
                  <td>{inv.customer?.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{inv.issueDate}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{inv.dueDate}</td>
                  <td>{statusBadge(inv.status)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 500 }}>€{fmt(inv.total)}</td>
                  <td>
                    <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }}
                      onClick={e => { e.stopPropagation(); window.open(`/api/invoices/${inv.id}/pdf`, '_blank'); }}>
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <InvoiceForm onClose={() => setShowForm(false)} onSaved={handleCreated} />
      )}
    </div>
  );
}
