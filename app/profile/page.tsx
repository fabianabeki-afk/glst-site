'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProfilePage() {
 const [session, setSession] = useState<any>(null);
 const [profile, setProfile] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [darkMode, setDarkMode] = useState(true);
 
 // Profile form state
 const [displayName, setDisplayName] = useState('');
 const [bio, setBio] = useState('');
 const [genres, setGenres] = useState<string[]>([]);
 const [genreInput, setGenreInput] = useState('');
 const [avatarUrl, setAvatarUrl] = useState('');
 const [socialLinks, setSocialLinks] = useState({
   instagram: '',
   twitter: '',
   soundcloud: '',
   mixcloud: ''
 });

 useEffect(() => {
   supabase.auth.getSession().then(({ data: { session } }) => {
     setSession(session);
     if (session?.user) {
       loadProfile(session.user.id);
     } else {
       setLoading(false);
     }
   });
 }, []);

 const loadProfile = async (userId: string) => {
   try {
     const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
     if (data) {
       setProfile(data);
       setDisplayName(data.display_name || '');
       setBio(data.bio || '');
       setGenres(data.genres || []);
       setAvatarUrl(data.avatar_url || '');
       setSocialLinks(data.social_links || { instagram: '', twitter: '', soundcloud: '', mixcloud: '' });
     }
   } catch (err) {
     console.error('Error loading profile:', err);
   } finally {
     setLoading(false);
   }
 };

 const handleSave = async () => {
   if (!session?.user) return;
   
   setSaving(true);
   try {
     // Use the API route instead of direct Supabase to bypass RLS
     const res = await fetch('/api/dj-profile', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         userId: session.user.id,
         display_name: displayName,
         bio: bio,
         genres: genres,
         avatar_url: avatarUrl,
         social_links: socialLinks,
       }),
     });
     
     if (!res.ok) {
       const errorData = await res.json();
       throw new Error(errorData.error || 'Failed to save');
     }
     
     alert('Profile saved successfully!');
   } catch (err: any) {
     alert('Error saving profile: ' + err.message);
   } finally {
     setSaving(false);
   }
 };

 const addGenre = () => {
   if (!genreInput.trim()) return;
   if (!genres.includes(genreInput.trim())) {
     setGenres([...genres, genreInput.trim()]);
   }
   setGenreInput('');
 };

 const removeGenre = (genre: string) => {
   setGenres(genres.filter((g) => g !== genre));
 };

 const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
   const file = e.target.files?.[0];
   if (!file || !session?.user) {
     alert('No file selected or not logged in');
     return;
   }

   console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);

   try {
     const formData = new FormData();
     formData.append('file', file);
     formData.append('userId', session.user.id);

     const res = await fetch('/api/upload-avatar', {
       method: 'POST',
       body: formData,
     });

     console.log('Upload response status:', res.status);
     const data = await res.json();
     console.log('Upload response:', data);

     if (!res.ok) {
       throw new Error(data.error || data.details || `HTTP ${res.status}`);
     }
     
     if (data.url) {
       setAvatarUrl(data.url);
       alert('Avatar uploaded successfully!');
     } else {
       throw new Error('No URL returned');
     }
   } catch (err: any) {
     console.error('Upload error:', err);
     alert('Upload failed: ' + err.message);
   }
 };

 if (loading) {
   return (
     <div className={`min-h-screen ${darkMode ? 'bg-black text-white' : 'bg-white text-black'} font-mono flex items-center justify-center`}>
       <div className="text-center">
         <Image src="/the_guestlint_web.svg" alt="Guestlist" width={200} height={50} className="mb-4 mx-auto" />
         <p className="text-sm tracking-widest text-[#D4AF37]">LOADING PROFILE...</p>
       </div>
     </div>
   );
 }

 if (!session) {
   return (
     <div className={`min-h-screen ${darkMode ? 'bg-black text-white' : 'bg-white text-black'} font-mono flex items-center justify-center`}>
       <div className="text-center space-y-4">
         <Image src="/the_guestlint_web.svg" alt="Guestlist" width={200} height={50} className="mb-4 mx-auto" />
         <p className="text-neutral-400">Please sign in to view your profile</p>
         <Link href="/" className="px-4 py-2 bg-[#D4AF37] text-black text-xs font-black tracking-widest rounded-lg inline-block">
           GO TO HOMEPAGE
         </Link>
       </div>
     </div>
   );
 }

 return (
   <div className={`min-h-screen ${darkMode ? 'bg-black text-white' : 'bg-white text-black'} font-mono`}>
     {/* Header */}
     <header className={`fixed top-0 left-0 right-0 z-50 ${darkMode ? 'bg-black border-neutral-800' : 'bg-white border-neutral-200'} border-b`}>
       <div className="max-w-[900px] mx-auto px-4 h-16 flex items-center justify-between">
         <div className="flex items-center gap-3">
           <Link href="/">
             <Image src="/G_logo.png" alt="Guestlist" width={40} height={40} className="rounded mt-2" />
           </Link>
           <Image src="/the_guestlint_web.svg" alt="Guestlist.tv" width={200} height={50} className="hidden md:block" />
         </div>
         <div className="flex items-center gap-2">
           <Link href="/" className="px-4 py-2 text-xs font-black tracking-widest rounded-lg text-neutral-400 hover:text-white transition-colors">
             BACK TO LIVE
           </Link>
           <button
             onClick={() => setDarkMode(!darkMode)}
             className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 transition-colors"
           >
             {darkMode ? '☀️' : '🌙'}
           </button>
         </div>
       </div>
     </header>

     <div className="pt-16 max-w-[900px] mx-auto px-4 py-8">
       <div className="flex items-center gap-4 mb-8">
         <div className="relative w-24 h-24 rounded-full overflow-hidden bg-neutral-900 border-2 border-[#D4AF37]">
           {avatarUrl ? (
             <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
           ) : (
             <div className="w-full h-full flex items-center justify-center text-neutral-600 text-2xl font-black">
               {displayName?.slice(0, 2)?.toUpperCase() || 'DJ'}
             </div>
           )}
         </div>
         <div>
           <h1 className="text-2xl font-black">Edit Profile</h1>
           <p className="text-sm text-neutral-400">{session.user.email}</p>
         </div>
       </div>

       <div className={`${darkMode ? 'bg-neutral-950 border-neutral-900' : 'bg-neutral-100 border-neutral-200'} border rounded-xl p-6 space-y-6`}>
         {/* Avatar Upload */}
         <div>
           <label className="text-xs font-bold tracking-widest text-neutral-500 mb-2 block">AVATAR</label>
           <input
             type="file"
             accept="image/*"
             onChange={handleAvatarUpload}
             className="text-xs text-neutral-400"
           />
         </div>

         {/* Display Name */}
         <div>
           <label className="text-xs font-bold tracking-widest text-neutral-500 mb-2 block">DISPLAY NAME</label>
           <input
             type="text"
             value={displayName}
             onChange={(e) => setDisplayName(e.target.value)}
             placeholder="DJ Fabian"
             className={`w-full border border-neutral-800 rounded-lg p-3 text-sm outline-none focus:border-[#D4AF37] transition-colors ${darkMode ? 'bg-black text-white' : 'bg-white text-black'}`}
           />
         </div>

         {/* Bio */}
         <div>
           <label className="text-xs font-bold tracking-widest text-neutral-500 mb-2 block">BIO</label>
           <textarea
             value={bio}
             onChange={(e) => setBio(e.target.value)}
             placeholder="Tell fans about your sound..."
             rows={4}
             className={`w-full border border-neutral-800 rounded-lg p-3 text-sm outline-none focus:border-[#D4AF37] transition-colors resize-none ${darkMode ? 'bg-black text-white' : 'bg-white text-black'}`}
           />
         </div>

         {/* Genres */}
         <div>
           <label className="text-xs font-bold tracking-widest text-neutral-500 mb-2 block">GENRES</label>
           <div className="flex gap-2 mb-2">
             <input
               type="text"
               value={genreInput}
               onChange={(e) => setGenreInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && addGenre()}
               placeholder="e.g. Dubstep"
               className={`flex-1 border border-neutral-800 rounded-lg p-2 text-sm outline-none focus:border-[#D4AF37] transition-colors ${darkMode ? 'bg-black text-white' : 'bg-white text-black'}`}
             />
             <button
               onClick={addGenre}
               className="px-4 py-2 bg-neutral-800 text-white text-xs font-black rounded-lg hover:bg-neutral-700 transition-colors"
             >
               +
             </button>
           </div>
           <div className="flex flex-wrap gap-2">
             {genres.map((genre) => (
               <span
                 key={genre}
                 className="inline-flex items-center gap-1 px-3 py-1 bg-neutral-800 border border-neutral-700 rounded-full text-xs text-neutral-300"
               >
                 {genre}
                 <button onClick={() => removeGenre(genre)} className="text-neutral-500 hover:text-red-400">×</button>
               </span>
             ))}
           </div>
         </div>

         {/* Social Links */}
         <div>
           <label className="text-xs font-bold tracking-widest text-neutral-500 mb-2 block">SOCIAL LINKS</label>
           <div className="grid grid-cols-2 gap-3">
             <input
               type="text"
               value={socialLinks.instagram}
               onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
               placeholder="Instagram"
               className={`w-full border border-neutral-800 rounded-lg p-2 text-sm outline-none focus:border-[#D4AF37] transition-colors ${darkMode ? 'bg-black text-white' : 'bg-white text-black'}`}
             />
             <input
               type="text"
               value={socialLinks.twitter}
               onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
               placeholder="Twitter"
               className={`w-full border border-neutral-800 rounded-lg p-2 text-sm outline-none focus:border-[#D4AF37] transition-colors ${darkMode ? 'bg-black text-white' : 'bg-white text-black'}`}
             />
             <input
               type="text"
               value={socialLinks.soundcloud}
               onChange={(e) => setSocialLinks({ ...socialLinks, soundcloud: e.target.value })}
               placeholder="SoundCloud"
               className={`w-full border border-neutral-800 rounded-lg p-2 text-sm outline-none focus:border-[#D4AF37] transition-colors ${darkMode ? 'bg-black text-white' : 'bg-white text-black'}`}
             />
             <input
               type="text"
               value={socialLinks.mixcloud}
               onChange={(e) => setSocialLinks({ ...socialLinks, mixcloud: e.target.value })}
               placeholder="Mixcloud"
               className={`w-full border border-neutral-800 rounded-lg p-2 text-sm outline-none focus:border-[#D4AF37] transition-colors ${darkMode ? 'bg-black text-white' : 'bg-white text-black'}`}
             />
           </div>
         </div>

         {/* Save Button */}
         <button
           onClick={handleSave}
           disabled={saving}
           className="w-full bg-[#D4AF37] hover:bg-[#AA8417] text-black text-sm font-black tracking-widest py-3 rounded-lg transition-colors disabled:opacity-50"
         >
           {saving ? 'SAVING...' : 'SAVE PROFILE'}
         </button>
       </div>
     </div>
   </div>
 );
}