'use client';

import React, { useState, useEffect, use } from 'react';

// Reusing the mapping from the coordinator portal
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
  'heist': 'The Cyber Heist',
  'runner': 'Grid Runner',
  'smashers': 'Cyber Smashers',
  'innovibe': 'Innovibe',
  'cybertug': 'Cyber Tug'
};

export default function OpenCoordinatorPage({ params }: { params: Promise<{ event_name: string }> }) {
  const { event_name } = use(params);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eventName, setEventName] = useState('');

  const realName = slugToName[event_name.toLowerCase()] || event_name;

  useEffect(() => {
    async function fetchRegistrations() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/coordinator/registrations?event=${encodeURIComponent(realName)}`);
        const data = await res.json();
        if (data.success) {
          setRegistrations(data.data);
          setEventName(realName);
        } else {
          setError('Event not found or failed to load registrations');
        }
      } catch (err: unknown) {
        setError('Failed to load registrations');
      } finally {
        setLoading(false);
      }
    }

    fetchRegistrations();
  }, [realName]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0f', color: 'white', fontFamily: 'monospace' }}>
        <div style={{ animation: 'blink 1s infinite', letterSpacing: '2px' }}>INITIALIZING DATA STREAM...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0f', color: 'white', fontFamily: 'monospace' }}>
        <div style={{ color: '#ff0055', textAlign: 'center' }}>
          <h2>404 ERROR</h2>
          <p>{error}</p>
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
        <div style={{ fontSize: '0.6rem', color: 'var(--neon-green)', border: '1px solid #00ff88', padding: '4px 8px', borderRadius: '4px' }}>
          ● LIVE DATA
        </div>
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
        TECHURJA 2026 • OPEN COORDINATOR ACCESS • {new Date().toLocaleTimeString()}
      </footer>

      <style jsx global>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
