import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function SettingsPage() {
  const { user } = useAuth();
  const [company, setCompany] = useState<any>(null);
  const [companyMsg, setCompanyMsg] = useState('');
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');

  useEffect(() => {
    api.get('/companies/me').then(r => setCompany(r.data));
  }, []);

  const saveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.patch('/companies/me', company);
    setCompanyMsg('Saved!');
    setTimeout(() => setCompanyMsg(''), 2000);
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwErr(''); setPwMsg('');
    if (pwForm.newPassword !== pwForm.confirm) { setPwErr('Passwords do not match'); return; }
    try {
      await api.patch('/auth/password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwMsg('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
      setTimeout(() => setPwMsg(''), 2500);
    } catch (err: any) {
      setPwErr(err?.response?.data?.message || 'Error');
    }
  };

  if (!company) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }}><div className="spinner" /></div>;

  return (
    <div style={{ maxWidth: 680 }}>
      <h1 className="page-title">Settings</h1>

      {/* Company */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Company Profile</h2>
        <form onSubmit={saveCompany}>
          <div className="form-grid form-grid-2">
            <div className="form-row">
              <label>Company Name *</label>
              <input value={company.name || ''} onChange={e => setCompany({ ...company, name: e.target.value })} required />
            </div>
            <div className="form-row">
              <label>VAT Number</label>
              <input value={company.vatNumber || ''} onChange={e => setCompany({ ...company, vatNumber: e.target.value })} />
            </div>
            <div className="form-row">
              <label>Email</label>
              <input type="email" value={company.email || ''} onChange={e => setCompany({ ...company, email: e.target.value })} />
            </div>
            <div className="form-row">
              <label>Phone</label>
              <input value={company.phone || ''} onChange={e => setCompany({ ...company, phone: e.target.value })} />
            </div>
            <div className="form-row" style={{ gridColumn: '1/-1' }}>
              <label>Address</label>
              <textarea value={company.address || ''} onChange={e => setCompany({ ...company, address: e.target.value })} rows={2} style={{ resize: 'vertical' }} />
            </div>
          </div>
          {companyMsg && <div className="alert alert-success">{companyMsg}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary">Save Company</button>
          </div>
        </form>
      </div>

      {/* Password */}
      <div className="card">
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Change Password</h2>
        <form onSubmit={changePassword}>
          <div className="form-row">
            <label>Current Password</label>
            <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
          </div>
          <div className="form-row">
            <label>New Password</label>
            <input type="password" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} required minLength={6} />
          </div>
          <div className="form-row">
            <label>Confirm New Password</label>
            <input type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} required />
          </div>
          {pwErr && <div className="alert alert-error">{pwErr}</div>}
          {pwMsg && <div className="alert alert-success">{pwMsg}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary">Change Password</button>
          </div>
        </form>
      </div>
    </div>
  );
}
