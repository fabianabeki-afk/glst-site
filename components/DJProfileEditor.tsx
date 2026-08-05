'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface DJProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  genres: string[];
  avatar_url: string;
  social_links: {
    instagram?: string;
    twitter?: string;
    soundcloud?: string;
    mixcloud?: string;
  };
  payout_method: string;
  paypal_email: string;
}

interface DJProfileEditorProps {
  userId: string;
  onSave?: (profile: DJProfile) => void;
}

export default function DJProfileEditor({ userId, onSave }: DJProfileEditorProps) {
  const [profile, setProfile] = useState<Partial<DJProfile>>({
    display_name: '',
    bio: '',
    genres: [],
    avatar_url: '',
    social_links: {},
    payout_method: 'stripe',
    paypal_email: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [genreInput, setGenreInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dj-profile?userId=${userId}`);
      if (!res.ok) throw new Error('Failed to load profile');
      const data = await res.json();
      if (data.profile) setProfile(data.profile);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/dj-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...profile }),
      });
      if (!res.ok) throw new Error('Failed to save profile');
      const data = await res.json();
      if (data.profile) {
        onSave?.(data.profile);
        alert('Profile saved!');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addGenre = () => {
    if (!genreInput.trim()) return;
    if (!profile.genres?.includes(genreInput.trim())) {
      setProfile({ ...profile, genres: [...(profile.genres || []), genreInput.trim()] });
    }
    setGenreInput('');
  };

  const removeGenre = (genre: string) => {
    setProfile({ ...profile, genres: profile.genres?.filter((g) => g !== genre) || [] });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const res = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to upload image');
      const data = await res.json();
      setProfile({ ...profile, avatar_url: data.url });
    } catch (err: any) {
      alert('Failed to upload image: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return <div className="text-xs text-neutral-500 text-center py-4">Loading profile...</div>;
  }

  return (
    <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-5 space-y-4">
      <div className="flex justify-between items-center border-b border-neutral-900 pb-2">
        <h3 className="text-[10px] font-black tracking-widest text-[#D4AF37] uppercase">✏️ EDIT DJ PROFILE</h3>
      </div>

      <div className="space-y-4">
        {/* Avatar Upload */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-neutral-900 border-2 border-neutral-800">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt="DJ Avatar"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-600 text-2xl font-black">
                {profile.display_name?.slice(0, 2)?.toUpperCase() || 'DJ'}
              </div>
            )}
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <span className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-black tracking-widest rounded-lg transition-colors">
              {uploadingImage ? 'UPLOADING...' : 'UPLOAD AVATAR'}
            </span>
          </label>
        </div>

        {/* Display Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">Display Name</label>
          <input
            type="text"
            value={profile.display_name || ''}
            onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
            placeholder="DJ Fabian"
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-[#D4AF37]"
          />
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">Bio</label>
          <textarea
            value={profile.bio || ''}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            placeholder="Tell fans about your sound..."
            rows={3}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-[#D4AF37] resize-none"
          />
        </div>

        {/* Genres */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">Genres</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={genreInput}
              onChange={(e) => setGenreInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addGenre()}
              placeholder="e.g. Dubstep"
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-[#D4AF37]"
            />
            <button
              onClick={addGenre}
              className="px-3 py-2 bg-neutral-800 text-white text-xs font-black rounded-lg hover:bg-neutral-700 transition-colors"
            >
              +
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {profile.genres?.map((genre) => (
              <span
                key={genre}
                className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-[10px] text-neutral-300"
              >
                {genre}
                <button onClick={() => removeGenre(genre)} className="text-neutral-500 hover:text-red-400">×</button>
              </span>
            ))}
          </div>
        </div>

        {/* Social Links */}
        <div className="space-y-2">
          <label className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">Social Links</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={profile.social_links?.instagram || ''}
              onChange={(e) => setProfile({ ...profile, social_links: { ...profile.social_links, instagram: e.target.value } })}
              placeholder="Instagram URL"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-[#D4AF37]"
            />
            <input
              type="text"
              value={profile.social_links?.twitter || ''}
              onChange={(e) => setProfile({ ...profile, social_links: { ...profile.social_links, twitter: e.target.value } })}
              placeholder="Twitter URL"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-[#D4AF37]"
            />
            <input
              type="text"
              value={profile.social_links?.soundcloud || ''}
              onChange={(e) => setProfile({ ...profile, social_links: { ...profile.social_links, soundcloud: e.target.value } })}
              placeholder="SoundCloud URL"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-[#D4AF37]"
            />
            <input
              type="text"
              value={profile.social_links?.mixcloud || ''}
              onChange={(e) => setProfile({ ...profile, social_links: { ...profile.social_links, mixcloud: e.target.value } })}
              placeholder="Mixcloud URL"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>

        {/* Payout */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">Payout Method</label>
          <select
            value={profile.payout_method || 'stripe'}
            onChange={(e) => setProfile({ ...profile, payout_method: e.target.value })}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-[#D4AF37]"
          >
            <option value="stripe">Stripe Connect</option>
            <option value="paypal">PayPal</option>
            <option value="manual">Manual (Bank Transfer)</option>
          </select>
        </div>

        {profile.payout_method === 'paypal' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">PayPal Email</label>
            <input
              type="email"
              value={profile.paypal_email || ''}
              onChange={(e) => setProfile({ ...profile, paypal_email: e.target.value })}
              placeholder="your@email.com"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-[#D4AF37]"
            />
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#D4AF37] hover:bg-[#AA8417] text-black text-xs font-black tracking-widest py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? 'SAVING...' : 'SAVE PROFILE'}
        </button>
      </div>
    </div>
  );
}
