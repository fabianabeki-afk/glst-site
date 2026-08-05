'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function SubmitMusicPage() {
  const [artistName, setArtistName] = useState('');
  const [trackTitle, setTrackTitle] = useState('');
  const [genre, setGenre] = useState('BASEMENT');
  const [email, setEmail] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !artistName || !trackTitle || !email) {
      alert('Please fill in all fields and select an audio file.');
      return;
    }

    setSubmitting(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('submissions')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('music_submissions').insert({
        artist_name: artistName,
        track_title: trackTitle,
        genre,
        email,
        audio_url: publicUrlData.publicUrl,
      });

      if (dbError) throw dbError;

      setSuccess(true);
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono p-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-neutral-950 border border-neutral-900 p-8 rounded-2xl space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-lg font-black tracking-widest text-[#D4AF37] uppercase">GUESTLIST SUBMISSIONS</h1>
          <p className="text-xs text-neutral-400">Submit your unreleased dubplates & tracks for live broadcast rotation.</p>
        </div>

        {success ? (
          <div className="p-4 bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs rounded-xl text-center space-y-2">
            <p className="font-bold">✨ Track Submitted Successfully!</p>
            <p className="text-[10px] text-neutral-400">Our curation team will review your upload for live broadcast clearance.</p>
            <button onClick={() => { setSuccess(false); setFile(null); }} className="mt-4 px-4 py-2 bg-emerald-600 text-white font-black text-[10px] rounded-lg">Submit Another</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-neutral-500">Artist / Producer Name</label>
              <input type="text" value={artistName} onChange={(e) => setArtistName(e.target.value)} required className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-xs text-white outline-none focus:border-[#D4AF37]" placeholder="e.g. DJ Dubz" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-neutral-500">Track Title</label>
              <input type="text" value={trackTitle} onChange={(e) => setTrackTitle(e.target.value)} required className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-xs text-white outline-none focus:border-[#D4AF37]" placeholder="e.g. Heavyweight VIP" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-neutral-500">Genre / Channel</label>
              <select value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-xs text-white outline-none focus:border-[#D4AF37]">
                <option value="BASEMENT">BASEMENT (UKG / DnB)</option>
                <option value="MAINROOM">MAINROOM (House & Tech)</option>
                <option value="LOUNGE">LOUNGE (RnB / Afro)</option>
                <option value="THE LAB">THE LAB (Leftfield)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-neutral-500">Contact Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-xs text-white outline-none focus:border-[#D4AF37]" placeholder="artist@example.com" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-neutral-500">Audio File (WAV / MP3)</label>
              <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] || null)} required className="w-full text-xs text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-[#D4AF37] file:text-black hover:file:bg-[#AA8417] cursor-pointer" />
            </div>
            <div className="text-[9px] text-neutral-500 leading-relaxed pt-1">
              By submitting, you certify that you own the rights to this track and grant Guestlist a non-ensure license to broadcast it live.
            </div>
            <button type="submit" disabled={submitting} className="w-full bg-[#D4AF37] text-black font-black text-xs tracking-widest py-3 rounded-lg hover:bg-[#AA8417] transition-colors disabled:opacity-50">
              {submitting ? 'UPLOADING...' : 'SUBMIT TRACK'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}