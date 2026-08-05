import React, { useEffect, useState } from 'react';
import HLSPlayer from './HLSPlayer';

interface Stream {
  id: string;
  djName: string;
  hlsUrl: string;
  isLive: boolean;
  startedAt: string;
}

export default function MultiStreamViewer() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch active streams from your API
    const fetchStreams = async () => {
      try {
        const response = await fetch('/api/streams');
        const data = await response.json();
        setStreams(data.streams || []);
      } catch (error) {
        console.error('Failed to fetch streams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStreams();
    // Poll every 10 seconds for new streams
    const interval = setInterval(fetchStreams, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  // Fallback: Show hardcoded stream for testing
  const demoStream: Stream = {
    id: '6622b373b6e857c4d3bf3954ca9e17be',
    djName: 'DJ Fabian',
    hlsUrl: 'https://customer-xfdlafmmuylrdexv.cloudflarestream.com/6622b373b6e857c4d3bf3954ca9e17be/manifest/video.m3u8',
    isLive: true,
    startedAt: new Date().toISOString()
  };

  const displayStreams = streams.length > 0 ? streams : [demoStream];

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">GUESTLIST.TV</h1>
        <p className="text-gray-400">Live DJ Streams</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {displayStreams.map((stream) => (
          <div key={stream.id} className="space-y-2">
            <HLSPlayer
              streamUrl={stream.hlsUrl}
              djName={stream.djName}
              isLive={stream.isLive}
            />
            <div className="flex justify-between text-sm text-gray-400">
              <span>Started: {new Date(stream.startedAt).toLocaleTimeString()}</span>
              <span>{stream.isLive ? '🟢 Live' : '⚫ Offline'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
