'use client';

import { useState, useEffect } from 'react';
import CloudflareBroadcaster from '@/components/CloudflareBroadcaster';
import CloudflareHLSPlayer from '@/components/CloudflareHLSPlayer';

interface LiveStream {
  id: string;
  uid: string;
  djName: string;
  eventName: string;
  hlsUrl: string;
  tier: string;
  viewerCount: number;
  isActive: boolean;
  startedAt: string;
}

export default function LiveStreamPage() {
  const [activeStreams, setActiveStreams] = useState<LiveStream[]>([]);
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [djName, setDjName] = useState('');
  const [eventName, setEventName] = useState('Friday Night Live');
  const [currentUser, setCurrentUser] = useState<{ name: string; isDj: boolean } | null>(null);

  // Load mock user - replace with your auth
  useEffect(() => {
    setCurrentUser({ name: 'DJ Fabian', isDj: true });
  }, []);

  const handleLiveStateChange = (isLive: boolean, streamData?: any) => {
    if (isLive && streamData) {
      const newStream: LiveStream = {
        id: streamData.id || '',
        uid: streamData.uid,
        djName: djName || currentUser?.name || 'Unknown DJ',
        eventName: eventName,
        hlsUrl: streamData.hlsUrl,
        tier: streamData.tier || 'new',
        viewerCount: 0,
        isActive: true,
        startedAt: new Date().toISOString(),
      };
      
      setActiveStreams(prev => [...prev, newStream]);
      setSelectedStream(newStream);
    } else {
      // Mark stream as ended
      setActiveStreams(prev => 
        prev.map(s => ({ ...s, isActive: false }))
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-red-500">🔴 Guestlist Live</h1>
          <div className="text-sm text-gray-400">
            {activeStreams.filter(s => s.isActive).length} stream(s) live
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-6">
        {/* DJ Controls */}
        {currentUser?.isDj && (
          <section className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Go Live</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  DJ Name
                </label>
                <input
                  type="text"
                  value={djName}
                  onChange={(e) => setDjName(e.target.value)}
                  placeholder={currentUser.name}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Event Name
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Friday Night Live"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500"
                />
              </div>
            </div>

            <CloudflareBroadcaster
              djName={djName || currentUser.name}
              eventName={eventName}
              onLiveStateChange={handleLiveStateChange}
            />
          </section>
        )}

        {/* Active Streams */}
        {activeStreams.filter(s => s.isActive).length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4">Active Streams ({activeStreams.filter(s => s.isActive).length}/20)</h2>
            
            {/* Featured Stream (Top Verified) */}
            {activeStreams.filter(s => s.isActive && s.tier === 'verified')[0] && (
              <div className="mb-6 p-4 bg-gradient-to-r from-yellow-900/50 to-gray-800 rounded-lg border border-yellow-600/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-yellow-500 text-xs font-bold px-2 py-1 bg-yellow-500/20 rounded">FEATURED</span>
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-red-500">LIVE</span>
                </div>
                <h3 className="text-lg font-bold text-yellow-400">
                  {activeStreams.filter(s => s.isActive && s.tier === 'verified')[0]?.djName}
                </h3>
                <p className="text-sm text-gray-400">
                  {activeStreams.filter(s => s.isActive && s.tier === 'verified')[0]?.eventName}
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeStreams
                .filter(s => s.isActive)
                .sort((a, b) => {
                  const tierOrder = { verified: 0, regular: 1, new: 2 };
                  return tierOrder[a.tier as keyof typeof tierOrder] - tierOrder[b.tier as keyof typeof tierOrder];
                })
                .map(stream => (
                  <div
                    key={stream.uid}
                    onClick={() => setSelectedStream(stream)}
                    className={`bg-gray-800 rounded-lg p-4 cursor-pointer transition-all hover:bg-gray-700 ${
                      selectedStream?.uid === stream.uid 
                        ? 'ring-2 ring-red-500' 
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium">LIVE</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded font-bold ${
                        stream.tier === 'verified' 
                          ? 'bg-yellow-500/20 text-yellow-400' 
                          : stream.tier === 'regular'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {stream.tier.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="font-bold">{stream.djName}</h3>
                    <p className="text-sm text-gray-400">{stream.eventName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Started {new Date(stream.startedAt).toLocaleTimeString()}
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <span>👥 {stream.viewerCount} watching</span>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Video Player */}
        {selectedStream && (
          <section className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">{selectedStream.djName}</h2>
                <p className="text-gray-400">{selectedStream.eventName}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-red-500">LIVE</span>
              </div>
            </div>
            
            <CloudflareHLSPlayer 
              hlsUrl={selectedStream.hlsUrl}
              autoplay={true}
            />
            
            <div className="mt-4 p-3 bg-gray-700 rounded text-sm">
              <p className="text-gray-400">Stream ID: <code className="text-white">{selectedStream.uid}</code></p>
              <p className="text-gray-400 mt-1">HLS URL:</p>
              <code className="block text-xs text-green-400 break-all">
                {selectedStream.hlsUrl}
              </code>
            </div>
          </section>
        )}

        {/* No streams message */}
        {activeStreams.filter(s => s.isActive).length === 0 && !currentUser?.isDj && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-xl">No active streams right now</p>
            <p className="mt-2">Check back later for live performances</p>
          </div>
        )}
      </main>
    </div>
  );
}
