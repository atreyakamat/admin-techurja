'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Next.js API relative path
const API_BASE_URL = '/api/admin';

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('feed'); // 'feed', 'explorer' or 'reports'
  
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, verified: 0, rejected: 0 });
  const [systemStatus, setSystemStatus] = useState({ database: false, ftp: false });
  const [lastRefresh, setLastRefresh] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{message: string, type: string} | null>(null);

  // Reports State
  const [reportsPath, setReportsPath] = useState('/reports');
  const [reportsFiles, setReportsFiles] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [reportSubTab, setReportSubTab] = useState('stats'); // 'stats' or 'archived'

  // ... (explorer state)
  const [explorerPath, setExplorerPath] = useState('/registrations');
  const [explorerFiles, setExplorerFiles] = useState<any[]>([]);
  const [explorerLoading, setExplorerLoading] = useState(false);
  const [explorerSelectedFile, setExplorerSelectedFile] = useState<string | null>(null);
  const [explorerCsvData, setExplorerCsvData] = useState<any>(null);
  const [explorerCsvColumns, setExplorerCsvColumns] = useState<string[]>([]);
  const [explorerImageUrl, setExplorerImageUrl] = useState('');
  const [explorerFileLoading, setExplorerFileLoading] = useState(false);
  
  // Editor State
  const [editContent, setEditContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    search: '', status: '', isAccepted: 'all', category: '', event: '',
    reg_from: '', reg_to: '', event_from: '', event_to: ''
  });

  // Modals
  const [verifyModalReg, setVerifyModalReg] = useState<any>(null);
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectNotesInput, setShowRejectNotesInput] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptError, setReceiptError] = useState(false);
  const [showRawData, setShowRawData] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedToken = localStorage.getItem('adminToken');
    if (savedToken) setToken(savedToken);
  }, []);

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
    if (!token || activeTab !== 'feed') return;
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
  }, [filters, token, activeTab]);

  const fetchExplorer = useCallback(async (path: string) => {
    if (!token || activeTab !== 'explorer') return;
    setExplorerLoading(true);
    setExplorerSelectedFile(null);
    setExplorerCsvData(null);
    setExplorerImageUrl('');
    setIsEditing(false);
    try {
      const res = await axiosInstance.get(`/ftp/list?path=${encodeURIComponent(path)}`);
      setExplorerFiles(res.data.files);
      setExplorerPath(res.data.path);
    } catch (e: any) {
      showToast('Failed to list directory', 'error');
    } finally {
      setExplorerLoading(false);
    }
  }, [token, activeTab]);

  const fetchReports = useCallback(async (path: string, mode: string = 'list') => {
    if (!token || activeTab !== 'reports') return;
    setReportsLoading(true);
    try {
      if (mode === 'daily-stats') {
        const res = await axiosInstance.get(`/reports?mode=daily-stats`);
        setDailyStats(res.data.dailyStats || []);
      } else {
        const res = await axiosInstance.get(`/reports?path=${encodeURIComponent(path)}`);
        setReportsFiles(res.data.files);
        setReportsPath(res.data.path);
      }
    } catch (e: any) {
      showToast('Failed to fetch reports data', 'error');
    } finally {
      setReportsLoading(false);
    }
  }, [token, activeTab]);

  const openExplorerFile = async (fileName: string) => {
    const fullPath = `${explorerPath}/${fileName}`.replace(/\/+/g, '/');
    setExplorerSelectedFile(fileName);
    setExplorerFileLoading(true);
    setExplorerCsvData(null);
    setExplorerImageUrl('');
    setIsEditing(false);
    try {
      if (fileName.toLowerCase().endsWith('.csv') || fileName.toLowerCase().endsWith('.txt')) {
        const res = await axiosInstance.get(`/ftp-browser?action=fetch-file&path=${encodeURIComponent(fullPath)}`);
        setExplorerCsvData(res.data);
        setExplorerCsvColumns(res.data.columns || []);
        setEditContent(res.data.rawText);
      } else if (/\.(png|jpg|jpeg|webp|gif)$/i.test(fileName)) {
        const res = await axiosInstance.get(`/ftp-browser?action=fetch-file&path=${encodeURIComponent(fullPath)}`, { responseType: 'blob' });
        const url = URL.createObjectURL(res.data);
        setExplorerImageUrl(url);
      }
    } catch (e: any) {
      showToast('Failed to load file', 'error');
    } finally {
      setExplorerFileLoading(false);
    }
  };

  const saveEditedFile = async () => {
    if (!explorerSelectedFile) return;
    const fullPath = `${explorerPath}/${explorerSelectedFile}`.replace(/\/+/g, '/');
    try {
      setExplorerFileLoading(true);
      await axiosInstance.post('/ftp/save', { path: fullPath, content: editContent });
      showToast('File saved successfully');
      setIsEditing(false);
      // Refresh preview
      openExplorerFile(explorerSelectedFile);
    } catch (e) {
      showToast('Failed to save file', 'error');
      setExplorerFileLoading(false);
    }
  };

  const quickCreateRegistration = async () => {
    const regId = prompt('Enter New Registration ID (e.g. reg_9999):');
    if (!regId) return;
    
    const teamName = prompt('Enter Team Name:');
    const leadName = prompt('Enter Lead Name:');
    
    try {
      setExplorerLoading(true);
      const regPath = `/registrations/${regId}`;
      await axiosInstance.post('/ftp/mkdir', { path: '/registrations', name: regId });
      
      const csvTemplate = `"name","${leadName || ''}"\n"team_name","${teamName || ''}"\n"status","pending"\n"timestamp","${new Date().toISOString()}"\n"needs_accommodation","NO"`;
      await axiosInstance.post('/ftp/save', { path: `${regPath}/details.csv`, content: csvTemplate });
      await axiosInstance.post('/ftp/mkdir', { path: regPath, name: 'image' });
      
      showToast('Registration Scaffolding Created');
      fetchExplorer('/registrations');
    } catch (e) {
      showToast('Failed to create registration', 'error');
      setExplorerLoading(false);
    }
  };

  const triggerDailyReport = async (force: boolean = false) => {
    const msg = force 
      ? 'This will generate a FULL report of ALL registrations. Continue?' 
      : 'This will generate the PDF and attempt to send the 3:00 PM report. Continue?';
    if (!confirm(msg)) return;
    
    try {
      setLoading(true);
      const res = await axios.get(`/api/cron/daily-report?token=${token}${force ? '&force=true' : ''}`);
      showToast(res.data.message);
    } catch (e: any) {
      showToast(e.response?.data?.error || 'Report generation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSystemStatus();
      if (activeTab === 'feed') fetchRegistrations();
      if (activeTab === 'explorer') fetchExplorer(explorerPath);
      if (activeTab === 'reports') {
        if (reportSubTab === 'stats') {
          fetchReports('', 'daily-stats');
        } else {
          fetchReports(reportsPath, 'list');
        }
      }
      const interval = setInterval(fetchSystemStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [token, activeTab]);

  // Debounce filter changes
  useEffect(() => {
    if (token && activeTab === 'feed') {
      const delay = setTimeout(() => {
        fetchRegistrations();
      }, 600);
      return () => clearTimeout(delay);
    }
  }, [filters, fetchRegistrations, token, activeTab]);

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

  const deleteRegistration = async (id: string) => {
    if (!confirm(`Are you sure you want to PERMANENTLY DELETE registration #${id} and all its files from the FTP server? This cannot be undone.`)) return;
    try {
      setLoading(true);
      await axiosInstance.post('/ftp/delete', { path: `/registrations/${id}`, type: 'dir' });
      showToast(`Registration #${id} and associated files deleted.`, 'success');
      fetchRegistrations();
      if (verifyModalReg && verifyModalReg.id === id) setVerifyModalReg(null);
    } catch (e: any) {
      showToast(e.response?.data?.error || 'Deletion failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === registrations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(registrations.map(r => r.id));
    }
  };

  const bulkAction = async (action: 'reject' | 'delete') => {
    if (selectedIds.length === 0) return;
    
    const confirmMsg = action === 'reject' 
      ? `Are you sure you want to REJECT ${selectedIds.length} selected registrations?`
      : `Are you sure you want to PERMANENTLY DELETE ${selectedIds.length} selected registrations and their files? This CANNOT be undone.`;
    
    if (!confirm(confirmMsg)) return;

    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedIds) {
      try {
        if (action === 'reject') {
          await axiosInstance.post(`/verify/${id}`, { action: 'reject', adminNotes: 'Bulk rejection' });
        } else {
          await axiosInstance.post('/ftp/delete', { path: `/registrations/${id}`, type: 'dir' });
        }
        successCount++;
      } catch (e) {
        failCount++;
      }
    }

    showToast(`Bulk ${action} complete: ${successCount} successful, ${failCount} failed.`, failCount > 0 ? 'error' : 'success');
    setSelectedIds([]);
    fetchRegistrations();
    setLoading(false);
  };

  const openVerifyModal = (reg: any) => {
    setVerifyModalReg(reg);
    setReceiptUrl('');
    setReceiptError(false);
    setShowRejectNotesInput(false);
    setRejectNotes('');
    setShowRawData(false);
    
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
      link.setAttribute('download', `registrations_${new Date().toISOString().slice(0,10)}.xlsx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Excel file exported successfully', 'success');
    } catch (e: any) {
      showToast('Failed to export Excel file', 'error');
    }
  };

  if (!mounted) return null;

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src="/TechUrja2026-Poster.png" alt="Logo" style={{ height: '40px', width: 'auto', borderRadius: '4px' }} />
            <div className="logo">⚡ TECHURJA <span>ADMIN</span></div>
          </div>
          <div id="system-status" style={{ display: 'flex', gap: '1.5rem', fontSize: '0.6rem', letterSpacing: '1px', borderLeft: '1px solid var(--border-dim)', paddingLeft: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="status-dot" style={{ background: systemStatus.ftp ? 'var(--neon-green)' : 'var(--neon-red)', boxShadow: systemStatus.ftp ? '0 0 8px var(--neon-green)' : '0 0 8px var(--neon-red)' }}></span>
              <span className="text-secondary">FTP SERVER:</span> <span style={{ color: systemStatus.ftp ? 'var(--neon-green)' : 'var(--neon-red)' }}>{systemStatus.ftp ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
          </div>
        </div>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <button className={`btn btn-sm ${activeTab === 'feed' ? 'btn-cyan' : ''}`} onClick={() => setActiveTab('feed')}>FEED</button>
          <button className={`btn btn-sm ${activeTab === 'explorer' ? 'btn-cyan' : ''}`} onClick={() => setActiveTab('explorer')}>EXPLORER</button>
          <button className={`btn btn-sm ${activeTab === 'reports' ? 'btn-cyan' : ''}`} onClick={() => setActiveTab('reports')}>REPORTS</button>
          <div style={{ display: 'flex', gap: '0.4rem', borderLeft: '1px solid var(--border-dim)', paddingLeft: '1rem' }}>
            <button className="btn btn-red btn-sm" onClick={() => triggerDailyReport(false)} title="Generate 3PM Daily Report (Last 24h)">⚡ 3PM REPORT</button>
            <button className="btn btn-cyan btn-sm" onClick={() => triggerDailyReport(true)} title="Generate Full Report of ALL registrations">⚡ FULL REPORT</button>
          </div>
          <button className="btn btn-yellow btn-sm" onClick={exportToCSV}>⤓ EXPORT EXCEL</button>
          <button className="btn btn-red btn-sm" onClick={handleLogout}>⏏ LOGOUT</button>
        </nav>
      </header>

      <main className="main-container">
        {activeTab === 'feed' ? (
          <>
            <div className="stats-grid">
              <div className="stat-box stat-total"><div className="stat-num">{stats.total}</div><div className="stat-label">TOTAL</div></div>
              <div className="stat-box stat-pending"><div className="stat-num">{stats.pending}</div><div className="stat-label">PENDING</div></div>
              <div className="stat-box stat-verified"><div className="stat-num">{stats.verified}</div><div className="stat-label">VERIFIED</div></div>
              <div className="stat-box stat-rejected"><div className="stat-num">{stats.rejected}</div><div className="stat-label">REJECTED</div></div>
            </div>

            <div className="card">
              <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>⬡ LIVE REGISTRATION FEED ({lastRefresh})</span>
                <button className="btn btn-sm btn-cyan" onClick={quickCreateRegistration}>+ QUICK ADD REGISTRATION</button>
              </div>
              <div className="filter-bar">
                <div className="filter-group"><label>Search</label><input name="search" value={filters.search} onChange={handleFilterChange} placeholder="Name, UTR, Team..." /></div>
                <div className="filter-group"><label>Status</label><select name="status" value={filters.status} onChange={handleFilterChange}><option value="">ALL</option><option value="pending">PENDING</option><option value="verified">VERIFIED</option><option value="rejected">REJECTED</option></select></div>
                <div className="filter-group"><label>Event</label><input name="event" value={filters.event} onChange={handleFilterChange} placeholder="Event Name..." /></div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                  <button className="btn btn-cyan" onClick={fetchRegistrations} disabled={loading}>{loading ? '⟳...' : '⟳ REFRESH'}</button>
                  <button className="btn btn-yellow btn-sm" onClick={clearFilters}>✕ CLEAR</button>
                </div>
              </div>

              <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                {selectedIds.length > 0 && (
                  <div style={{ background: 'rgba(255, 60, 60, 0.15)', border: '1px solid var(--neon-red)', padding: '0.75rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--neon-red)' }}>
                      ⚠ {selectedIds.length} ITEMS SELECTED
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button className="btn btn-sm btn-yellow" onClick={() => bulkAction('reject')}>✘ BULK REJECT</button>
                      <button className="btn btn-sm btn-red" onClick={() => bulkAction('delete')}>🗑 BULK REJECT & DELETE</button>
                      <button className="btn btn-sm btn-cyan" onClick={() => setSelectedIds([])}>CANCEL</button>
                    </div>
                  </div>
                )}
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>
                        <input type="checkbox" checked={selectedIds.length === registrations.length && registrations.length > 0} onChange={toggleSelectAll} />
                      </th>
                      <th>ID</th><th>TEAM NAME</th><th>LEAD NAME</th><th>COLLEGE</th><th>EVENT</th><th>PARTS.</th><th>UTR</th><th>ACCOMM.</th><th>STATUS</th><th>ACTIONS</th></tr>
                  </thead>
                  <tbody>
                    {registrations.length === 0 ? <tr><td colSpan={11} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>NO REGISTRATIONS FOUND</td></tr> :
                      registrations.map(reg => (
                        <tr key={reg.id} className="reg-row" onClick={() => openVerifyModal(reg)}>
                          <td onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={selectedIds.includes(reg.id)} onChange={(e) => toggleSelect(reg.id)} />
                          </td>
                          <td>#{reg.id}</td>
                          <td className="text-cyan" style={{ fontWeight: 'bold' }}>{reg.teamName || '—'}</td>
                          <td>{reg.name}</td>
                          <td style={{ fontSize: '0.75rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reg.institution || '—'}</td>
                          <td style={{ fontSize: '0.75rem' }}>{reg.eventName}</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{reg.participantCount}</td>
                          <td className="utr-value">{reg.transactionId || '—'}</td>
                          <td>{reg.needsAccommodation ? <span style={{ color: 'var(--neon-yellow)' }}>YES</span> : 'NO'}</td>
                          <td><span className={`badge badge-${reg.status}`}>{reg.status.toUpperCase()}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem' }} onClick={e => e.stopPropagation()}>
                              <button className="btn btn-cyan btn-sm" title="View Details" onClick={() => openVerifyModal(reg)}>👁</button>
                              {reg.status !== 'verified' && <button className="btn btn-green btn-sm" title="Approve" onClick={() => verifyAction(reg.id, 'approve')}>✔</button>}
                              {reg.status !== 'rejected' ? (
                                <button className="btn btn-red btn-sm" title="Reject" onClick={() => setRejectModalId(reg.id)}>✘</button>
                              ) : (
                                <button className="btn btn-red btn-sm" title="Delete Record" onClick={() => deleteRegistration(reg.id)}>🗑</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : activeTab === 'reports' ? (
          <div className="card">
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>⬡ REGISTRATION REPORTS</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className={`btn btn-sm ${reportSubTab === 'stats' ? 'btn-cyan' : ''}`} onClick={() => {
                  setReportSubTab('stats');
                  fetchReports('', 'daily-stats');
                }}>DAILY STATISTICS</button>
                <button className={`btn btn-sm ${reportSubTab === 'archived' ? 'btn-cyan' : ''}`} onClick={() => {
                  setReportSubTab('archived');
                  fetchReports(reportsPath, 'list');
                }}>ARCHIVED REPORTS</button>
              </div>
            </div>

            {reportSubTab === 'stats' ? (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--bg-secondary)', padding: '1rem', border: '1px solid var(--border-dim)' }}>
                   <div className="filter-group" style={{ margin: 0 }}>
                     <label>GENERATE REPORT FOR DATE:</label>
                     <input type="date" id="custom-report-date" defaultValue={new Date().toISOString().split('T')[0]} />
                   </div>
                   <button className="btn btn-yellow" style={{ marginTop: '1.2rem' }} onClick={async () => {
                      const dateInput = document.getElementById('custom-report-date') as HTMLInputElement;
                      const date = dateInput.value;
                      if (!date) return showToast('Please select a date', 'error');
                      
                      try {
                        const response = await fetch(`${API_BASE_URL}/export-csv?reg_from=${date}&reg_to=${date}`, {
                          headers: { Authorization: `Bearer ${token}` }
                        });
                        if (!response.ok) throw new Error('Export failed');
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `registrations_${date}.xlsx`;
                        a.click();
                        showToast(`Excel report for ${date} downloaded`);
                      } catch (e) { showToast('Failed to export', 'error'); }
                   }}>GENERATE & DOWNLOAD EXCEL</button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>DATE</th>
                        <th>REGISTRATIONS RECEIVED</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportsLoading ? (
                        <tr><td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>CALCULATING DAILY STATS...</td></tr>
                      ) : dailyStats.length === 0 ? (
                        <tr><td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>NO DATA AVAILABLE</td></tr>
                      ) : (
                        dailyStats.map(stat => (
                          <tr key={stat.date}>
                            <td style={{ fontWeight: 'bold', color: 'var(--neon-cyan)' }}>{new Date(stat.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                            <td style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{stat.count}</td>
                            <td>
                              <button className="btn btn-sm btn-yellow" onClick={async () => {
                                try {
                                  const response = await fetch(`${API_BASE_URL}/export-csv?reg_from=${stat.date}&reg_to=${stat.date}`, {
                                    headers: { Authorization: `Bearer ${token}` }
                                  });
                                  if (!response.ok) throw new Error('Export failed');
                                  const blob = await response.blob();
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `registrations_${stat.date}.xlsx`;
                                  a.click();
                                  showToast(`Excel report for ${stat.date} downloaded`);
                                } catch (e) { showToast('Download failed', 'error'); }
                              }}>⤓ DOWNLOAD EXCEL</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <>
                <div style={{ background: 'var(--bg-secondary)', padding: '0.4rem 0.75rem', border: '1px solid var(--border-dim)', fontSize: '0.7rem', margin: '1rem 0', fontFamily: 'monospace', color: 'var(--neon-cyan)' }}>
                  PATH: {reportsPath}
                  <div style={{ float: 'right', display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-sm btn-cyan" style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }} onClick={() => {
                      const parts = reportsPath.split('/').filter(Boolean);
                      parts.pop();
                      fetchReports('/' + parts.join('/') || '/reports', 'list');
                    }}>UP ↑</button>
                    <button className="btn btn-sm btn-cyan" style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }} onClick={() => fetchReports(reportsPath, 'list')}>⟳ REFRESH</button>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>NAME</th>
                        <th>TYPE</th>
                        <th>SIZE</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportsLoading ? (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>LOADING REPORTS...</td></tr>
                      ) : reportsFiles.length === 0 ? (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>NO REPORTS FOUND</td></tr>
                      ) : (
                        reportsFiles.sort((a,b) => b.name.localeCompare(a.name)).map(file => (
                          <tr key={file.name} style={{ cursor: file.type === 'dir' ? 'pointer' : 'default' }} onClick={() => {
                            if (file.type === 'dir') fetchReports(`${reportsPath}/${file.name}`.replace(/\/+/g, '/'), 'list');
                          }}>
                            <td>
                              <span style={{ marginRight: '0.5rem' }}>{file.type === 'dir' ? '📁' : '📄'}</span>
                              <span style={{ color: file.type === 'dir' ? 'var(--neon-cyan)' : 'inherit' }}>{file.name}</span>
                            </td>
                            <td>{file.type === 'dir' ? 'FOLDER' : file.name.split('.').pop()?.toUpperCase()}</td>
                            <td>{file.type === 'file' ? (file.size / 1024).toFixed(1) + ' KB' : '—'}</td>
                            <td>
                              {file.type === 'file' && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                   <button className="btn btn-sm btn-cyan" onClick={(e) => {
                                     e.stopPropagation();
                                     const fullPath = `${reportsPath}/${file.name}`.replace(/\/+/g, '/');
                                     axiosInstance.get(`/ftp-browser?action=fetch-file&path=${encodeURIComponent(fullPath)}`, { responseType: 'blob' })
                                       .then(res => {
                                          const url = URL.createObjectURL(res.data);
                                          window.open(url, '_blank');
                                       });
                                   }}>VIEW</button>
                                   <button className="btn btn-sm btn-yellow" onClick={(e) => {
                                     e.stopPropagation();
                                     const fullPath = `${reportsPath}/${file.name}`.replace(/\/+/g, '/');
                                     axiosInstance.get(`/ftp-browser?action=fetch-file&path=${encodeURIComponent(fullPath)}`, { responseType: 'blob' })
                                       .then(res => {
                                          const url = URL.createObjectURL(res.data);
                                          const a = document.createElement('a');
                                          a.href = url;
                                          a.download = file.name;
                                          a.click();
                                       });
                                   }}>DOWNLOAD</button>
                                </div>
                              )}
                              {file.type === 'dir' && <span className="text-secondary">OPEN FOLDER</span>}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div className="card" style={{ width: '420px', minWidth: '420px', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
              <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>⬡ FTP EXPLORER</span>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn btn-sm btn-cyan" onClick={() => {
                    const parts = explorerPath.split('/').filter(Boolean);
                    parts.pop();
                    fetchExplorer('/' + parts.join('/') || '/');
                  }}>UP ↑</button>
                  <button className="btn btn-sm btn-green" onClick={async () => {
                    const name = prompt('New Directory Name:');
                    if (!name) return;
                    try {
                      await axiosInstance.post('/ftp/mkdir', { path: explorerPath, name });
                      showToast('Directory created');
                      fetchExplorer(explorerPath);
                    } catch (e) { showToast('Failed to create', 'error'); }
                  }}>+DIR</button>
                  <label className="btn btn-sm btn-yellow" style={{ cursor: 'pointer', margin: 0 }}>
                    +FILE
                    <input type="file" style={{ display: 'none' }} onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append('path', explorerPath);
                      formData.append('file', file);
                      try {
                        setExplorerLoading(true);
                        await axiosInstance.post('/ftp/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                        showToast('File uploaded');
                        fetchExplorer(explorerPath);
                      } catch (err) { showToast('Upload failed', 'error'); setExplorerLoading(false); }
                      e.target.value = '';
                    }} />
                  </label>
                </div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '0.4rem 0.75rem', border: '1px solid var(--border-dim)', fontSize: '0.7rem', marginBottom: '0.75rem', fontFamily: 'monospace', color: 'var(--neon-cyan)' }}>
                {explorerPath}
              </div>

              {explorerLoading && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>LISTING...</div>}

              {!explorerLoading && explorerFiles.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>EMPTY DIRECTORY</div>
              )}

              {explorerFiles.map(file => (
                <div
                  key={file.name}
                  onClick={() => {
                    if (file.type === 'dir') {
                      fetchExplorer(`${explorerPath}/${file.name}`.replace(/\/+/g, '/'));
                    } else {
                      openExplorerFile(file.name);
                    }
                  }}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderBottom: '1px solid var(--border-dim)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    background: explorerSelectedFile === file.name ? 'rgba(0,245,255,0.08)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = explorerSelectedFile === file.name ? 'rgba(0,245,255,0.08)' : 'transparent')}
                >
                  <span>{file.type === 'dir' ? '📁' : file.name.toLowerCase().endsWith('.csv') ? '📊' : '🖼️'}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, color: file.type === 'dir' ? 'var(--neon-cyan)' : 'var(--text-primary)' }}>{file.name}</span>
                  {file.type === 'file' && <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{(file.size / 1024).toFixed(1)} KB</span>}
                  
                  <button className="btn btn-sm btn-red" style={{ padding: '0.1rem 0.3rem', fontSize: '0.6rem' }} onClick={async (e) => {
                    e.stopPropagation();
                    if (!confirm(`Delete ${file.name}?`)) return;
                    try {
                      await axiosInstance.post('/ftp/delete', { path: `${explorerPath}/${file.name}`.replace(/\/+/g, '/'), type: file.type });
                      showToast('Deleted successfully');
                      fetchExplorer(explorerPath);
                    } catch (err) { showToast('Failed to delete', 'error'); }
                  }}>X</button>
                </div>
              ))}
            </div>

            <div className="card" style={{ flex: 1, maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
              {!explorerSelectedFile && (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📂</div>
                  <div style={{ fontSize: '0.85rem', letterSpacing: '2px' }}>SELECT A FILE TO VIEW</div>
                  <div style={{ fontSize: '0.7rem', marginTop: '0.5rem' }}>Click any CSV or image file in the folder tree</div>
                </div>
              )}

              {explorerSelectedFile && explorerFileLoading && (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
                  <div style={{ animation: 'blink 1s infinite', letterSpacing: '2px' }}>LOADING FILE...</div>
                </div>
              )}

              {explorerSelectedFile && !explorerFileLoading && explorerCsvData && (
                <>
                  <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>📊 {isEditing ? 'EDITING' : 'VIEWING'} — {explorerSelectedFile}</span>
                    <div>
                      {!isEditing ? (
                        <button className="btn btn-sm btn-cyan" onClick={() => setIsEditing(true)}>✎ EDIT CONTENT</button>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-sm btn-green" onClick={saveEditedFile}>💾 SAVE CHANGES</button>
                          <button className="btn btn-sm btn-red" onClick={() => setIsEditing(false)}>CANCEL</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div style={{ marginTop: '1rem' }}>
                      <textarea
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        style={{
                          width: '100%',
                          height: '500px',
                          background: '#000',
                          color: '#0f0',
                          fontFamily: 'monospace',
                          padding: '1rem',
                          border: '1px solid var(--neon-green)',
                          fontSize: '0.8rem',
                          lineHeight: '1.5'
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--neon-cyan)', letterSpacing: '2px', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                          MAPPED DATA — {explorerCsvColumns.length} fields
                        </div>
                        <div style={{
                          background: '#000',
                          border: '1px solid var(--border-dim)',
                          borderRadius: '4px',
                          padding: '0.75rem',
                          maxHeight: '300px',
                          overflowY: 'auto',
                          fontFamily: 'monospace',
                          fontSize: '0.72rem',
                          lineHeight: '1.8',
                        }}>
                          {explorerCsvColumns.map(col => (
                            <div key={col} style={{ display: 'flex', borderBottom: '1px solid #1a1a2e', paddingBottom: '0.15rem' }}>
                              <span style={{ color: 'var(--neon-cyan)', minWidth: '180px', fontWeight: 'bold', flexShrink: 0 }}>"{col}"</span>
                              <span style={{ color: 'var(--neon-green)' }}> : "{String(explorerCsvData.rows?.[0]?.[col] || '')}"</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--neon-yellow)', letterSpacing: '2px', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                          TABLE VIEW
                        </div>
                        <div style={{ overflowX: 'auto', maxHeight: '350px', overflowY: 'auto' }}>
                          <table className="data-table" style={{ fontSize: '0.72rem' }}>
                            <thead>
                              <tr>
                                {explorerCsvColumns.map(col => (
                                  <th key={col} style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1, whiteSpace: 'nowrap' }}>{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {explorerCsvData.rows?.map((row: any, idx: number) => (
                                <tr key={idx}>
                                  {explorerCsvColumns.map(col => (
                                    <td key={col} style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {String(row[col] || '—')}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {explorerSelectedFile && !explorerFileLoading && explorerImageUrl && (
                <>
                  <div className="card-title">🖼️ IMAGE VIEWER — {explorerSelectedFile}</div>
                  <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-dim)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '300px',
                    cursor: 'zoom-in',
                  }} onClick={() => window.open(explorerImageUrl, '_blank')}>
                    <img src={explorerImageUrl} alt={explorerSelectedFile} style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain' }} />
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '0.5rem' }}>
                    CLICK IMAGE TO OPEN FULL SIZE
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {verifyModalReg && (
        <div className="modal-overlay" onClick={() => setVerifyModalReg(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">⬡ REGISTRATION DETAILS — #{verifyModalReg.id}</span>
              <button className="btn btn-yellow btn-sm" onClick={() => setShowRawData(!showRawData)}>
                {showRawData ? 'VIEW FORMATTED' : 'VIEW RAW DATA'}
              </button>
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
                {showRawData ? (
                  <div style={{ background: '#000', padding: '1rem', borderRadius: '4px', height: '100%', overflowY: 'auto' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--neon-yellow)', marginBottom: '0.5rem' }}>// RAW CSV RECORD PARSED AS JSON</div>
                    <pre style={{ fontSize: '0.75rem', color: 'var(--neon-green)', whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(verifyModalReg._raw, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <>
                    <div className="info-list">
                        <div className="info-row"><span className="info-key">TEAM NAME</span><span className="info-val text-cyan" style={{ fontWeight: 'bold' }}>{verifyModalReg.teamName || '—'}</span></div>
                        <div className="info-row"><span className="info-key">EVENT</span><span className="info-val">{verifyModalReg.eventName}</span></div>
                        <div className="info-row"><span className="info-key">COLLEGE</span><span className="info-val">{verifyModalReg.institution}</span></div>
                        <div className="info-row"><span className="info-key">UTR / TRANS ID</span><span className="info-val utr-value">{verifyModalReg.transactionId || '—'}</span></div>
                        <div className="info-row">
                          <span className="info-key">ACCOMMODATION</span>
                          <span className="info-val" style={{ color: verifyModalReg.needsAccommodation ? 'var(--neon-yellow)' : 'inherit', fontWeight: verifyModalReg.needsAccommodation ? 'bold' : 'normal' }}>
                            {verifyModalReg.needsAccommodation ? '⚠️ YES - NEEDED' : 'NOT REQUIRED'}
                          </span>
                        </div>
                    </div>

                    <div className="card-title" style={{ marginTop: '1.5rem', fontSize: '0.75rem' }}>⬡ PARTICIPANTS ({verifyModalReg.participantCount})</div>
                    <div className="info-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        <div className="info-row">
                            <span className="info-key">LEAD</span>
                            <span className="info-val">{verifyModalReg.name} <br/> <small className="text-secondary">{verifyModalReg.email} | {verifyModalReg.phone}</small></span>
                        </div>
                        {verifyModalReg.participant2 && verifyModalReg.participant2 !== '—' && verifyModalReg.participant2 !== '' && (
                            <div className="info-row">
                                <span className="info-key">MEMBER 2</span>
                                <span className="info-val">{verifyModalReg.participant2}</span>
                            </div>
                        )}
                        {verifyModalReg.participant3 && verifyModalReg.participant3 !== '—' && verifyModalReg.participant3 !== '' && (
                            <div className="info-row">
                                <span className="info-key">MEMBER 3</span>
                                <span className="info-val">{verifyModalReg.participant3}</span>
                            </div>
                        )}
                        {verifyModalReg.participant4 && verifyModalReg.participant4 !== '—' && verifyModalReg.participant4 !== '' && (
                            <div className="info-row">
                                <span className="info-key">MEMBER 4</span>
                                <span className="info-val">{verifyModalReg.participant4}</span>
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                      {verifyModalReg.status !== 'verified' && <button className="btn btn-green" style={{ flex: 1 }} onClick={() => verifyAction(verifyModalReg.id, 'approve')}>✔ APPROVE</button>}
                      {verifyModalReg.status !== 'rejected' ? (
                        <button className="btn btn-red" style={{ flex: 1 }} onClick={() => setShowRejectNotesInput(true)}>✘ REJECT</button>
                      ) : (
                        <button className="btn btn-red" style={{ flex: 1 }} onClick={() => deleteRegistration(verifyModalReg.id)}>🗑 DELETE RECORD</button>
                      )}
                    </div>
                    {showRejectNotesInput && (
                      <div style={{ marginTop: '1rem', border: '1px solid var(--neon-red)', padding: '0.75rem' }}>
                        <textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} placeholder="Reason for rejection (sent to user)..." rows={3} style={{ border: 'none', background: 'transparent', width: '100%', color: 'white' }} />
                        <button className="btn btn-red btn-sm" style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }} onClick={() => verifyAction(verifyModalReg.id, 'reject', rejectNotes)}>CONFIRM REJECTION</button>
                      </div>
                    )}
                  </>
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
                <textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} placeholder="Enter reason for rejection..." rows={4} style={{ marginTop: '1rem', width: '100%', color: 'white' }} />
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
