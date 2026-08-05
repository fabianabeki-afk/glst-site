'use client';

import { useState } from 'react';

interface StreamSchedulerProps {
  djId: string;
  onSchedule?: () => void;
}

export default function StreamScheduler({ djId, onSchedule }: StreamSchedulerProps) {
  const [channel, setChannel] = useState('MAINROOM');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [loading, setLoading] = useState(false);

  const channels = [
    { id: 'MAINROOM', label: 'MAINROOM' },
    { id: 'BASEMENT', label: 'BASEMENT' },
    { id: 'LOUNGE', label: 'LOUNGE' },
    { id: 'THE LAB', label: 'THE LAB' },
    { id: 'THE PUB', label: 'THE PUB' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !scheduledDate || !scheduledTime) return;

    setLoading(true);
    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      
      const res = await fetch('/api/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          djId,
          channel,
          title,
          description,
          scheduledAt,
        }),
      });

      if (!res.ok) throw new Error('Failed to schedule stream');
      
      setTitle('');
      setDescription('');
      setScheduledDate('');
      setScheduledTime('');
      onSchedule?.();
      alert('Stream scheduled!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-5 space-y-4">
      <div className="flex justify-between items-center border-b border-neutral-900 pb-2">
        <h3 className="text-[10px] font-black tracking-widest text-[#D4AF37] uppercase">📅 SCHEDULE STREAM</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">Channel</label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-[#D4AF37]"
          >
            {channels.map((ch) => (
              <option key={ch.id} value={ch.id}>{ch.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Friday Night Bass Session"
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-[#D4AF37]"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What are you planning to play?"
            rows={2}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-[#D4AF37] resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">Date</label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-[#D4AF37]"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">Time</label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-[#D4AF37]"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#D4AF37] hover:bg-[#AA8417] text-black text-xs font-black tracking-widest py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'SCHEDULING...' : 'SCHEDULE STREAM'}
        </button>
      </form>
    </div>
  );
}
