'use client';

import { useEffect, useState } from 'react';

interface Stream {
  id: string;
  channel: string;
  title: string;
  description: string;
  scheduled_at: string;
  status: string;
  profiles?: { username: string; display_name: string };
}

interface UpcomingStreamsProps {
  channelFilter?: string;
}

export default function UpcomingStreams({ channelFilter }: UpcomingStreamsProps) {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreams();
  }, [channelFilter]);

  const fetchStreams = async () => {
    try {
      const url = new URL('/api/streams', window.location.origin);
      if (channelFilter) url.searchParams.set('channel', channelFilter);
      url.searchParams.set('status', 'scheduled');
      
      const res = await fetch(url);
      const { streams: data } = await res.json();
      setStreams(data || []);
    } catch (err) {
      console.error('Failed to fetch streams:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeUntil = (isoString: string) => {
    const now = new Date().getTime();
    const streamTime = new Date(isoString).getTime();
    const diff = streamTime - now;
    
    if (diff < 0) return 'Starting now...';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) return `${Math.floor(hours / 24)} days`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4">
        <div className="text-xs text-neutral-500 text-center">Loading schedule...</div>
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4">
        <div className="text-[10px] font-black tracking-widest text-neutral-500 uppercase mb-2">📅 UPCOMING STREAMS</div>
        <div className="text-xs text-neutral-500 text-center py-2">No upcoming streams scheduled</div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-950 border border-neutral-900 rounded-xl overflow-hidden">
      <div className="p-3 border-b border-neutral-900">
        <div className="text-[10px] font-black tracking-widest text-[#D4AF37] uppercase">📅 UPCOMING STREAMS</div>
      </div>
      <div className="divide-y divide-neutral-900">
        {streams.map((stream) => (
          <div key={stream.id} className="p-3 flex items-center justify-between hover:bg-neutral-900/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[9px] font-black tracking-widest text-neutral-500 uppercase">{stream.channel}</span>
                <span className="text-xs font-bold text-white">{stream.title}</span>
                <span className="text-[10px] text-neutral-500">{stream.profiles?.display_name || 'DJ'}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-black text-[#D4AF37]">{getTimeUntil(stream.scheduled_at)}</div>
              <div className="text-[10px] text-neutral-500">{formatTime(stream.scheduled_at)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
