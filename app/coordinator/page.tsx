'use client';

import { useState, useEffect } from 'react';

interface Registration {
  id: string;
  teamName: string;
  leaderName: string;
  leaderEmail: string;
  leaderPhone: string;
  institution: string;
  eventName: string;
  transactionId: string;
  participant2?: string;
  participant3?: string;
  participant4?: string;
  status: string;
}

export default function CoordinatorPortal() {
  const [event, setEvent] = useState<string>('');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0 });

  const events = [
    { name: 'Robowars', slug: 'robowars' },
    { name: 'INNOVIBE', slug: 'innovibe' },
    { name: 'GHOSTGRID', slug: 'ghostgrid' },
    { name: 'Robo Nexus', slug: 'robonexus' },
    { name: 'Cyber Strike', slug: 'cyberstrike' },
    { name: 'War Room Protocol', slug: 'warroom' },
    { name: 'Techyothon', slug: 'techyothon' },
    { name: 'Clashpunk', slug: 'clashpunk' },
    { name: 'Neon Span', slug: 'neonspan' },
    { name: 'Kabuki Roundabout', slug: 'kabuki' },
    { name: 'Escape the Matrix', slug: 'matrix' },
    { name: 'Pixel Play', slug: 'pixelplay' },
    { name: 'Structomat', slug: 'structomat' },
    { name: 'Symmetry Art', slug: 'symmetry' },
    { name: 'Circuit Breach', slug: 'breach' },
    { name: 'The Cyber Heist', slug: 'heist' },
    { name: 'Grid Runner', slug: 'runner' },
    { name: 'Cyber Smashers', slug: 'smashers' },
    { name: 'Cyber Tug', slug: 'cybertug' },
  ];

  const fetchRegistrations = async (eventName: string, searchTerm?: string) => {
    if (!eventName) return;
    
    setLoading(true);
    try {
      let url = `/api/coordinator/registrations?event=${encodeURIComponent(eventName)}`;
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setRegistrations(data.data);
        setStats({
          total: data.count,
          pending: data.data.filter((r: Registration) => r.status === 'pending').length,
        });
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventChange = (eventName: string) => {
    setEvent(eventName);
    setSearch('');
    fetchRegistrations(eventName);
  };

  const handleSearch = (term: string) => {
    setSearch(term);
    if (event) {
      fetchRegistrations(event, term);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎯 TechUrja Coordinator Portal
          </h1>
          <p className="text-purple-300">
            View and manage registrations for your event
          </p>
        </div>

        {/* Event Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-3">
            <label className="block text-white font-semibold mb-3">
              Select Event
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {events.map((evt) => (
                <button
                  key={evt.slug}
                  onClick={() => handleEventChange(evt.name)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    event === evt.name
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  {evt.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search & Stats */}
        {event && (
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Search by team name, leader, or email..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-purple-500 focus:outline-none focus:border-purple-400"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1 text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {stats.total}
                  </div>
                  <div className="text-sm text-gray-400">Total Registrations</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {stats.pending}
                  </div>
                  <div className="text-sm text-gray-400">Pending</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center text-purple-300">
            <div className="inline-block">
              <div className="animate-spin">⟳</div> Loading registrations...
            </div>
          </div>
        )}

        {/* Registrations Table */}
        {!loading && registrations.length > 0 && (
          <div className="bg-slate-800 rounded-lg overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-900 border-b border-purple-500">
                  <tr>
                    <th className="px-6 py-3 text-left text-purple-300 font-semibold">
                      Team Name
                    </th>
                    <th className="px-6 py-3 text-left text-purple-300 font-semibold">
                      Leader
                    </th>
                    <th className="px-6 py-3 text-left text-purple-300 font-semibold">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-purple-300 font-semibold">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-purple-300 font-semibold">
                      Institution
                    </th>
                    <th className="px-6 py-3 text-left text-purple-300 font-semibold">
                      UTR
                    </th>
                    <th className="px-6 py-3 text-left text-purple-300 font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {registrations.map((reg) => (
                    <tr
                      key={reg.id}
                      className="hover:bg-slate-700 transition"
                    >
                      <td className="px-6 py-3 text-white font-medium">
                        {reg.teamName}
                      </td>
                      <td className="px-6 py-3 text-gray-300">
                        {reg.leaderName}
                      </td>
                      <td className="px-6 py-3 text-gray-300">
                        <a
                          href={`mailto:${reg.leaderEmail}`}
                          className="text-purple-400 hover:underline"
                        >
                          {reg.leaderEmail}
                        </a>
                      </td>
                      <td className="px-6 py-3 text-gray-300">
                        {reg.leaderPhone}
                      </td>
                      <td className="px-6 py-3 text-gray-300">
                        {reg.institution}
                      </td>
                      <td className="px-6 py-3 text-gray-300 font-mono text-xs">
                        {reg.transactionId}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            reg.status === 'pending'
                              ? 'bg-yellow-900 text-yellow-200'
                              : reg.status === 'accepted'
                              ? 'bg-green-900 text-green-200'
                              : 'bg-red-900 text-red-200'
                          }`}
                        >
                          {reg.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && event && registrations.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <p className="text-lg">No registrations found for this event</p>
          </div>
        )}

        {/* Empty State */}
        {!event && (
          <div className="text-center text-gray-400 py-12">
            <p className="text-lg">Select an event to view registrations</p>
          </div>
        )}
      </div>
    </div>
  );
}
