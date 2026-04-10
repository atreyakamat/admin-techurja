'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function TraumaticLandingPage() {
  const [stage, setStage] = useState('descent'); // descent, hacking, nuclear
  const [progress, setProgress] = useState(0);
  const [systemInfo, setSystemInfo] = useState({ ip: 'Detecting...', os: 'Unknown' });
  const [scrollY, setScrollY] = useState(0);
  const [malwareLogs, setMalwareLogs] = useState<string[]>([]);
  
  const [viralIcons, setViralIcons] = useState<{left: string, top: string, delay: string}[]>([]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSystemInfo({
        ip: '102.16.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255),
        os: window.navigator.platform
      });

      // Generate random icons once on mount
      const icons = [...Array(20)].map(() => ({
        left: `${Math.random() * 100}vw`,
        top: `${Math.random() * 100}vh`,
        delay: `${Math.random() * 2 + 1}s`
      }));
      setViralIcons(icons);

      const handleScroll = () => setScrollY(window.scrollY);
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const startBreach = () => {
    setStage('hacking');
    let p = 0;
    
    const viruses = [
      "Injecting Trojan_Horse_Zeus_v9.exe...",
      "Deploying WannaCry_Ransomware.dll to C:\\...",
      "Infecting System32 with polymorphic worm...",
      "Malicious payload executing in background...",
      "Overriding Windows Defender and Antivirus...",
      "Spreading rootkit through local subnet...",
      "Encrypting user documents... (Keys sent to Dark Web)",
      "Installing crypto-miner (100% CPU allocation)...",
      "FATAL INFECTION SPREADING...",
      "Downloading 50,000 malware signatures...",
      "Registry corrupted by Spyware..."
    ];

    const interval = setInterval(() => {
      p += Math.random() * 1.5;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => setStage('nuclear'), 1500);
      }
      setProgress(p);
      
      if (Math.random() > 0.4) {
        setMalwareLogs(prev => [...prev.slice(-6), viruses[Math.floor(Math.random() * viruses.length)]]);
      }
    }, 100);
  };

  if (stage === 'nuclear') {
    return (
      <div style={{ backgroundColor: '#000', color: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', textAlign: 'center', padding: '2rem', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,0,0,0.5)', animation: 'strobe 0.05s infinite' }}></div>
        <h1 style={{ fontSize: '10vw', fontWeight: 'bold', color: '#f00', textShadow: '0 0 50px #f00', margin: 0, position: 'relative', zIndex: 10 }}>TERMINATED</h1>
        <div style={{ fontSize: '3vw', letterSpacing: '10px', marginTop: '1rem', position: 'relative', zIndex: 10 }}>RETALIATION STRIKE: LIVE</div>
        <div style={{ fontSize: '1.5vw', marginTop: '2rem', background: '#000', padding: '2rem', border: '5px solid #f00', position: 'relative', zIndex: 10 }}>
            TARGET IP: {systemInfo.ip} <br />
            MAC ADDR: [REDACTED_FOR_PUBLIC_SAFETY] <br />
            INFECTION STATUS: 100% FATAL <br />
            TIME_TO_ZERO: 00:00:14
        </div>
        <div style={{ marginTop: '3rem', fontSize: '2rem', color: '#ff0', animation: 'blink 0.2s infinite', position: 'relative', zIndex: 10 }}>
            OWNED BY THE TECHURJA SHADOW SYNDICATE
        </div>
        <div style={{ marginTop: '2rem', fontSize: '1rem', opacity: 0.8, position: 'relative', zIndex: 10 }}>
            Your PC is maliciously infected. Your disk has been overwritten with static. Disconnecting...
        </div>
        
        {/* Falling viral icons */}
        {viralIcons.map((icon, i) => (
            <div key={i} style={{ 
                position: 'absolute', color: '#f00', fontSize: '3rem', 
                left: icon.left, top: icon.top, 
                animation: `fall ${icon.delay} linear infinite`, zIndex: 5, opacity: 0.5 
            }}>
                ☠️
            </div>
        ))}

        <style jsx global>{` 
            @keyframes strobe { 0% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 0; } } 
            @keyframes fall { 0% { transform: translateY(-100vh) rotate(0deg); } 100% { transform: translateY(100vh) rotate(360deg); } }
            @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
            body { margin: 0; overflow: hidden; background: #000; }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ 
        backgroundColor: '#050505', 
        color: '#0f0', 
        fontFamily: '"Courier New", Courier, monospace',
        cursor: 'crosshair',
        overflowX: 'hidden'
    }}>
      {/* Glitchy Static Overlay */}
      <div style={{ 
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundImage: 'url(https://media.giphy.com/media/oEI9uWUicGLeU/giphy.gif)', 
          opacity: 0.05, pointerEvents: 'none', zIndex: 100 
      }}></div>

      {/* Floating coordinates that follow scroll */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', fontSize: '0.7rem', opacity: 0.4, zIndex: 50 }}>
          REL_ALT: {scrollY}m <br />
          VOID_STABILITY: {(100 - scrollY/100).toFixed(2)}% <br />
          MALWARE_DEFENSE: OFFLINE
      </div>

      {/* SECTION 1: THE ENTRY */}
      <section style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '5rem', position: 'relative' }}>
          <h1 style={{ fontSize: '5vw', letterSpacing: '-5px', margin: 0, color: '#fff', textShadow: '0 0 20px #0f0', animation: 'glitch 3s infinite' }}>BUREAU_OF_VOID</h1>
          <p style={{ fontSize: '1.5vw', maxWidth: '800px', lineHeight: '1.6', color: '#0f0', marginTop: '2rem' }}>
              Welcome, Citizen. You have arrived at the Intergalactic Repository for Non-Essential Existence. 
              Please scroll down to begin your biological and digital audit.
          </p>
          <div style={{ marginTop: '5rem', animation: 'bounce 2s infinite', fontSize: '1.2rem', color: '#f00' }}>
              ↓↓↓ SCROLL TO FORFEIT YOUR SYSTEM SECURITY ↓↓↓
          </div>
      </section>

      {/* SECTION 2: THE TAXONOMY OF SILENCE */}
      <section style={{ height: '120vh', padding: '5rem', background: '#000', display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center' }}>
          <div style={{ transform: `translateY(${scrollY * 0.1}px)` }}>
              <img 
                src="https://picsum.photos/id/237/600/800?grayscale&blur=5" 
                alt="Static" 
                style={{ width: '100%', border: '1px solid #333', filter: 'contrast(200%) invert(1)' }} 
              />
          </div>
          <div style={{ padding: '3rem' }}>
              <h2 style={{ fontSize: '3rem', color: '#f0f' }}>THE TAXONOMY OF SILENCE</h2>
              <p style={{ fontSize: '1rem', lineHeight: '2', color: '#aaa' }}>
                  To understand the volume of a whisper, one must first measure the weight of the air it displaces. 
                  In 1924, we found that silence weighs exactly 0.004 grams per cubic meter of regret. 
                  If you listen closely to the fan in your computer right now, you can hear the Bureau counting your teeth. 
                  One. Two. Seventeen. 
                  The counting never stops because the teeth are always moving.
              </p>
          </div>
      </section>

      {/* SECTION 3: VIRUS SCANNER FAILING */}
      <section style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050000', borderTop: '2px dashed #f00', borderBottom: '2px dashed #f00' }}>
          <div style={{ border: '2px solid #f00', padding: '3rem', background: 'rgba(255,0,0,0.1)', textAlign: 'center', maxWidth: '800px' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>☣️</div>
              <h2 style={{ color: '#f00', fontSize: '2.5rem', margin: 0, animation: 'blink 0.5s infinite' }}>WARNING: MULTIPLE THREATS DETECTED</h2>
              <div style={{ textAlign: 'left', marginTop: '2rem', color: '#ff0', fontFamily: 'monospace', fontSize: '1.2rem', lineHeight: '1.8' }}>
                  &gt; Scanning C:\\Windows\\System32... <span style={{ color: '#f00' }}>INFECTED</span><br/>
                  &gt; Scanning Local Network... <span style={{ color: '#f00' }}>COMPROMISED</span><br/>
                  &gt; Anti-Virus Service... <span style={{ color: '#f00' }}>CRITICAL FAILURE</span><br/>
                  &gt; Trojan.Win32.TechUrja... <span style={{ color: '#0f0' }}>ACTIVE AND MULTIPLYING</span>
              </div>
          </div>
      </section>

      {/* SECTION 4: VIDEO SURVEILLANCE */}
      <section style={{ height: '100vh', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', textAlign: 'center' }}>
              <div style={{ 
                  width: '80vw', height: '45vw', margin: '0 auto', background: '#111', 
                  border: '10px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative'
              }}>
                  <div style={{ 
                      position: 'absolute', top: '10px', left: '10px', color: '#f00', 
                      fontSize: '1.5rem', fontWeight: 'bold', animation: 'blink 1s infinite' 
                  }}>● LIVE_FEED_CAM_01_HACKED</div>
                  
                  {/* Fake Glitch Video Content */}
                  <div style={{ 
                      width: '100%', height: '100%', 
                      backgroundImage: 'url(https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJueXp6bmR6ZngxbmR6ZngxbmR6ZngxbmR6ZngxbmR6ZngxbmR6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/YPIsk1n7PVXG0/giphy.gif)',
                      backgroundSize: 'cover',
                      filter: 'hue-rotate(90deg) contrast(150%)'
                  }}></div>
              </div>
              <div style={{ marginTop: '2rem', fontSize: '1.2rem', letterSpacing: '5px', color: '#f00' }}>SUBJECT DETECTED: {systemInfo.os.toUpperCase()} DEVICE INFECTED</div>
          </div>
      </section>

      {/* SECTION 5: THE FINAL TRIGGER */}
      <section style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
          <div style={{ border: '2px solid #f00', padding: '4rem', textAlign: 'center', background: 'rgba(255,0,0,0.05)', boxShadow: '0 0 50px rgba(255,0,0,0.2)', width: '80%', maxWidth: '800px' }}>
              <h2 style={{ fontSize: '3rem', color: '#f00', margin: 0 }}>FINAL_POINT_OF_NO_RETURN</h2>
              <p style={{ color: '#fff', marginTop: '1rem', fontSize: '1.2rem' }}>
                  You have reached the bottom of the Bureau. Your system is heavily compromised. 
                  Only the Sync remains.
              </p>
              
              <div style={{ marginTop: '3rem' }}>
                  {stage === 'descent' ? (
                      <button 
                        onClick={startBreach}
                        className="nuclear-btn"
                      >
                        INITIATE TOTAL SYSTEM SYNC
                      </button>
                  ) : (
                      <div style={{ textAlign: 'left', background: '#111', padding: '2rem', border: '1px solid #f00' }}>
                          <div style={{ color: '#f00', marginBottom: '1rem', fontSize: '1.5rem', animation: 'blink 0.5s infinite' }}>⚠️ INJECTING MALWARE...</div>
                          
                          <div style={{ height: '30px', border: '2px solid #f00', padding: '2px', marginBottom: '1rem' }}>
                              <div style={{ height: '100%', background: '#f00', width: `${progress}%`, transition: 'width 0.1s' }}></div>
                          </div>
                          
                          <div style={{ color: '#0f0', fontSize: '0.9rem', height: '150px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                              {malwareLogs.map((log, i) => (
                                  <div key={i} style={{ color: log.includes('Trojan') || log.includes('Ransomware') ? '#f0f' : '#ff0' }}>{log}</div>
                              ))}
                          </div>
                          
                          <div style={{ marginTop: '1rem', color: '#f00', fontWeight: 'bold', textAlign: 'center', fontSize: '1.5rem' }}>{Math.floor(progress)}% COMPROMISED</div>
                      </div>
                  )}
              </div>
          </div>
      </section>

      <footer style={{ padding: '2rem', textAlign: 'center', fontSize: '1rem', color: '#f00', letterSpacing: '5px', animation: 'blink 2s infinite' }}>
          OWNED BY THE TECHURJA SHADOW SYNDICATE
      </footer>

      <style jsx global>{`
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes glitch { 0% { transform: translate(0) } 20% { transform: translate(-2px, 2px) } 40% { transform: translate(-2px, -2px) } 60% { transform: translate(2px, 2px) } 80% { transform: translate(2px, -2px) } 100% { transform: translate(0) } }
        .nuclear-btn {
            background: transparent;
            border: 2px solid #f00;
            color: #f00;
            padding: 1.5rem 3rem;
            font-size: 1.5rem;
            font-weight: bold;
            font-family: monospace;
            cursor: pointer;
            transition: all 0.2s;
        }
        .nuclear-btn:hover {
            background: #f00;
            color: #000;
            box-shadow: 0 0 30px #f00;
            transform: scale(1.1);
        }
        body { margin: 0; padding: 0; background: #000; }
        ::-webkit-scrollbar { width: 0px; }
      `}</style>
    </div>
  );
}
