'use client';

import React, { useState, useEffect, use } from 'react';
import axios from 'axios';

export default function CoordinatorPage({ params }: { params: Promise<{ eventSlug: string }> }) {
  const { eventSlug } = use(params);
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [eventName, setEventName] = useState('');

  // Mapping slugs to real event names
  const slugToName: Record<string, string> = {
    'robowars': 'Robowars',
    'robonexus': 'Robo Nexus',
    'cyberstrike': 'Cyber Strike',
    'warroom': 'War Room Protocol',
    'techyothon': 'Techyothon',
    'clashpunk': 'Clashpunk',
    'neonspan': 'Neon Span',
    'race': 'L9: Santo Domingo Race',
    'kabuki': 'Kabuki Roundabout',
    'ghostgrid': 'Ghostgrid',
    'matrix': 'Escape the Matrix',
    'pixelplay': 'Pixel Play',
    'structomat': 'Structomat',
    'symmetry': 'Symmetry Art',
    'breach': 'Circuit Breach',
    'heist': 'The Cypher Heist',
    'runner': 'Grid Runner',
    'smashers': 'Cyber Smashers',
    'innovibe': 'Innovibe',
    'cybertug': 'Cyber Tug'
  };

  const realName = slugToName[eventSlug] || eventSlug;

  useEffect(() => {
    const savedPass = localStorage.getItem(`coord_pass_${eventSlug}`);
    if (savedPass) {
      setPassword(savedPass);
      handleLogin(null, savedPass);
    }
  }, [eventSlug]);

  const handleLogin = async (e: React.FormEvent | null, passOverride?: string) => {
    if (e) e.preventDefault();
    const passToUse = passOverride || password;
    if (!passToUse) return;

    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/api/admin/coordinator?event=${encodeURIComponent(realName)}&password=${encodeURIComponent(passToUse)}`);
      setRegistrations(res.data.registrations);
      setEventName(res.data.eventName);
      setIsLoggedIn(true);
      localStorage.setItem(`coord_pass_${eventSlug}`, passToUse);
    } catch (err: any) {
      setError(err.response?.status === 401 ? 'Invalid Password' : 'Failed to load registrations');
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0f', color: 'white', fontFamily: 'monospace' }}>
        <div style={{ width: '100%', maxWidth: '400px', padding: '2rem', background: '#12121a', border: '1px solid #00f5ff', borderRadius: '8px', textAlign: 'center' }}>
          <h2 style={{ color: '#00f5ff', marginBottom: '1.5rem', letterSpacing: '2px' }}>EVENT COORDINATOR</h2>
          <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '2rem' }}>ACCESSING: {realName.toUpperCase()}</p>
          <form onSubmit={(e) => handleLogin(e)}>
            <input 
              type="password" 
              placeholder="ENTER ACCESS KEY" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #333', color: 'white', marginBottom: '1.5rem', textAlign: 'center', letterSpacing: '4px' }}
            />
            <button 
              type="submit" 
              disabled={loading}
              style={{ width: '100%', padding: '12px', background: '#00f5ff', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {loading ? 'VERIFYING...' : 'VIEW REGISTRATIONS'}
            </button>
          </form>
          {error && <p style={{ color: '#ff0055', marginTop: '1rem', fontSize: '0.8rem' }}>{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem', background: '#0a0a0f', minHeight: '100vh', color: 'white', fontFamily: 'monospace' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
        <div>
          <h1 style={{ color: '#00f5ff', fontSize: '1.2rem', margin: 0 }}>{eventName}</h1>
          <p style={{ fontSize: '0.7rem', color: '#888', margin: '4px 0 0 0' }}>{registrations.length} TOTAL REGISTRATIONS</p>
        </div>
        <button onClick={() => { setIsLoggedIn(false); localStorage.removeItem(`coord_pass_${eventSlug}`); }} style={{ background: 'transparent', border: '1px solid #ff0055', color: '#ff0055', padding: '4px 12px', fontSize: '0.7rem', cursor: 'pointer' }}>LOGOUT</button>
      </header>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #333', color: '#888' }}>
              <th style={{ padding: '12px' }}>TEAM / NAME</th>
              <th style={{ padding: '12px' }}>CONTACT</th>
              <th style={{ padding: '12px' }}>COLLEGE</th>
              <th style={{ padding: '12px' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {registrations.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: '#555' }}>NO REGISTRATIONS YET</td></tr>
            ) : (
              registrations.map((reg: any) => (
                <tr key={reg.id} style={{ borderBottom: '1px solid #1a1a2e' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ color: '#00f5ff', fontWeight: 'bold' }}>{reg.teamName || 'INDIVIDUAL'}</div>
                    <div style={{ fontSize: '0.7rem', color: '#ccc' }}>{reg.name}</div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div>{reg.phone}</div>
                    <div style={{ fontSize: '0.7rem', color: '#666' }}>{reg.email}</div>
                  </td>
                  <td style={{ padding: '12px', color: '#aaa', maxWidth: '200px' }}>{reg.institution}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.6rem', 
                      background: reg.status === 'verified' ? '#00ff8822' : '#ffc10722',
                      color: reg.status === 'verified' ? '#00ff88' : '#ffc107',
                      border: `1px solid ${reg.status === 'verified' ? '#00ff88' : '#ffc107'}`
                    }}>
                      {reg.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#444', fontSize: '0.6rem' }}>
        TECHURJA 2026 • COORDINATOR PORTAL • DATA SYNCED VIA MASTER CACHE
      </footer>
    </div>
  );
}
