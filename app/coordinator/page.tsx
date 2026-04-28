'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const EVENTS = [
  { slug: 'robowars', name: "Robowars" },
  { slug: 'robonexus', name: "Robo Nexus" },
  { slug: 'cyberstrike', name: "Cyber Strike" },
  { slug: 'warroom', name: "War Room Protocol" },
  { slug: 'techyothon', name: "Techyothon" },
  { slug: 'clashpunk', name: "Clashpunk" },
  { slug: 'neonspan', name: "Neon Span" },
  { slug: 'race', name: "L9: Santo Domingo Race" },
  { slug: 'kabuki', name: "Kabuki Roundabout" },
  { slug: 'ghostgrid', name: "Ghostgrid" },
  { slug: 'matrix', name: "Escape the Matrix" },
  { slug: 'pixelplay', name: "Pixel Play" },
  { slug: 'structomat', name: "Structomat" },
  { slug: 'symmetry', name: "Symmetry Art" },
  { slug: 'breach', name: "Circuit Breach" },
  { slug: 'heist', name: "The Cyber Heist" },
  { slug: 'runner', name: "Grid Runner" },
  { slug: 'smashers', name: "Cyber Smashers" },
  { slug: 'innovibe', name: "Innovibe" },
  { slug: 'cybertug', name: "Cyber Tug" }
];

export default function CoordinatorHub() {
  const [search, setSearch] = useState('');

  const filteredEvents = EVENTS.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="hub-container">
      <header className="hub-header">
        <h1 className="neon-text">COORDINATOR_CENTRAL</h1>
        <p className="subtitle">SELECT EVENT TO ACCESS REGISTRATION FEED</p>
      </header>

      <div className="search-box">
        <input 
          type="text" 
          placeholder="FILTER_EVENTS..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="events-grid">
        {filteredEvents.map(event => (
          <Link href={`/${event.slug}`} key={event.slug} className="event-card">
            <div className="event-name">{event.name}</div>
            <div className="event-link">ACCESS_FEED →</div>
          </Link>
        ))}
      </div>

      <footer className="hub-footer">
        <div className="footer-line">TECHURJA 2026 • SYSTEM_HUB • OPEN_ACCESS_ENABLED</div>
      </footer>

      <style jsx>{`
        .hub-container {
          min-height: 100vh;
          background-color: #050508;
          color: #e0e0e0;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          padding: 3rem 1.5rem;
          background-image: 
            radial-gradient(circle at 50% 50%, rgba(0, 245, 255, 0.02) 0%, transparent 70%),
            linear-gradient(rgba(18, 18, 26, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(18, 18, 26, 0.5) 1px, transparent 1px);
          background-size: 100% 100%, 40px 40px, 40px 40px;
        }

        .hub-header {
          text-align: center;
          margin-bottom: 4rem;
        }

        .neon-text {
          color: #00f5ff;
          font-size: 2.5rem;
          margin: 0;
          text-shadow: 0 0 15px rgba(0, 245, 255, 0.4);
          letter-spacing: 4px;
        }

        .subtitle {
          color: #666;
          font-size: 0.8rem;
          margin-top: 1rem;
          letter-spacing: 2px;
        }

        .search-box {
          max-width: 600px;
          margin: 0 auto 3rem auto;
        }

        .search-box input {
          width: 100%;
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(0, 245, 255, 0.2);
          padding: 1rem 1.5rem;
          color: #fff;
          font-family: inherit;
          font-size: 1rem;
          border-radius: 4px;
          transition: all 0.3s;
        }

        .search-box input:focus {
          outline: none;
          border-color: #00f5ff;
          box-shadow: 0 0 15px rgba(0, 245, 255, 0.1);
        }

        .events-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .event-card {
          background: rgba(10, 10, 15, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 2rem;
          border-radius: 8px;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 160px;
        }

        .event-card:hover {
          background: rgba(0, 245, 255, 0.05);
          border-color: #00f5ff;
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
        }

        .event-name {
          color: #fff;
          font-size: 1.1rem;
          font-weight: bold;
          line-height: 1.4;
        }

        .event-link {
          color: #00f5ff;
          font-size: 0.75rem;
          letter-spacing: 1px;
          margin-top: 1rem;
          opacity: 0.7;
        }

        .event-card:hover .event-link {
          opacity: 1;
        }

        .hub-footer {
          margin-top: 5rem;
          text-align: center;
          padding-bottom: 2rem;
        }

        .footer-line {
          color: #333;
          font-size: 0.65rem;
          letter-spacing: 2px;
        }

        @media (max-width: 768px) {
          .neon-text {
            font-size: 1.8rem;
          }
          .events-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
