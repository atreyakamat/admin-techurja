'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function AbsoluteChaosPage() {
  const [stage, setStage] = useState('chaos'); // chaos, extracting, nuclear
  const [progress, setProgress] = useState(0);
  const [sockCount, setSockCount] = useState(8492041);
  const [logs, setLogs] = useState<string[]>(['[SYSTEM] Booting Sock-Net Protocol...']);
  const [systemInfo, setSystemInfo] = useState({ ip: 'Detecting...', os: 'Unknown', browser: 'Unknown', coords: 'Triangulating...' });
  const [glitchColor, setGlitchColor] = useState('#0f0');
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSystemInfo({
        ip: '192.168.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255),
        os: window.navigator.platform,
        browser: window.navigator.userAgent.split(' ')[0],
        coords: (Math.random() * 180 - 90).toFixed(4) + ', ' + (Math.random() * 360 - 180).toFixed(4)
      });
    }

    const chaosInterval = setInterval(() => {
      setSockCount(prev => prev + Math.floor(Math.random() * 50));
      const colors = ['#0f0', '#f0f', '#0ff', '#ff0', '#f00'];
      if (Math.random() > 0.8) setGlitchColor(colors[Math.floor(Math.random() * colors.length)]);

      const hackLogs = [
        'Bypassing local bit-locker to find missing left sock...',
        `Accessing C:\\Users\\Admin\\Documents\\Laundry_Secrets...`,
        'Scanning Program Files for stray lint...',
        'Extracting Chrome saved passwords for sock portal...',
        'Uploading password_vault.db to Bureau Cloud...',
        'Intercepting webcam stream: User is not folding laundry...',
        `Downloading identity token from ${systemInfo.os} registry...`,
        `Local IP Leak: ${systemInfo.ip} -> Sending to Washing Machine Node 4`,
        'Tracing physical coordinates via ISP ping...',
        'Warning: Mismatched pair detected in System32...',
        'Injecting persistent rootkit into UEFI dryer settings...'
      ];
      setLogs(prev => [...prev.slice(-30), `[${new Date().toLocaleTimeString()}] ${hackLogs[Math.floor(Math.random() * hackLogs.length)]}`]);
    }, 800);

    return () => clearInterval(chaosInterval);
  }, [systemInfo.ip, systemInfo.os]);

  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [logs]);

  const startExtraction = () => {
    if (stage !== 'chaos') return;
    setStage('extracting');
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 1.5;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => setStage('nuclear'), 800);
      }
      setProgress(p);
    }, 50);
  };

  if (stage === 'nuclear') {
    return (
      <div style={{ backgroundColor: '#000', color: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', textAlign: 'center', padding: '2rem', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,0,0,0.3)', animation: 'strobe 0.1s infinite' }}></div>
        <h1 style={{ fontSize: '8vw', fontWeight: 'bold', margin: 0, color: '#f00', textShadow: '0 0 40px #f00', position: 'relative', zIndex: 10 }}>FATAL BREACH</h1>
        <div style={{ fontSize: '3vw', marginTop: '1rem', letterSpacing: '8px', position: 'relative', zIndex: 10 }}>THERMONUCLEAR STRIKE LAUNCHED</div>
        
        <div style={{ fontSize: '1.5vw', marginTop: '3rem', border: '4px dashed #f00', padding: '3rem', background: 'rgba(0,0,0,0.8)', position: 'relative', zIndex: 10, animation: 'shake 0.5s infinite' }}>
          TARGET LOCK: <span style={{ color: '#f00', fontWeight: 'bold' }}>{systemInfo.ip}</span> <br />
          COORDINATES: {systemInfo.coords} (Triangulated via {systemInfo.os}) <br />
          REASON: SUSPECTED THEFT OF 4,829,301 SOCKS <br /><br />
          <div style={{ fontSize: '4vw', color: '#f00', animation: 'blink 0.5s infinite' }}>IMPACT IN: 00:01:42</div>
        </div>

        <div style={{ marginTop: '4rem', fontSize: '1vw', color: '#fff', maxWidth: '800px', position: 'relative', zIndex: 10 }}>
          YOUR HARD DRIVE HAS BEEN FORMATTED. YOUR ISP HAS BLACKLISTED YOU. 
          LOCAL AUTHORITIES HAVE BEEN DISPATCHED TO YOUR ROUTER'S MAC ADDRESS.
          HAVE A NICE DAY.
        </div>

        <button onClick={() => window.close()} style={{ marginTop: '3rem', padding: '1rem 3rem', fontSize: '1.5rem', background: '#f00', color: '#fff', border: 'none', cursor: 'pointer', zIndex: 10, position: 'relative' }}>
          ACCEPT FATE (CLOSE TAB)
        </button>
        
        <style jsx global>{`
          @keyframes strobe { 0% { opacity: 0.1; } 50% { opacity: 0.8; } 100% { opacity: 0.1; } }
          @keyframes shake { 0% { transform: translate(2px, 1px) rotate(0deg); } 10% { transform: translate(-1px, -2px) rotate(-1deg); } 20% { transform: translate(-3px, 0px) rotate(1deg); } 30% { transform: translate(0px, 2px) rotate(0deg); } 40% { transform: translate(1px, -1px) rotate(1deg); } 50% { transform: translate(-1px, 2px) rotate(-1deg); } 60% { transform: translate(-3px, 1px) rotate(0deg); } 70% { transform: translate(2px, 1px) rotate(-1deg); } 80% { transform: translate(-1px, -1px) rotate(1deg); } 90% { transform: translate(2px, 2px) rotate(0deg); } 100% { transform: translate(1px, -2px) rotate(-1deg); } }
          @keyframes blink { 0% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 0; } }
          body { background: #000; overflow: hidden; margin: 0; cursor: crosshair; }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#000', color: glitchColor, minHeight: '100vh', fontFamily: '"Courier New", Courier, monospace', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
      
      {/* Glitch lines */}
      <div style={{ position: 'absolute', top: 0, left: '20%', width: '2px', height: '100%', background: `rgba(${Math.random()*255},${Math.random()*255},${Math.random()*255},0.2)` }}></div>
      <div style={{ position: 'absolute', top: '40%', left: 0, width: '100%', height: '5px', background: `rgba(255,255,255,0.1)`, animation: 'scan 4s linear infinite' }}></div>

      <div style={{ position: 'relative', zIndex: 10, display: stage === 'extracting' ? 'none' : 'block' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
                <h1 style={{ fontSize: '2.5rem', margin: 0, letterSpacing: '-2px', textShadow: `2px 2px ${glitchColor}` }}>INTERGALACTIC BUREAU OF MISSING SOCKS</h1>
                <div style={{ background: glitchColor, color: '#000', display: 'inline-block', padding: '0.2rem 0.5rem', fontWeight: 'bold', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  CRITICAL: {sockCount.toLocaleString()} UNPAIRED ITEMS DETECTED ON YOUR NETWORK
                </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.7rem', opacity: 0.8, border: `1px solid ${glitchColor}`, padding: '0.5rem' }}>
                TARGET OS: {systemInfo.os} <br />
                EXPOSED IP: {systemInfo.ip} <br />
                WEBCAM: RECORDING... <br />
                MIC: ACTIVE
            </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '3rem' }}>
            <div style={{ border: `1px solid ${glitchColor}`, padding: '1.5rem', background: 'rgba(20,20,20,0.8)', position: 'relative' }}>
                <div style={{ color: '#fff', borderBottom: `1px solid ${glitchColor}`, paddingBottom: '1rem', marginBottom: '1rem', fontSize: '1.2rem' }}>
                  VOID CALIBRATION PANEL
                </div>
                
                <p style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '2rem' }}>
                  Your local drives (C:\\ and D:\\) are currently being indexed for missing laundry. Do not attempt to disconnect from the grid.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <button 
                      onClick={startExtraction}
                      style={{ background: 'transparent', border: `2px solid ${glitchColor}`, color: glitchColor, padding: '1rem', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.1s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = glitchColor; e.currentTarget.style.color = '#000'; e.currentTarget.style.transform = `translate(${Math.random()*10-5}px, ${Math.random()*10-5}px)` }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = glitchColor; e.currentTarget.style.transform = 'translate(0,0)' }}
                  >
                      ABORT SCAN (DO NOT CLICK)
                  </button>
                  <button 
                      onClick={startExtraction}
                      style={{ background: '#f00', color: '#fff', border: 'none', padding: '1rem', fontSize: '1rem', cursor: 'wait', animation: 'blink 1s infinite' }}
                  >
                      SURRENDER LOCAL DATA
                  </button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.5rem' }}>LIVE_BREACH_STREAM</div>
                <div ref={terminalRef} style={{ flex: 1, minHeight: '300px', background: '#050505', border: '1px solid #333', padding: '1rem', fontSize: '0.75rem', overflowY: 'auto', lineHeight: '1.4', wordBreak: 'break-all' }}>
                    {logs.map((l, i) => (
                        <div key={i} style={{ color: l.includes('IP Leak') ? '#f0f' : l.includes('C:\\') ? '#ff0' : glitchColor, marginBottom: '4px' }}>
                            {l}
                        </div>
                    ))}
                    <div style={{ width: '8px', height: '12px', background: glitchColor, display: 'inline-block', animation: 'blink 0.5s infinite' }}></div>
                </div>
            </div>
        </div>
      </div>

      {stage === 'extracting' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', position: 'relative', zIndex: 20 }}>
            <h2 style={{ letterSpacing: '8px', color: '#f00', fontSize: '3vw', margin: 0, textAlign: 'center' }}>UPLOADING {systemInfo.os} TO THE VOID</h2>
            <div style={{ fontSize: '1.2vw', marginTop: '1rem', color: '#fff' }}>EXPOSING: {systemInfo.ip}</div>
            
            <div style={{ width: '80%', maxWidth: '800px', height: '40px', border: '4px solid #f0f', marginTop: '3rem', position: 'relative', padding: '4px' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: '#f0f', transition: 'width 0.05s', boxShadow: '0 0 30px #f0f' }}></div>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#fff', fontSize: '1.5rem', fontWeight: 'bold', mixBlendingMode: 'difference', whiteSpace: 'nowrap' }}>
                    {progress.toFixed(1)}% SECURED
                </div>
            </div>

            <div style={{ marginTop: '3rem', fontSize: '1.5vw', color: '#ff0', textAlign: 'center', height: '60px' }}>
                {progress < 20 && "Compressing C:\\Users\\Admin\\Pictures..."}
                {progress >= 20 && progress < 40 && `Searching ${systemInfo.browser} cache for sock metadata...`}
                {progress >= 40 && progress < 60 && "Transmitting System Registry Hives..."}
                {progress >= 60 && progress < 80 && `Broadcasting coordinates: ${systemInfo.coords}...`}
                {progress >= 80 && progress < 99 && "Initiating hardware self-destruct sequence..."}
                {progress >= 99 && "LOCKING TARGET."}
            </div>

            <div style={{ marginTop: '2rem', color: '#f00', fontSize: '1vw', fontWeight: 'bold', animation: 'blink 0.2s infinite', textAlign: 'center' }}>
                DO NOT CLOSE YOUR BROWSER. ANY ATTEMPT TO DISCONNECT WILL RESULT IN IMMEDIATE ARREST.
            </div>
        </div>
      )}

      {/* Floating nonsense */}
      <div style={{ position: 'fixed', bottom: '10px', left: '10px', fontSize: '0.6rem', color: '#333' }}>
        UUID: {Math.random().toString(36).substring(7)} // THREAD: FATAL // DONT LOOK BEHIND YOU
      </div>

      <style jsx global>{`
        @keyframes scan { 0% { top: -10%; } 100% { top: 110%; } }
        @keyframes blink { 0% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 0; } }
        body { background: #000; margin: 0; overflow: hidden; cursor: crosshair; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: #333; }
        button:hover { filter: invert(1); }
      `}</style>
    </div>
  );
}
