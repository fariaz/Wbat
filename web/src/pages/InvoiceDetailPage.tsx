import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import InvoiceForm from '../components/InvoiceForm';

const fmt = (n: any) => Number(n || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const statusBadge = (s: string) => <span className={`badge badge-${s}`}>{s}</span>;
const STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get(`/invoices/${id}`).then(r => { setInvoice(r.data); setLoading(false); }).catch(() => navigate('/invoices'));
  };

  useEffect(() => { load(); }, [id]);

  const changeStatus = async (status: string) => {
    await api.patch(`/invoices/${id}`, { status });
    load();
  };

  const deleteInvoice = async () => {
    if (!confirm('Delete this invoice?')) return;
    await api.delete(`/invoices/${id}`);
    navigate('/invoices');
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }}><div className="spinner" /></div>;
  if (!invoice) return null;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => navigate('/invoices')}>← Back</button>
          <h1 style={{ fontSize: 20 }}>Invoice {invoice.invoiceNumber}</h1>
          {statusBadge(invoice.status)}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={invoice.status} onChange={e => changeStatus(e.target.value)}
            style={{ width: 'auto', padding: '7px 12px' }}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn-ghost" onClick={() => window.open(`/api/invoices/${id}/pdf`, '_blank')}>⬇ PDF</button>
          <button className="btn-ghost" onClick={() => setEditing(true)}>Edit</button>
          <button className="btn-danger" onClick={deleteInvoice}>Delete</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        {/* Main */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Bill To</div>
                <div style={{ fontWeight: 600 }}>{invoice.customer?.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{invoice.customer?.address}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{invoice.customer?.email}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Details</div>
                <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Issue: </span>{invoice.issueDate}</div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Due: </span>{invoice.dueDate}</div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Tax: </span>{invoice.taxRate}%</div>
                </div>
              </div>
            </div>

            {/* Items table */}
            <table className="table">
              <thead>
                <tr><th>Description</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Unit Price</th><th style={{ textAlign: 'right' }}>Total</th></tr>
              </thead>
              <tbody>
                {invoice.items?.map((item: any) => (
                  <tr key={item.id}>
                    <td>{item.description}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--mono)' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--mono)' }}>€{fmt(item.unitPrice)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--mono)' }}>€{fmt(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {invoice.notes && (
            <div className="card">
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Notes</div>
              <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>{invoice.notes}</div>
            </div>
          )}
        </div>

        {/* Totals sidebar */}
        <div>
          <div className="card">
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Summary</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                <span style={{ fontFamily: 'var(--mono)' }}>€{fmt(invoice.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tax ({invoice.taxRate}%)</span>
                <span style={{ fontFamily: 'var(--mono)' }}>€{fmt(invoice.taxAmount)}</span>
              </div>
              <div style={{ height: 1, background: 'var(--border)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700 }}>
                <span>Total</span>
                <span style={{ fontFamily: 'var(--mono)', color: 'var(--green)' }}>€{fmt(invoice.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <InvoiceForm
          invoice={invoice}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); load(); }}
        />
      )}
    </div>
  );
}
