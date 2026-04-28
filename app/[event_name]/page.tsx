'use client';

import React, { useState, useEffect, use } from 'react';

// Robust mapping for event slugs/names
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

  // Handle both slugs and raw event names
  const normalizedSlug = event_name.toLowerCase().replace(/%20/g, ' ');
  const realName = slugToName[normalizedSlug] || event_name.replace(/-/g, ' ');

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
      <div className="coord-container flex-center">
        <div className="loader">INITIALIZING_SECURE_FEED...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="coord-container flex-center">
        <div className="error-box">
          <h2>404_ACCESS_DENIED</h2>
          <p>{error}</p>
          <a href="/coordinator" className="back-link">Return to Hub</a>
        </div>
      </div>
    );
  }

  return (
    <div className="coord-container">
      <header className="coord-header">
        <div className="header-main">
          <div className="event-info">
            <h1 className="neon-text">{eventName.toUpperCase()}</h1>
            <div className="stats-badge">{registrations.length} REGISTRATIONS</div>
          </div>
          <div className="live-status">
            <span className="dot"></span> LIVE DATA STREAM
          </div>
        </div>
      </header>

      <main className="coord-content">
        <div className="table-wrapper">
          <table className="coord-table">
            <thead>
              <tr>
                <th>TEAM / LEADER</th>
                <th>CONTACT DETAILS</th>
                <th>INSTITUTION</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {registrations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-state">NO_DATA_AVAILABLE_IN_CACHE</td>
                </tr>
              ) : (
                registrations.map((reg: any) => (
                  <tr key={reg.id} className="data-row">
                    <td>
                      <div className="team-name">{reg.teamName || 'INDIVIDUAL'}</div>
                      <div className="leader-name">{reg.name}</div>
                    </td>
                    <td>
                      <div className="phone">{reg.phone}</div>
                      <div className="email">{reg.email}</div>
                    </td>
                    <td className="institution">{reg.institution}</td>
                    <td>
                      <span className={`status-pill ${reg.status}`}>
                        {reg.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
      
      <footer className="coord-footer">
        <div className="footer-line">TECHURJA 2026 • COORDINATOR_PORTAL_V2 • {new Date().toLocaleTimeString()}</div>
      </footer>

      <style jsx>{`
        .coord-container {
          min-height: 100vh;
          background-color: #050508;
          color: #e0e0e0;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          padding: 1.5rem;
          background-image: 
            radial-gradient(circle at 50% 50%, rgba(0, 245, 255, 0.03) 0%, transparent 70%),
            linear-gradient(rgba(18, 18, 26, 0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(18, 18, 26, 0.8) 1px, transparent 1px);
          background-size: 100% 100%, 30px 30px, 30px 30px;
        }

        .flex-center {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loader {
          font-size: 1.2rem;
          color: #00f5ff;
          letter-spacing: 4px;
          animation: blink 1.5s infinite;
        }

        .error-box {
          text-align: center;
          border: 1px solid #ff0055;
          padding: 3rem;
          background: rgba(255, 0, 85, 0.05);
          box-shadow: 0 0 30px rgba(255, 0, 85, 0.1);
        }

        .error-box h2 {
          color: #ff0055;
          margin-bottom: 1rem;
        }

        .back-link {
          display: inline-block;
          margin-top: 2rem;
          color: #00f5ff;
          text-decoration: none;
          border: 1px solid #00f5ff;
          padding: 0.5rem 1.5rem;
          transition: all 0.2s;
        }

        .back-link:hover {
          background: #00f5ff;
          color: #000;
        }

        .coord-header {
          margin-bottom: 2rem;
          border-bottom: 1px solid rgba(0, 245, 255, 0.2);
          padding-bottom: 1.5rem;
        }

        .header-main {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        .neon-text {
          color: #00f5ff;
          font-size: 1.8rem;
          margin: 0;
          text-shadow: 0 0 10px rgba(0, 245, 255, 0.5);
          letter-spacing: 2px;
        }

        .stats-badge {
          font-size: 0.8rem;
          color: #888;
          margin-top: 0.5rem;
          letter-spacing: 1px;
        }

        .live-status {
          font-size: 0.7rem;
          color: #00ff88;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(0, 255, 136, 0.05);
          padding: 0.4rem 0.8rem;
          border: 1px solid rgba(0, 255, 136, 0.3);
          border-radius: 4px;
        }

        .dot {
          width: 6px;
          height: 6px;
          background-color: #00ff88;
          border-radius: 50%;
          display: inline-block;
          box-shadow: 0 0 8px #00ff88;
          animation: pulse 2s infinite;
        }

        .table-wrapper {
          background: rgba(10, 10, 15, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }

        .coord-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .coord-table th {
          text-align: left;
          padding: 1.2rem;
          background: rgba(255, 255, 255, 0.02);
          color: #888;
          font-weight: normal;
          border-bottom: 2px solid rgba(255, 255, 255, 0.05);
          letter-spacing: 1px;
        }

        .coord-table td {
          padding: 1.2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          vertical-align: top;
        }

        .data-row:hover {
          background: rgba(0, 245, 255, 0.02);
        }

        .team-name {
          color: #00f5ff;
          font-weight: bold;
          font-size: 0.95rem;
          margin-bottom: 0.3rem;
        }

        .leader-name {
          color: #ccc;
          font-size: 0.75rem;
        }

        .phone {
          color: #eee;
          margin-bottom: 0.2rem;
        }

        .email {
          color: #666;
          font-size: 0.75rem;
        }

        .institution {
          color: #aaa;
          max-width: 250px;
          line-height: 1.4;
        }

        .status-pill {
          padding: 0.3rem 0.8rem;
          border-radius: 4px;
          font-size: 0.65rem;
          font-weight: bold;
          letter-spacing: 1px;
        }

        .status-pill.verified {
          background: rgba(0, 255, 136, 0.1);
          color: #00ff88;
          border: 1px solid rgba(0, 255, 136, 0.3);
        }

        .status-pill.pending {
          background: rgba(255, 193, 7, 0.1);
          color: #ffc107;
          border: 1px solid rgba(255, 193, 7, 0.3);
        }

        .status-pill.rejected {
          background: rgba(255, 0, 85, 0.1);
          color: #ff0055;
          border: 1px solid rgba(255, 0, 85, 0.3);
        }

        .empty-state {
          text-align: center;
          padding: 5rem !important;
          color: #444;
          letter-spacing: 2px;
        }

        .coord-footer {
          margin-top: 3rem;
          text-align: center;
          padding-bottom: 2rem;
        }

        .footer-line {
          color: #333;
          font-size: 0.65rem;
          letter-spacing: 2px;
        }

        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }

        @media (max-width: 768px) {
          .header-main {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          .coord-table th:nth-child(3), .coord-table td:nth-child(3) {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
