'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Next.js API relative path
const API_BASE_URL = '/api/admin';

export default function AdminDashboard() {
  const [token, setToken] = useState(typeof window !== 'undefined' ? localStorage.getItem('adminToken') || '' : '');
  const [password, setPassword] = useState('');
  
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, verified: 0, rejected: 0 });
  const [systemStatus, setSystemStatus] = useState({ database: false, ftp: false });
  const [lastRefresh, setLastRefresh] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{message: string, type: string} | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    search: '', status: '', isAccepted: 'all', category: '', event: '',
    reg_from: '', reg_to: '', event_from: '', event_to: ''
  });

  // Modals
  const [verifyModalReg, setVerifyModalReg] = useState<any>(null);
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectNotesInput, setShowRejectNotesInput] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptError, setReceiptError] = useState(false);

  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: { Authorization: `Bearer ${token}` }
  });

  const showToast = (message: string, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleLogin = (e: React.FormEvent) => {
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
    } catch (e: any) {
      setSystemStatus({ database: false, ftp: false });
      if (e.response?.status === 401) handleLogout();
    }
  };

  const fetchRegistrations = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const res = await axiosInstance.get(`/registrations?${params.toString()}`);
      setRegistrations(res.data.registrations);
      setStats(res.data.stats);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (e: any) {
      if (e.response?.status === 401) {
        showToast('Invalid Password / Token', 'error');
        handleLogout();
      } else {
        showToast('Failed to fetch data.', 'error');
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

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({
      search: '', status: '', isAccepted: 'all', category: '', event: '',
      reg_from: '', reg_to: '', event_from: '', event_to: ''
    });
  };

  const verifyAction = async (id: string, action: string, notes: string | null = null) => {
    try {
      const body = { action, adminNotes: notes };
      const res = await axiosInstance.post(`/verify/${id}`, body);
      showToast(res.data.message, 'success');
      fetchRegistrations();
      if (verifyModalReg && verifyModalReg.id === id) setVerifyModalReg(null);
      if (rejectModalId === id) setRejectModalId(null);
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Action failed', 'error');
    }
  };

  const openVerifyModal = (reg: any) => {
    setVerifyModalReg(reg);
    setReceiptUrl('');
    setReceiptError(false);
    setShowRejectNotesInput(false);
    setRejectNotes('');
    
    // Fetch blob for protected stream
    axiosInstance.get(`/ftp/fetch?id=${reg.id}`, { responseType: 'blob' })
      .then(res => {
        const url = URL.createObjectURL(res.data);
        setReceiptUrl(url);
      })
      .catch(() => setReceiptError(true));
  };

  const exportToCSV = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await fetch(`${API_BASE_URL}/export-csv?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `registrations_${new Date().toISOString().slice(0,10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('CSV exported successfully', 'success');
    } catch (e: any) {
      showToast('Failed to export CSV', 'error');
    }
  };

  if (!token) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="card" style={{ width: '400px', textAlign: 'center', border: '2px solid var(--neon-cyan)', boxShadow: '0 0 30px rgba(0, 245, 255, 0.2)' }}>
          <div className="logo" style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>⚡ TECHURJA <span>ADMIN</span></div>
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              placeholder="ENTER ADMIN SECRET" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              style={{ marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '4px' }}
            />
            <button className="btn btn-cyan" style={{ width: '100%', justifyContent: 'center', padding: '1rem' }} type="submit">
              ACCESS SYSTEM
            </button>
          </form>
          <div style={{ marginTop: '1.5rem', fontSize: '0.6rem', color: 'var(--text-secondary)', letterSpacing: '2px' }}>
            SECURE ACCESS ONLY • AUTHORIZED PERSONNEL
          </div>
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
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-yellow btn-sm" onClick={exportToCSV}>⤓ EXPORT CSV</button>
          <button className="btn btn-red btn-sm" onClick={handleLogout}>⏏ LOGOUT</button>
        </nav>
      </header>

      <main className="main-container">
        <div className="stats-grid">
          <div className="stat-box stat-total"><div className="stat-num">{stats.total}</div><div className="stat-label">TOTAL</div></div>
          <div className="stat-box stat-pending"><div className="stat-num">{stats.pending}</div><div className="stat-label">PENDING</div></div>
          <div className="stat-box stat-verified"><div className="stat-num">{stats.verified}</div><div className="stat-label">VERIFIED</div></div>
          <div className="stat-box stat-rejected"><div className="stat-num">{stats.rejected}</div><div className="stat-label">REJECTED</div></div>
        </div>

        <div className="card">
          <div className="card-title">⬡ LIVE REGISTRATION FEED ({lastRefresh})</div>
          <div className="filter-bar">
            <div className="filter-group"><label>Search</label><input name="search" value={filters.search} onChange={handleFilterChange} placeholder="Name, UTR, Team..." /></div>
            <div className="filter-group"><label>Status</label><select name="status" value={filters.status} onChange={handleFilterChange}><option value="">ALL</option><option value="pending">PENDING</option><option value="verified">VERIFIED</option><option value="rejected">REJECTED</option></select></div>
            <div className="filter-group"><label>Event</label><input name="event" value={filters.event} onChange={handleFilterChange} placeholder="Event Name..." /></div>
            <div className="filter-group"><label>Reg From</label><input type="date" name="reg_from" value={filters.reg_from} onChange={handleFilterChange} /></div>
            <div className="filter-group"><label>Reg To</label><input type="date" name="reg_to" value={filters.reg_to} onChange={handleFilterChange} /></div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
              <button className="btn btn-cyan" onClick={fetchRegistrations} disabled={loading}>{loading ? '⟳...' : '⟳ REFRESH'}</button>
              <button className="btn btn-yellow btn-sm" onClick={clearFilters}>✕ CLEAR</button>
            </div>
          </div>

          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table className="data-table">
              <thead><tr><th>ID</th><th>TEAM NAME</th><th>LEAD NAME</th><th>COLLEGE</th><th>EVENT</th><th>UTR</th><th>ACCOMM.</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
              <tbody>
                {registrations.length === 0 ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>NO REGISTRATIONS FOUND</td></tr> :
                  registrations.map(reg => (
                    <tr key={reg.id} className="reg-row" onClick={() => openVerifyModal(reg)}>
                      <td>#{reg.id}</td>
                      <td className="text-cyan" style={{ fontWeight: 'bold' }}>{reg.teamName || '—'}</td>
                      <td>{reg.name}</td>
                      <td style={{ fontSize: '0.75rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reg.institution || '—'}</td>
                      <td style={{ fontSize: '0.75rem' }}>{reg.eventName}</td>
                      <td className="utr-value">{reg.transactionId || '—'}</td>
                      <td>{reg.needsAccommodation ? <span style={{ color: 'var(--neon-yellow)' }}>YES</span> : 'NO'}</td>
                      <td><span className={`badge badge-${reg.status}`}>{reg.status.toUpperCase()}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }} onClick={e => e.stopPropagation()}>
                          <button className="btn btn-cyan btn-sm" title="View Details" onClick={() => openVerifyModal(reg)}>👁</button>
                          {reg.status !== 'verified' && <button className="btn btn-green btn-sm" title="Approve" onClick={() => verifyAction(reg.id, 'approve')}>✔</button>}
                          {reg.status !== 'rejected' && <button className="btn btn-red btn-sm" title="Reject" onClick={() => setRejectModalId(reg.id)}>✘</button>}
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

      {verifyModalReg && (
        <div className="modal-overlay" onClick={() => setVerifyModalReg(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">⬡ REGISTRATION DETAILS — #{verifyModalReg.id}</span>
              <button className="modal-close" onClick={() => setVerifyModalReg(null)}>×</button>
            </div>
            <div className="modal-grid">
              <div>
                <div className="receipt-box" style={{ cursor: 'zoom-in' }} onClick={() => receiptUrl && window.open(receiptUrl, '_blank')}>
                  {!receiptUrl && !receiptError && <span className="receipt-loading">FETCHING RECEIPT...</span>}
                  {receiptUrl && <img src={receiptUrl} alt="Receipt" />}
                  {receiptError && <div className="text-red">✘ Receipt Not Found on FTP Server</div>}
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  CLICK IMAGE TO OPEN FULL SIZE
                </div>
              </div>
              <div>
                <div className="info-list">
                    <div className="info-row"><span className="info-key">TEAM NAME</span><span className="info-val text-cyan" style={{ fontWeight: 'bold' }}>{verifyModalReg.teamName || '—'}</span></div>
                    <div className="info-row"><span className="info-key">EVENT</span><span className="info-val">{verifyModalReg.eventName}</span></div>
                    <div className="info-row"><span className="info-key">UTR / TRANS ID</span><span className="info-val utr-value">{verifyModalReg.transactionId || '—'}</span></div>
                    <div className="info-row">
                      <span className="info-key">ACCOMMODATION</span>
                      <span className="info-val" style={{ color: verifyModalReg.needsAccommodation ? 'var(--neon-yellow)' : 'inherit', fontWeight: verifyModalReg.needsAccommodation ? 'bold' : 'normal' }}>
                        {verifyModalReg.needsAccommodation ? '⚠️ YES - NEEDED' : 'NOT REQUIRED'}
                      </span>
                    </div>
                </div>

                <div className="card-title" style={{ marginTop: '1.5rem', fontSize: '0.75rem' }}>⬡ PARTICIPANTS</div>
                <div className="info-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <div className="info-row">
                        <span className="info-key">LEAD</span>
                        <span className="info-val">{verifyModalReg.name} <br/> <small className="text-secondary">{verifyModalReg.email} | {verifyModalReg.phone}</small></span>
                    </div>
                    {verifyModalReg.participant2 && (
                        <div className="info-row">
                            <span className="info-key">MEMBER 2</span>
                            <span className="info-val">{verifyModalReg.participant2} <br/> <small className="text-secondary">{verifyModalReg.email2} | {verifyModalReg.phone2}</small></span>
                        </div>
                    )}
                    {verifyModalReg.participant3 && (
                        <div className="info-row">
                            <span className="info-key">MEMBER 3</span>
                            <span className="info-val">{verifyModalReg.participant3} <br/> <small className="text-secondary">{verifyModalReg.email3} | {verifyModalReg.phone3}</small></span>
                        </div>
                    )}
                    {verifyModalReg.participant4 && (
                        <div className="info-row">
                            <span className="info-key">MEMBER 4</span>
                            <span className="info-val">{verifyModalReg.participant4} <br/> <small className="text-secondary">{verifyModalReg.email4} | {verifyModalReg.phone4}</small></span>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-green" style={{ flex: 1 }} onClick={() => verifyAction(verifyModalReg.id, 'approve')}>✔ APPROVE</button>
                  <button className="btn btn-red" style={{ flex: 1 }} onClick={() => setShowRejectNotesInput(true)}>✘ REJECT</button>
                </div>
                {showRejectNotesInput && (
                  <div style={{ marginTop: '1rem', border: '1px solid var(--neon-red)', padding: '0.75rem' }}>
                    <textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} placeholder="Reason for rejection (sent to user)..." rows={3} style={{ border: 'none', background: 'transparent' }} />
                    <button className="btn btn-red btn-sm" style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }} onClick={() => verifyAction(verifyModalReg.id, 'reject', rejectNotes)}>CONFIRM REJECTION</button>
                  </div>
                )}
                {verifyModalReg.adminNotes && !showRejectNotesInput && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,0,0,0.1)', border: '1px solid var(--border-dim)' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--neon-red)', marginBottom: '0.25rem' }}>PREVIOUS NOTES:</div>
                    <div style={{ fontSize: '0.8rem' }}>{verifyModalReg.adminNotes}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {rejectModalId && (
        <div className="modal-overlay" onClick={() => setRejectModalId(null)}>
            <div className="modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <span className="modal-title">✘ REJECT REGISTRATION — #{rejectModalId}</span>
                </div>
                <textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} placeholder="Enter reason for rejection..." rows={4} style={{ marginTop: '1rem' }} />
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button className="btn btn-red" style={{ flex: 1 }} onClick={() => verifyAction(rejectModalId!, 'reject', rejectNotes)}>✘ CONFIRM REJECT</button>
                    <button className="btn btn-cyan" style={{ flex: 1 }} onClick={() => { setRejectModalId(null); setRejectNotes(''); }}>CANCEL</button>
                </div>
            </div>
        </div>
      )}

      <div className="toast-container">
        {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
      </div>

      <style jsx global>{`
        .reg-row:hover {
          box-shadow: inset 0 0 10px rgba(0, 245, 255, 0.1);
        }
        .receipt-loading {
          animation: blink 1.5s infinite;
          font-size: 0.7rem;
          letter-spacing: 2px;
          color: var(--text-secondary);
        }
      `}</style>
    </>
  );
}
