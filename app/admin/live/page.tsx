'use client';

import { useState, useEffect } from 'react';

interface StreamStats {
  uid: string;
  djName: string;
  eventName: string;
  status: 'live' | 'ended' | 'error';
  startedAt: string;
  endedAt?: string;
  duration?: string;
  viewerCount?: number;
}

export default function AdminDashboard() {
  const [streams, setStreams] = useState<StreamStats[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with your database/API
  useEffect(() => {
    setStreams([
      {
        uid: 'demo-1',
        djName: 'DJ Fabian',
        eventName: 'Friday Night Live',
        status: 'live',
        startedAt: new Date().toISOString(),
        viewerCount: 42,
      },
    ]);
    setLoading(false);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-red-500';
      case 'ended': return 'bg-gray-500';
      case 'error': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getDuration = (startedAt: string) => {
    const start = new Date(startedAt);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Guestlist Admin</h1>
            <p className="text-gray-400 mt-1">Live Stream Management</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-red-500">{streams.filter(s => s.status === 'live').length}</p>
              <p className="text-sm text-gray-400">Live Now</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                {streams.reduce((acc, s) => acc + (s.viewerCount || 0), 0)}
              </p>
              <p className="text-sm text-gray-400">Total Viewers</p>
            </div>
          </div>
        </div>

        {/* Streams Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Active Streams</h2>
            <button 
              onClick={() => window.location.reload()}
              className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-colors"
            >
              Refresh
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-750">
                <tr className="text-left text-gray-400 text-sm">
                  <th className="p-4">Status</th>
                  <th className="p-4">DJ</th>
                  <th className="p-4">Event</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Viewers</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-400">
                      Loading...
                    </td>
                  </tr>
                ) : streams.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-400">
                      No streams found
                    </td>
                  </tr>
                ) : (
                  streams.map(stream => (
                    <tr key={stream.uid} className="hover:bg-gray-750">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${getStatusColor(stream.status)} ${stream.status === 'live' ? 'animate-pulse' : ''}`} />
                          <span className="text-sm capitalize">{stream.status}</span>
                        </div>
                      </td>
                      <td className="p-4 font-medium">{stream.djName}</td>
                      <td className="p-4 text-gray-300">{stream.eventName}</td>
                      <td className="p-4 text-gray-300">
                        {stream.status === 'live' 
                          ? getDuration(stream.startedAt)
                          : stream.duration || '-'
                        }
                      </td>
                      <td className="p-4">
                        {stream.viewerCount !== undefined && (
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>{stream.viewerCount}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigator.clipboard.writeText(stream.uid)}
                            className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition-colors"
                          >
                            Copy ID
                          </button>
                          <a
                            href={`/live?stream=${stream.uid}`}
                            target="_blank"
                            className="text-xs bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded transition-colors"
                          >
                            Watch
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <a 
            href="/live"
            className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <h3 className="font-semibold mb-1">🎥 Go Live</h3>
            <p className="text-sm text-gray-400">Start a new broadcast</p>
          </a>
          
          <a 
            href="https://dash.cloudflare.com/?to=/:account/stream/inputs"
            target="_blank"
            className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <h3 className="font-semibold mb-1">☁️ Cloudflare Dashboard</h3>
            <p className="text-sm text-gray-400">Manage streams in Cloudflare</p>
          </a>
          
          <a 
            href="https://developers.cloudflare.com/stream/webrtc-beta/"
            target="_blank"
            className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <h3 className="font-semibold mb-1">📖 Documentation</h3>
            <p className="text-sm text-gray-400">Cloudflare Stream WebRTC docs</p>
          </a>
        </div>
      </div>
    </div>
  );
}
