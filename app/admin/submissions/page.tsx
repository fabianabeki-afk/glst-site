'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    const { data } = await supabase
      .from('music_submissions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (data) setSubmissions(data);
    setLoading(false);
  };

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('music_submissions')
      .update({ status })
      .eq('id', id);

    if (!error) {
      setSubmissions((prev) => prev.filter((item) => item.id !== id));
    } else {
      alert(`Error updating status: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
          <div>
            <h1 className="text-sm font-black tracking-widest text-[#D4AF37] uppercase">ADMIN: MUSIC SUBMISSIONS QUEUE</h1>
            <p className="text-xs text-neutral-400 mt-1">Approve underground tracks to add them to your broadcast whitelist catalog.</p>
          </div>
          <span className="px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-bold text-[#D4AF37]">{submissions.length} Pending</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-neutral-500">LOADING SUBMISSIONS...</div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12 bg-neutral-950 border border-neutral-900 rounded-xl text-xs text-neutral-500">No pending submissions in the queue.</div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <div key={sub.id} className="bg-neutral-950 border border-neutral-900 p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{sub.track_title}</span>
                    <span className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-[9px] text-[#D4AF37] uppercase">{sub.genre}</span>
                  </div>
                  <p className="text-xs text-neutral-400">Artist: <span className="text-white font-bold">{sub.artist_name}</span> ({sub.email})</p>
                  <audio controls src={sub.audio_url} className="mt-2 h-8 w-full sm:w-72 accent-[#D4AF37]" />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button onClick={() => handleAction(sub.id, 'approved')} className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] rounded-lg transition-colors">
                    ✓ APPROVE
                  </button>
                  <button onClick={() => handleAction(sub.id, 'rejected')} className="flex-1 sm:flex-none px-4 py-2 bg-rose-950 border border-rose-800 text-rose-400 hover:bg-rose-900 font-black text-[10px] rounded-lg transition-colors">
                    ✕ REJECT
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}