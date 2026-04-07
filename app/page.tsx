'use client';

import React, { useState, useEffect } from 'react';

export default function SpoofLandingPage() {
  const [glitchText, setGlitchText] = useState('BUREAU OF MISSING SOCKS');
  const [sockCount, setSockCount] = useState(4829301);

  useEffect(() => {
    const interval = setInterval(() => {
      const glitches = ['LOST COTTON', 'SINGLE HEELS', 'VOID IN DRAWER', 'WASHING MACHINE PORTAL'];
      setGlitchText(glitches[Math.floor(Math.random() * glitches.length)]);
      setSockCount(prev => prev + Math.floor(Math.random() * 5));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      backgroundColor: '#050505',
      color: '#00ff41',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'monospace',
      textAlign: 'center',
      padding: '2rem',
      cursor: 'help'
    }}>
      <div style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '2rem' }}>
        OFFICIAL PORTAL // ACCESS LEVEL: NON-EXISTENT
      </div>

      <div style={{ border: '1px solid #333', padding: '2rem', maxWidth: '600px', background: '#0a0a0a' }}>
        <h1 style={{ letterSpacing: '5px', fontSize: '1.5rem', color: '#ff00ff' }}>{glitchText}</h1>
        <div style={{ margin: '1.5rem 0', color: '#888' }}>
          Welcome to the Intergalactic Repository. We currently have <span style={{ color: '#fff' }}>{sockCount.toLocaleString()}</span> unpaired socks in our care.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '2rem' }}>
          <button className="spoof-btn" onClick={() => alert('Request denied. Sock has been promoted to a mitten.')}>REPORT A LOSS</button>
          <button className="spoof-btn" onClick={() => window.location.href = 'https://www.google.com/search?q=why+do+socks+disappear'}>APPLY FOR REUNION</button>
          <button className="spoof-btn" onClick={() => alert('The dryer is currently sleeping. Do not wake it.')}>DRYER STATUS</button>
          <button className="spoof-btn" onClick={() => {
            const colors = ['#f00', '#0f0', '#00f', '#ff0'];
            document.body.style.backgroundColor = colors[Math.floor(Math.random()*colors.length)];
            setTimeout(() => document.body.style.backgroundColor = '#050505', 100);
          }}>CALIBRATE VOID</button>
        </div>

        <div style={{ marginTop: '2rem', fontSize: '0.7rem', color: '#444' }}>
          By staying on this page, you agree that your left sock belongs to the universe.
          <br /><br />
          System Hash: 0xDEADBEEF_S0CK
        </div>
      </div>

      <div style={{ marginTop: '3rem', fontSize: '0.6rem', color: '#222' }}>
        Designed by the Committee of Static Electricity.
      </div>

      <style jsx>{`
        .spoof-btn {
          background: transparent;
          border: 1px solid #00ff41;
          color: #00ff41;
          padding: 0.75rem;
          font-family: monospace;
          cursor: crosshair;
          transition: all 0.3s;
        }
        .spoof-btn:hover {
          background: #00ff41;
          color: #000;
          box-shadow: 0 0 20px #00ff41;
        }
      `}</style>
    </div>
  );
}
