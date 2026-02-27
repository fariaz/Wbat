import React, { useEffect, useState } from 'react';
import api from '../services/api';

const EMPTY = { name: '', vatNumber: '', address: '', email: '', phone: '', notes: '' };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<any>(null); // null | {} | {id,...}
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    api.get(`/customers${q}`).then(r => setCustomers(r.data));
  };

  useEffect(() => { load(); }, [search]);

  const openCreate = () => { setForm(EMPTY); setModal({}); setError(''); };
  const openEdit = (c: any) => { setForm(c); setModal(c); setError(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (modal.id) {
        await api.patch(`/customers/${modal.id}`, form);
      } else {
        await api.post('/customers', form);
      }
      setModal(null);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this customer?')) return;
    await api.delete(`/customers/${id}`);
    load();
  };

  const setF = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div>
      <div className="page-header">
        <h1>Customers</h1>
        <button className="btn-primary" onClick={openCreate}>+ New Customer</button>
      </div>

      <div style={{ marginBottom: 16, maxWidth: 320 }}>
        <input placeholder="Search by name…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {customers.length === 0 ? (
          <div className="empty-state"><p>No customers found</p></div>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>VAT</th><th></th></tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{c.email}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{c.phone}</td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{c.vatNumber}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => openEdit(c)}>Edit</button>
                      <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 10px', color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => handleDelete(c.id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal !== null && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{modal.id ? 'Edit Customer' : 'New Customer'}</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-grid form-grid-2">
                <div className="form-row" style={{ gridColumn: '1/-1' }}>
                  <label>Name *</label>
                  <input value={form.name} onChange={e => setF('name', e.target.value)} required />
                </div>
                <div className="form-row">
                  <label>Email</label>
                  <input type="email" value={form.email || ''} onChange={e => setF('email', e.target.value)} />
                </div>
                <div className="form-row">
                  <label>Phone</label>
                  <input value={form.phone || ''} onChange={e => setF('phone', e.target.value)} />
                </div>
                <div className="form-row">
                  <label>VAT Number</label>
                  <input value={form.vatNumber || ''} onChange={e => setF('vatNumber', e.target.value)} />
                </div>
                <div className="form-row">
                  <label>Address</label>
                  <input value={form.address || ''} onChange={e => setF('address', e.target.value)} />
                </div>
                <div className="form-row" style={{ gridColumn: '1/-1' }}>
                  <label>Notes</label>
                  <textarea value={form.notes || ''} onChange={e => setF('notes', e.target.value)} rows={2} style={{ resize: 'vertical' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : modal.id ? 'Save Changes' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
