'use client';

import { useState } from 'react';
import UnifiedStreamPlayer from '@/components/UnifiedStreamPlayer';

export default function WatchPage() {
  const [hlsUrl, setHlsUrl] = useState('');
  const [whepUrl, setWhepUrl] = useState('');
  const [isWatching, setIsWatching] = useState(false);
  const [streamMode, setStreamMode] = useState<'auto' | 'hls' | 'whep'>('auto');

  // Default URLs for DJ Fabian's stream
  const defaultHlsUrl = 'https://customer-xfdlafmmuylrdexv.cloudflarestream.com/6622b373b6e857c4d3bf3954ca9e17be/manifest/video.m3u8';
  const defaultWhepUrl = 'https://customer-xfdlafmmuylrdexv.cloudflarestream.com/6622b373b6e857c4d3bf3954ca9e17be/webRTC/play';

  const handleWatch = () => {
    setIsWatching(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔴</span>
            <h1 className="text-xl font-bold">Guestlist Live</h1>
          </div>
          <div className="text-sm text-gray-400">
            Fan Mode
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {!isWatching ? (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎧</div>
              <h2 className="text-2xl font-bold mb-2">Watch Live DJ Sets</h2>
              <p className="text-gray-400">Supports both WebRTC and HLS streams</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 space-y-4">
              {/* Stream Mode Selection */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setStreamMode('auto')}
                  className={`px-3 py-1 rounded text-sm ${streamMode === 'auto' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                >
                  Auto Detect
                </button>
                <button
                  onClick={() => setStreamMode('whep')}
                  className={`px-3 py-1 rounded text-sm ${streamMode === 'whep' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                >
                  WebRTC (Low Latency)
                </button>
                <button
                  onClick={() => setStreamMode('hls')}
                  className={`px-3 py-1 rounded text-sm ${streamMode === 'hls' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                >
                  HLS (Compatible)
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  HLS Stream URL (Optional)
                </label>
                <input
                  type="text"
                  value={hlsUrl}
                  onChange={(e) => setHlsUrl(e.target.value)}
                  placeholder={defaultHlsUrl}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  WebRTC (WHEP) URL (Optional)
                </label>
                <input
                  type="text"
                  value={whepUrl}
                  onChange={(e) => setWhepUrl(e.target.value)}
                  placeholder={defaultWhepUrl}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <p className="text-xs text-gray-500">
                Leave URLs empty to use the current live stream. The player will automatically try WebRTC first, then fallback to HLS.
              </p>

              <button
                onClick={handleWatch}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors"
              >
                ▶ Watch Live Stream
              </button>
            </div>

            <div className="text-center text-sm text-gray-500">
              <p>Current stream: DJ Fabian - Live Set</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                <span className="font-bold">LIVE NOW</span>
              </div>
              <button
                onClick={() => setIsWatching(false)}
                className="text-sm text-gray-400 hover:text-white"
              >
                ← Back
              </button>
            </div>

            <UnifiedStreamPlayer 
              hlsUrl={streamMode !== 'whep' ? (hlsUrl || defaultHlsUrl) : undefined}
              whepUrl={streamMode !== 'hls' ? (whepUrl || defaultWhepUrl) : undefined}
              autoplay={true}
            />

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-lg">
                  🎧
                </div>
                <div>
                  <p className="font-bold">DJ Fabian</p>
                  <p className="text-sm text-gray-400">Live Set</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
