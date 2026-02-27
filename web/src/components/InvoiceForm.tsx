import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface Props {
  invoice?: any;
  onClose: () => void;
  onSaved: () => void;
}

const emptyItem = () => ({ description: '', quantity: 1, unitPrice: 0 });

export default function InvoiceForm({ invoice, onClose, onSaved }: Props) {
  const editing = !!invoice;
  const [customers, setCustomers] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    customerId: invoice?.customerId || '',
    invoiceNumber: invoice?.invoiceNumber || '',
    status: invoice?.status || 'draft',
    issueDate: invoice?.issueDate || new Date().toISOString().split('T')[0],
    dueDate: invoice?.dueDate || '',
    taxRate: invoice?.taxRate || 0,
    notes: invoice?.notes || '',
  });
  const [items, setItems] = useState<any[]>(
    invoice?.items?.map((i: any) => ({
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })) || [emptyItem()]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/customers').then(r => setCustomers(r.data));
  }, []);

  const setF = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const setItem = (i: number, k: string, v: any) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it));

  const subtotal = items.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0);
  const taxAmount = subtotal * (Number(form.taxRate) / 100);
  const total = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        customerId: Number(form.customerId),
        taxRate: Number(form.taxRate),
        items: items.map((it, idx) => ({
          description: it.description,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          sortOrder: idx,
        })),
      };
      if (editing) {
        await api.patch(`/invoices/${invoice.id}`, payload);
      } else {
        await api.post('/invoices', payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error saving invoice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{editing ? 'Edit Invoice' : 'New Invoice'}</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-grid form-grid-2">
            <div className="form-row">
              <label>Customer *</label>
              <select value={form.customerId} onChange={e => setF('customerId', e.target.value)} required>
                <option value="">Select customer…</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label>Invoice Number</label>
              <input value={form.invoiceNumber} onChange={e => setF('invoiceNumber', e.target.value)} placeholder="Auto-generated if empty" />
            </div>
            <div className="form-row">
              <label>Issue Date *</label>
              <input type="date" value={form.issueDate} onChange={e => setF('issueDate', e.target.value)} required />
            </div>
            <div className="form-row">
              <label>Due Date *</label>
              <input type="date" value={form.dueDate} onChange={e => setF('dueDate', e.target.value)} required />
            </div>
            <div className="form-row">
              <label>Status</label>
              <select value={form.status} onChange={e => setF('status', e.target.value)}>
                {['draft','sent','paid','overdue','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label>Tax Rate (%)</label>
              <input type="number" min="0" max="100" step="0.01" value={form.taxRate} onChange={e => setF('taxRate', e.target.value)} />
            </div>
          </div>

          {/* Line items */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Line Items</label>
              <button type="button" className="btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }}
                onClick={() => setItems(prev => [...prev, emptyItem()])}>+ Add line</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px 36px', gap: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 4 }}>Description</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Qty</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Unit Price</div>
                <div />
              </div>
              {items.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px 36px', gap: 8, alignItems: 'center' }}>
                  <input value={item.description} onChange={e => setItem(idx, 'description', e.target.value)} placeholder="Description" required />
                  <input type="number" min="0" step="0.001" value={item.quantity} onChange={e => setItem(idx, 'quantity', e.target.value)} />
                  <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => setItem(idx, 'unitPrice', e.target.value)} />
                  <button type="button" style={{ background: 'transparent', color: 'var(--red)', padding: '4px 8px', fontSize: 16 }}
                    onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}>×</button>
                </div>
              ))}
            </div>
          </div>

          {/* Totals preview */}
          <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, textAlign: 'right', fontSize: 13 }}>
            <div style={{ color: 'var(--text-muted)' }}>Subtotal: <strong>€{subtotal.toFixed(2)}</strong></div>
            <div style={{ color: 'var(--text-muted)' }}>Tax ({form.taxRate}%): <strong>€{taxAmount.toFixed(2)}</strong></div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>Total: €{total.toFixed(2)}</div>
          </div>

          <div className="form-row">
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => setF('notes', e.target.value)} rows={3} style={{ resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
