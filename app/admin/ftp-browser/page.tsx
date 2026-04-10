'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = '/api/admin';

export default function FTPBrowserPage() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [mounted, setMounted] = useState(false);

  const [currentPath, setCurrentPath] = useState('/registrations/');
  const [folders, setFolders] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<any>(null);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [csvFilePath, setCsvFilePath] = useState<string>('');
  const [imageFiles, setImageFiles] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageBlobUrl, setImageBlobUrl] = useState('');
  const [loadingFolder, setLoadingFolder] = useState(false);
  const [csvViewerOpen, setCsvViewerOpen] = useState(false);
  const [csvViewerData, setCsvViewerData] = useState<any[]>([]);
  const [csvViewerColumns, setCsvViewerColumns] = useState<string[]>([]);
  const [csvViewerPath, setCsvViewerPath] = useState('');
  const [csvViewerLoading, setCsvViewerLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('adminToken');
    if (saved) setToken(saved);
  }, []);

  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: { Authorization: `Bearer ${token}` },
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

  const listPath = useCallback(async (path: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/ftp-browser?action=list-folders&path=${encodeURIComponent(path)}`);
      setFolders(res.data.folders);
      setFiles(res.data.files);
      setCurrentPath(res.data.currentPath);
    } catch (e: any) {
      if (e.response?.status === 401) handleLogout();
      else showToast('Failed to list directory', 'error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && mounted) {
      listPath(currentPath);
    }
  }, [token, mounted]);

  const openFolder = (folderName: string) => {
    const newPath = currentPath.endsWith('/') ? currentPath + folderName : currentPath + '/' + folderName;
    listPath(newPath);
  };

  const goUp = () => {
    if (currentPath === '/registrations/') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    const newPath = '/' + parts.join('/') + '/';
    listPath(newPath);
  };

  const goToRegistrations = () => {
    setSelectedFolder(null);
    setCsvData(null);
    setImageFiles([]);
    setSelectedImage(null);
    setImageBlobUrl('');
    listPath('/registrations/');
  };

  const openRegistrationFolder = async (folderName: string) => {
    setSelectedFolder(folderName);
    setCsvData(null);
    setImageFiles([]);
    setSelectedImage(null);
    setImageBlobUrl('');
    setLoadingFolder(true);
    try {
      const res = await axiosInstance.get(`/ftp-browser?action=read-csv&folder=${encodeURIComponent(folderName)}`);
      setCsvData(res.data.csvData);
      setCsvColumns(res.data.csvColumns);
      setImageFiles(res.data.imageFiles);
    } catch (e: any) {
      showToast('Failed to read folder contents', 'error');
    } finally {
      setLoadingFolder(false);
    }
  };

  const viewImage = async (imageName: string) => {
    setSelectedImage(imageName);
    setImageBlobUrl('');
    try {
      const res = await axiosInstance.get(`/ftp/fetch?id=${selectedFolder}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      setImageBlobUrl(url);
    } catch {
      showToast('Failed to load image', 'error');
    }
  };

  const openCsvViewer = async (csvFileName: string) => {
    setCsvViewerLoading(true);
    setCsvViewerOpen(true);
    setCsvViewerData([]);
    setCsvViewerColumns([]);
    const fullPath = currentPath.endsWith('/') ? currentPath + csvFileName : currentPath + '/' + csvFileName;
    setCsvViewerPath(fullPath);
    try {
      const res = await axiosInstance.get(`/ftp-browser?action=read-csv-all&path=${encodeURIComponent(currentPath)}`);
      const found = res.data.csvFiles.find((c: any) => c.fileName === csvFileName);
      if (found) {
        setCsvViewerData([found.data]);
        setCsvViewerColumns(found.columns);
      }
    } catch {
      showToast('Failed to load CSV', 'error');
    } finally {
      setCsvViewerLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="card" style={{ width: '400px', textAlign: 'center', border: '2px solid var(--neon-cyan)', boxShadow: '0 0 30px rgba(0, 245, 255, 0.2)' }}>
          <div className="logo" style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>⚡ TECHURJA <span>FTP BROWSER</span></div>
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
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div className="logo">⚡ TECHURJA <span>FTP BROWSER</span></div>
          <button className="btn btn-cyan btn-sm" onClick={goToRegistrations}>⌂ REGISTRATIONS ROOT</button>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
            {currentPath}
          </div>
        </div>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <a href="/admin" className="btn btn-cyan btn-sm">⬅ DASHBOARD</a>
          <button className="btn btn-red btn-sm" onClick={handleLogout}>⏏ LOGOUT</button>
        </nav>
      </header>

      <main className="main-container" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        {/* Left panel: Folder tree */}
        <div className="card" style={{ width: '380px', minWidth: '380px', maxHeight: 'calc(100vh - 80px)', overflowY: 'auto' }}>
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⬡ FOLDER STRUCTURE</span>
            {currentPath !== '/registrations/' && (
              <button className="btn btn-cyan btn-sm" onClick={goUp}>⬆ UP</button>
            )}
          </div>

          {loading && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>LOADING...</div>}

          {!loading && folders.length === 0 && files.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>EMPTY DIRECTORY</div>
          )}

          {folders.length > 0 && (
            <>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', letterSpacing: '2px', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                Folders ({folders.length})
              </div>
              {folders.map(f => (
                <div
                  key={f.name}
                  onClick={() => {
                    if (currentPath === '/registrations/') {
                      openRegistrationFolder(f.name);
                    } else {
                      openFolder(f.name);
                    }
                  }}
                  style={{
                    padding: '0.5rem 0.75rem',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-dim)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.8rem',
                    background: selectedFolder === f.name ? 'rgba(0,245,255,0.08)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = selectedFolder === f.name ? 'rgba(0,245,255,0.08)' : 'transparent')}
                >
                  <span style={{ color: 'var(--neon-cyan)' }}>📁</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                </div>
              ))}
            </>
          )}

          {files.length > 0 && (
            <>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', letterSpacing: '2px', marginBottom: '0.5rem', marginTop: '1rem', textTransform: 'uppercase' }}>
                Files ({files.length})
              </div>
              {files.map(f => (
                <div
                  key={f.name}
                  onClick={() => {
                    if (f.name.toLowerCase().endsWith('.csv')) {
                      openCsvViewer(f.name);
                    }
                  }}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderBottom: '1px solid var(--border-dim)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.8rem',
                    color: f.name.toLowerCase().endsWith('.csv') ? 'var(--neon-green)' : 'var(--text-secondary)',
                    cursor: f.name.toLowerCase().endsWith('.csv') ? 'pointer' : 'default',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (f.name.toLowerCase().endsWith('.csv')) e.currentTarget.style.background = 'var(--bg-card-hover)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <span>{f.name.toLowerCase().endsWith('.csv') ? '📊' : '📄'}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>{(f.size / 1024).toFixed(1)} KB</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Right panel: CSV JSON + Images */}
        <div className="card" style={{ flex: 1, maxHeight: 'calc(100vh - 80px)', overflowY: 'auto' }}>
          {!selectedFolder && (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📂</div>
              <div style={{ fontSize: '0.85rem', letterSpacing: '2px' }}>SELECT A REGISTRATION FOLDER TO VIEW DETAILS</div>
              <div style={{ fontSize: '0.7rem', marginTop: '0.5rem' }}>Click any folder on the left to see its CSV data and images</div>
            </div>
          )}

          {selectedFolder && loadingFolder && (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
              <div style={{ animation: 'blink 1s infinite', letterSpacing: '2px' }}>LOADING FOLDER CONTENTS...</div>
            </div>
          )}

          {selectedFolder && !loadingFolder && (
            <>
              <div className="card-title">
                ⬡ FOLDER: {selectedFolder}
              </div>

              {/* CSV Data as JSON */}
              {csvData && (
                <>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)', letterSpacing: '2px', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                      ⬡ CSV DATA (RAW JSON) — {csvColumns.length} fields
                    </div>
                    <div style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-dim)',
                      borderRadius: '4px',
                      padding: '1rem',
                      maxHeight: '400px',
                      overflowY: 'auto',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      lineHeight: '1.8',
                    }}>
                      {csvColumns.map(key => (
                        <div key={key} style={{ display: 'flex', borderBottom: '1px solid var(--border-dim)', paddingBottom: '0.25rem', marginBottom: '0.25rem' }}>
                          <span style={{ color: 'var(--neon-cyan)', minWidth: '200px', fontWeight: 'bold' }}>&quot;{key}&quot;</span>
                          <span style={{ color: 'var(--neon-green)' }}>: &quot;{String(csvData[key] || '')}&quot;</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Parsed fields summary */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--neon-yellow)', letterSpacing: '2px', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                      ⬡ PARSED SUMMARY
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      {[
                        ['Team Name', csvData['teamName'] || csvData['Team Name'] || csvData['team_name'] || '—'],
                        ['College', csvData['institution'] || csvData['Institution Name'] || csvData['college'] || csvData['College'] || '—'],
                        ['Event', csvData['eventName'] || csvData['Event Name'] || csvData['event'] || csvData['Event'] || '—'],
                        ['UTR', csvData['transactionId'] || csvData['UTR'] || csvData['utr'] || csvData['Transaction ID'] || '—'],
                        ['Status', csvData['status'] || 'pending'],
                        ['Accommodation', csvData['needsAccommodation'] || '—'],
                        ['Lead Name', csvData['name'] || csvData['Name'] || csvData['Lead Name'] || csvData['leadName'] || '—'],
                        ['Lead Email', csvData['email'] || csvData['Email'] || '—'],
                        ['Lead Phone', csvData['phone'] || csvData['Phone'] || '—'],
                      ].map(([label, value]) => (
                        <div key={label as string} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-dim)', padding: '0.5rem 0.75rem' }}>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', letterSpacing: '1px', textTransform: 'uppercase' }}>{label}</div>
                          <div style={{ fontSize: '0.85rem', marginTop: '0.2rem', wordBreak: 'break-all' }}>{String(value)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {!csvData && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--neon-red)', border: '1px solid var(--neon-red)', marginBottom: '1.5rem' }}>
                  ✘ No details.csv found in this folder
                </div>
              )}

              {/* Images */}
              {imageFiles.length > 0 && (
                <>
                  <div style={{ fontSize: '0.75rem', color: 'var(--neon-green)', letterSpacing: '2px', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                    ⬡ PAYMENT SCREENSHOTS ({imageFiles.length})
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {imageFiles.map(img => (
                      <button
                        key={img}
                        onClick={() => viewImage(img)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: selectedImage === img ? 'rgba(0,255,136,0.15)' : 'var(--bg-secondary)',
                          border: `1px solid ${selectedImage === img ? 'var(--neon-green)' : 'var(--border-dim)'}`,
                          color: selectedImage === img ? 'var(--neon-green)' : 'var(--text-primary)',
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        🖼 {img}
                      </button>
                    ))}
                  </div>

                  {selectedImage && imageBlobUrl && (
                    <div style={{ marginTop: '1rem' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        VIEWING: {selectedImage}
                      </div>
                      <div
                        style={{
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-dim)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: '200px',
                          cursor: 'zoom-in',
                        }}
                        onClick={() => window.open(imageBlobUrl, '_blank')}
                      >
                        <img src={imageBlobUrl} alt={selectedImage} style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }} />
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '0.5rem' }}>
                        CLICK IMAGE TO OPEN FULL SIZE
                      </div>
                    </div>
                  )}
                </>
              )}

              {imageFiles.length === 0 && (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)', border: '1px dashed var(--border-dim)' }}>
                  No images found in /registrations/{selectedFolder}/image/
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {csvViewerOpen && (
        <div className="modal-overlay" onClick={() => setCsvViewerOpen(false)}>
          <div className="modal" style={{ maxWidth: '1100px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">📊 CSV VIEWER — {csvViewerPath}</span>
              <button className="modal-close" onClick={() => setCsvViewerOpen(false)}>×</button>
            </div>

            {csvViewerLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>LOADING CSV...</div>
            ) : csvViewerData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--neon-red)' }}>NO DATA FOUND IN CSV</div>
            ) : (
              <>
                {/* Raw JSON view */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--neon-cyan)', letterSpacing: '2px', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                    RAW JSON — {csvViewerColumns.length} columns
                  </div>
                  <div style={{
                    background: '#000',
                    border: '1px solid var(--border-dim)',
                    borderRadius: '4px',
                    padding: '1rem',
                    maxHeight: '250px',
                    overflowY: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    lineHeight: '1.8',
                  }}>
                    {csvViewerColumns.map(col => (
                      <div key={col} style={{ display: 'flex', borderBottom: '1px solid #1a1a2e', paddingBottom: '0.2rem' }}>
                        <span style={{ color: 'var(--neon-cyan)', minWidth: '180px', fontWeight: 'bold' }}>&quot;{col}&quot;</span>
                        <span style={{ color: 'var(--neon-green)' }}> : &quot;{String(csvViewerData[0]?.[col] || '')}&quot;</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Table view */}
                <div style={{ fontSize: '0.7rem', color: 'var(--neon-yellow)', letterSpacing: '2px', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  TABLE VIEW
                </div>
                <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="data-table" style={{ fontSize: '0.75rem' }}>
                    <thead>
                      <tr>
                        {csvViewerColumns.map(col => (
                          <th key={col} style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1 }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvViewerData.map((row, idx) => (
                        <tr key={idx}>
                          {csvViewerColumns.map(col => (
                            <td key={col} style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {String(row[col] || '—')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="toast-container">
        {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
      </div>
    </>
  );
}
