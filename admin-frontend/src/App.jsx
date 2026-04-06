import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './index.css';

// For Netlify, the Vite app should read from import.meta.env
// We default to the localhost dev server for local testing.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/admin';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [password, setPassword] = useState('');
  
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, verified: 0, rejected: 0 });
  const [systemStatus, setSystemStatus] = useState({ database: false, ftp: false });
  const [lastRefresh, setLastRefresh] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    search: '', status: '', isAccepted: 'all', category: '', event: '',
    reg_from: '', reg_to: '', event_from: '', event_to: ''
  });

  // Modals
  const [verifyModalReg, setVerifyModalReg] = useState(null);
  const [rejectModalId, setRejectModalId] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectNotesInput, setShowRejectNotesInput] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptError, setReceiptError] = useState(false);

  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: { Authorization: `Bearer ${token}` }
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!password) return;
    setToken(password);
    localStorage.setItem('adminToken', password);
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('adminToken');
  };

  const fetchSystemStatus = async () => {
    if (!token) return;
    try {
      const res = await axiosInstance.get(`/status`);
      setSystemStatus(res.data);
    } catch (e) {
      setSystemStatus({ database: false, ftp: false });
      if (e.response?.status === 401) handleLogout();
    }
  };

  const fetchRegistrations = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      const res = await axiosInstance.get(`/registrations?${params.toString()}`);
      setRegistrations(res.data.registrations);
      setStats(res.data.stats);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (e) {
      if (e.response?.status === 401) {
        showToast('Invalid Password / Token', 'error');
        handleLogout();
      } else {
        showToast('Failed to fetch data. Is the backend running?', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [filters, token]);

  useEffect(() => {
    if (token) {
      fetchSystemStatus();
      fetchRegistrations();
      const interval = setInterval(fetchSystemStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // Debounce filter changes
  useEffect(() => {
    if (token) {
      const delay = setTimeout(() => {
        fetchRegistrations();
      }, 600);
      return () => clearTimeout(delay);
    }
  }, [filters, fetchRegistrations, token]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({
      search: '', status: '', isAccepted: 'all', category: '', event: '',
      reg_from: '', reg_to: '', event_from: '', event_to: ''
    });
  };

  const verifyAction = async (id, action, notes = null) => {
    try {
      const body = { action };
      if (notes) body.adminNotes = notes;
      const res = await axiosInstance.post(`/verify/${id}`, body);
      showToast(res.data.message, 'success');
      fetchRegistrations();
      if (verifyModalReg && verifyModalReg.id === id) {
        setVerifyModalReg(null);
      }
      if (rejectModalId === id) {
        setRejectModalId(null);
      }
    } catch (e) {
      showToast(e.response?.data?.message || 'Action failed', 'error');
    }
  };

  const openVerifyModal = (reg) => {
    setVerifyModalReg(reg);
    setReceiptUrl('');
    setReceiptError(false);
    setShowRejectNotesInput(false);
    setRejectNotes('');
    
    // We cannot easily use standard <img> tags for protected streams without sending Bearer header
    // So we fetch the blob via Axios, then create an object URL
    axiosInstance.get(`/fetch-receipt/${reg.id}`, { responseType: 'blob' })
      .then(res => {
        const url = URL.createObjectURL(res.data);
        setReceiptUrl(url);
      })
      .catch(err => {
        setReceiptError(true);
      });
  };

  const exportMasterCsv = async () => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => { if (filters[key]) params.append(key, filters[key]); });
      
      const res = await axiosInstance.post(`/export-master?${params.toString()}`, {}, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `techurja_master_registrations_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
    } catch(e) {
      showToast('Export failed', 'error');
    }
  };

  if (!token) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="card" style={{ width: '400px', textAlign: 'center' }}>
          <div className="logo" style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>⚡ TECHURJA <span>ADMIN</span></div>
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              placeholder="Enter Admin Password (e.g. admin123)" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              style={{ marginBottom: '1rem', textAlign: 'center', fontSize: '1.2rem' }}
            />
            <button className="btn btn-cyan" style={{ width: '100%', justifyContent: 'center' }} type="submit">
              ACCESS SYSTEM
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div className="logo">⚡ TECHURJA <span>ADMIN</span></div>
          <div id="system-status" style={{ display: 'flex', gap: '1.5rem', fontSize: '0.6rem', letterSpacing: '1px', borderLeft: '1px solid var(--border-dim)', paddingLeft: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="status-dot" style={{ background: systemStatus.database ? 'var(--neon-green)' : 'var(--neon-red)', boxShadow: systemStatus.database ? '0 0 8px var(--neon-green)' : '0 0 8px var(--neon-red)' }}></span>
              <span className="text-secondary">DB:</span> <span style={{ color: systemStatus.database ? 'var(--neon-green)' : 'var(--neon-red)' }}>{systemStatus.database ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="status-dot" style={{ background: systemStatus.ftp ? 'var(--neon-green)' : 'var(--neon-red)', boxShadow: systemStatus.ftp ? '0 0 8px var(--neon-green)' : '0 0 8px var(--neon-red)' }}></span>
              <span className="text-secondary">FTP:</span> <span style={{ color: systemStatus.ftp ? 'var(--neon-green)' : 'var(--neon-red)' }}>{systemStatus.ftp ? 'CONNECTED' : 'FAILED'}</span>
            </div>
          </div>
        </div>
        <nav>
          <button className="btn btn-red btn-sm" onClick={handleLogout}>⏏ LOGOUT</button>
        </nav>
      </header>

      <main className="main-container">
        {/* STATS */}
        <div className="stats-grid">
          <div className="stat-box stat-total"><div className="stat-num">{stats.total}</div><div className="stat-label">TOTAL</div></div>
          <div className="stat-box stat-pending"><div className="stat-num">{stats.pending}</div><div className="stat-label">PENDING</div></div>
          <div className="stat-box stat-verified"><div className="stat-num">{stats.verified}</div><div className="stat-label">VERIFIED</div></div>
          <div className="stat-box stat-rejected"><div className="stat-num">{stats.rejected}</div><div className="stat-label">REJECTED</div></div>
        </div>

        {/* FEED */}
        <div className="card">
          <div className="card-title">
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>⬡ LIVE REGISTRATION FEED</span>
                <button className="btn btn-cyan btn-sm" onClick={exportMasterCsv}>📄 EXPORT MASTER CSV</button>
             </div>
          </div>
          
          <div className="filter-bar">
            <div className="filter-group"><label>Search</label><input name="search" value={filters.search} onChange={handleFilterChange} placeholder="Name, UTR..." /></div>
            <div className="filter-group"><label>Status</label><select name="status" value={filters.status} onChange={handleFilterChange}><option value="">ALL</option><option value="pending">PENDING</option><option value="verified">VERIFIED</option><option value="rejected">REJECTED</option></select></div>
            <div className="filter-group"><label>Event</label><input name="event" value={filters.event} onChange={handleFilterChange} placeholder="Event..." /></div>
            <div className="filter-group"><label>Category</label><input name="category" value={filters.category} onChange={handleFilterChange} placeholder="Category..." /></div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
              <button className="btn btn-cyan" onClick={fetchRegistrations} disabled={loading}>{loading ? '⟳ SYNCING...' : '⟳ REFRESH'}</button>
              <button className="btn btn-yellow btn-sm" onClick={clearFilters}>✕ CLEAR</button>
            </div>
          </div>

          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table className="data-table">
              <thead><tr><th>#</th><th>TEAM NAME</th><th>NAME</th><th>EMAIL</th><th>EVENT</th><th>UTR</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
              <tbody>
                {registrations.length === 0 ? <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>NO REGISTRATIONS FOUND</td></tr> :
                  registrations.map(reg => (
                    <tr key={reg.id} className="reg-row">
                      <td>{reg.id}</td>
                      <td className="text-cyan" style={{ fontWeight: 'bold' }}>{reg.teamName || '—'}</td>
                      <td>{reg.name}</td>
                      <td style={{ fontSize: '0.75rem' }}>{reg.email}</td>
                      <td>{reg.event}</td>
                      <td className="utr-value">{reg.transactionId || '—'}</td>
                      <td>
                        <span className={`badge ${reg.status_badge_class || (reg.status === 'verified' ? 'badge-verified' : reg.status === 'rejected' ? 'badge-rejected' : 'badge-pending')}`}>
                          {reg.status_label || reg.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="btn btn-cyan btn-sm" onClick={() => openVerifyModal(reg)}>👁</button>
                          {reg.status !== 'verified' && <button className="btn btn-green btn-sm" onClick={() => verifyAction(reg.id, 'approve')}>✔</button>}
                          {reg.status !== 'rejected' && <button className="btn btn-red btn-sm" onClick={() => setRejectModalId(reg.id)}>✘</button>}
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* VERIFY MODAL */}
      {verifyModalReg && (
        <div className="modal-overlay" onClick={() => setVerifyModalReg(null)} style={{ display: 'flex' }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">⬡ PAYMENT VERIFICATION — #{verifyModalReg.id}</span>
              <button className="modal-close" onClick={() => setVerifyModalReg(null)}>×</button>
            </div>
            <div className="modal-grid">
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', letterSpacing: '2px' }}>UPLOADED RECEIPT</div>
                <div className="receipt-box">
                  {!receiptUrl && !receiptError && <span className="receipt-loading">LOADING...</span>}
                  {receiptUrl && <img src={receiptUrl} alt="Receipt" />}
                  {receiptError && <div className="text-red" style={{ fontSize: '0.72rem', letterSpacing: '1px' }}>✘ No receipt found on FTP</div>}
                </div>
              </div>
              <div>
                <div className="info-list">
                    <div className="info-row" style={{ borderBottom: '2px solid var(--neon-cyan)' }}><span className="info-key">TEAM NAME</span><span className="info-val text-cyan" style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{verifyModalReg.teamName || '—'}</span></div>
                    <div className="info-row"><span className="info-key">EVENT</span><span className="info-val">{verifyModalReg.event}</span></div>
                    <div className="info-row"><span className="info-key">PARTICIPANT 1</span><span className="info-val">{verifyModalReg.name}</span></div>
                    <div className="info-row" style={{ background: '#ffcc0011', marginTop: '1rem' }}><span className="info-key">TRANSACTION ID</span><span className="info-val utr-value">{verifyModalReg.transactionId || '—'}</span></div>
                    <div className="info-row"><span className="info-key">STATUS</span><span className="info-val">{verifyModalReg.status.toUpperCase()}</span></div>
                </div>
                
                <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-green" onClick={() => verifyAction(verifyModalReg.id, 'approve')}>✔ APPROVE</button>
                  <button className="btn btn-red" onClick={() => setShowRejectNotesInput(true)}>✘ REJECT</button>
                </div>
                
                {showRejectNotesInput && (
                  <div style={{ marginTop: '1rem' }}>
                    <textarea 
                        value={rejectNotes} 
                        onChange={e => setRejectNotes(e.target.value)} 
                        placeholder="Rejection reason (e.g. Blurry screenshot, Fake UTR)" 
                        rows="3" 
                        style={{ resize: 'vertical' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button className="btn btn-red btn-sm" onClick={() => verifyAction(verifyModalReg.id, 'reject', rejectNotes)}>CONFIRM REJECT</button>
                        <button className="btn btn-yellow btn-sm" onClick={() => { setShowRejectNotesInput(false); setRejectNotes(''); }}>CANCEL</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK REJECT MODAL */}
      {rejectModalId && (
        <div className="modal-overlay" style={{ display: 'flex' }} onClick={() => setRejectModalId(null)}>
            <div className="modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <span className="modal-title">✘ REJECT REGISTRATION — #{rejectModalId}</span>
                    <button className="modal-close" onClick={() => setRejectModalId(null)}>×</button>
                </div>
                <div>
                    <label style={{ fontSize: '0.7rem', letterSpacing: '2px', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>REJECTION REASON</label>
                    <textarea 
                        value={rejectNotes} 
                        onChange={e => setRejectNotes(e.target.value)} 
                        placeholder="e.g. Blurry screenshot..." 
                        rows="4" 
                        style={{ resize: 'vertical' }}
                    />
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                        <button className="btn btn-red" onClick={() => verifyAction(rejectModalId, 'reject', rejectNotes)}>✘ CONFIRM REJECT</button>
                        <button className="btn btn-yellow" onClick={() => { setRejectModalId(null); setRejectNotes(''); }}>CANCEL</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* TOAST */}
      <div id="toast-container" className="toast-container">
        {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
      </div>
    </>
  );
}
