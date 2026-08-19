'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import TipButton from '@/components/TipButton';
import UpcomingStreams from '@/components/UpcomingStreams';
import { useGuestlistCamera } from '@/hooks/useGuestlistCamera';
import { EcosystemHeroBanner } from '@/components/EcosystemHeroBanner';
import LiveKitPlayer from '@/components/LiveKitPlayer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default function GuestlistHomepage() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [darkMode, setDarkMode] = useState(true);

  const toggleTheme = () => setDarkMode(!darkMode);

  // Active stream state that changes when clicking DJ story circles
  const [activeStream, setActiveStream] = useState({
    djName: 'DJ Fabian',
    eventName: 'Friday Night Live',
    livekitUrl: 'wss://guestlist-tv-ei1a8q8r.livekit.cloud',
    livekitRoom: 'fabiandubz-stream',
    isLive: true,
  });
  
  const [livekitToken, setLivekitToken] = useState<string>('');

  const [hapticMetrics, setHapticMetrics] = useState({
    bassResonance: 94,
    crowdMovement: 88,
    bountyVelocity: 76,
    globalHeatIndex: 91.2,
  });

  const {
    videoDevices,
    audioDevices,
    selectedVideoId,
    setSelectedVideoId,
    selectedAudioId,
    setSelectedAudioId,
    activeStream: cameraStream,
    isCapturing,
    isLiveStream,
    audioLevel,
    inputGain,
    changeGain,
    error: cameraError,
    startCapture,
    stopCapture,
    toggleGoLive,
  } = useGuestlistCamera();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [forceDJMode, setForceDJMode] = useState(false);
  const [showStreamSettings, setShowStreamSettings] = useState(false);
  const [isInitializingBroadcast, setIsInitializingBroadcast] = useState(false);
  const [broadcastDuration, setBroadcastDuration] = useState(0);
  const broadcastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [streamOrientation, setStreamOrientation] = useState<'landscape' | 'portrait' | 'unknown'>('unknown');
  const orientationSet = useRef(false);

  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [userRating, setUserRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Expanded DJ network list (12 items matching broadcast window width)
  const djStories = [
    { name: 'DJ1', artist: 'Fabian Dubz', room: 'MAINROOM', live: true },
    { name: 'DJ2', artist: 'Sub Focus', room: 'BASEMENT', live: true },
    { name: 'DJ3', artist: 'Skream', room: 'LOUNGE', live: true },
    { name: 'DJ4', artist: 'Benga', room: 'THE LAB', live: true },
    { name: 'DJ5', artist: 'Artwork', room: 'MAINROOM', live: true },
    { name: 'DJ6', artist: 'Pangaea', room: 'BASEMENT', live: true },
    { name: 'DJ7', artist: 'Pearson Sound', room: 'LOUNGE', live: true },
    { name: 'DJ8', artist: 'Hessle Audio', room: 'THE LAB', live: false },
    { name: 'DJ9', artist: 'Kode9', room: 'MAINROOM', live: false },
    { name: 'DJ10', artist: 'Loefah', room: 'BASEMENT', live: false },
    { name: 'DJ11', artist: 'Mala', room: 'LOUNGE', live: false },
    { name: 'DJ12', artist: 'Coki', room: 'THE LAB', live: false },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeStream.isLive) {
      fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: activeStream.livekitRoom,
          identity: `viewer-${Date.now()}`,
          role: 'viewer'
        })
      })
      .then(res => res.json())
      .then(data => {
        const rawToken = data?.token;
        const finalToken = typeof rawToken === 'string' 
          ? rawToken 
          : rawToken?.accessToken || rawToken?.token || data?.accessToken || (typeof data === 'string' ? data : null);

        if (finalToken && typeof finalToken === 'string') {
          setLivekitToken(finalToken);
        }
      })
      .catch(err => console.error('Failed to get viewer token:', err));
    }
  }, [activeStream.isLive]);

  const isAdmin = session?.user?.email === 'fabiandubz@gmail.com';
  const getInitials = (email: string) => email?.split('@')[0]?.slice(0, 2)?.toUpperCase() || 'DJ';

  const [activeChannel, setActiveChannel] = useState('BASEMENT');
  const [previewAsFan, setPreviewAsFan] = useState(false);
  
  // Channels updated with asset references 1.png through 4.png
  const channels = [
    { id: 'MAINROOM', label: 'MAINROOM', sub: 'House & Tech', image: '/1.png' },
    { id: 'BASEMENT', label: 'BASEMENT', sub: 'UKG/DnB', image: '/2.png' },
    { id: 'LOUNGE', label: 'LOUNGE', sub: 'RnB/Afro', image: '/3.png' },
    { id: 'THE LAB', label: 'THE LAB', sub: 'Leftfield', image: '/4.png' },
  ];

  const isDJ = forceDJMode || profile?.tier === 'vanguard' || profile?.tier === 'dj';

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  useEffect(() => {
    if (!session?.user) return;
    const fetchMessages = async () => {
      if (!supabase) return;
      const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(100);
      if (data) setChatMessages(data);
    };
    fetchMessages();

    if (!supabase) return;
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setChatMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) loadProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) loadProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user && showAuthModal) {
      setShowAuthModal(false);
      setAuthError('');
    }
  }, [session, showAuthModal]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHapticMetrics((prev) => {
        const deltaBass = (Math.random() - 0.5) * 4;
        const deltaMove = (Math.random() - 0.5) * 3;
        const nextBass = Math.min(Math.max(Math.round(prev.bassResonance + deltaBass), 80), 100);
        const nextMove = Math.min(Math.max(Math.round(prev.crowdMovement + deltaMove), 75), 98);
        const nextIndex = parseFloat(((nextBass * 0.4) + (nextMove * 0.4) + (prev.bountyVelocity * 0.2)).toFixed(1));
        return { ...prev, bassResonance: nextBass, crowdMovement: nextMove, globalHeatIndex: nextIndex };
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isLiveStream) {
      setBroadcastDuration(0);
      broadcastTimerRef.current = setInterval(() => setBroadcastDuration((prev) => prev + 1), 1000);
    } else {
      if (broadcastTimerRef.current) {
        clearInterval(broadcastTimerRef.current);
        broadcastTimerRef.current = null;
      }
      setBroadcastDuration(0);
    }
    return () => { if (broadcastTimerRef.current) clearInterval(broadcastTimerRef.current); };
  }, [isLiveStream]);

  const loadProfile = async (userId: string) => {
    if (!supabase) {
      setProfile({ tier: 'supporter' });
      setLoading(false);
      return;
    }
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      setProfile(data || { tier: 'supporter' });
    } catch {
      setProfile({ tier: 'supporter' });
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!supabase) {
      setAuthError('Auth service unavailable');
      return;
    }
    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Account created! Check your email.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !session?.user || !supabase) return;
    const { error } = await supabase.from('messages').insert({
      content: chatInput.trim(),
      user_id: session.user.id,
      user_email: session.user.email,
    });
    if (!error) setChatInput('');
  };

  const handleGoLive = async () => {
    if (isLiveStream) {
      await toggleGoLive();
      return;
    }
    if (!isCapturing) {
      alert('Start camera first!');
      return;
    }
    setIsInitializingBroadcast(true);
    try {
      await toggleGoLive();
    } catch (err: any) {
      alert(`Broadcast Error: ${err.message}`);
    } finally {
      setIsInitializingBroadcast(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-black text-white' : 'bg-white text-black'} flex items-center justify-center`}>
        <div className="text-center">
          <Image src="/the_guestlint_web.svg" alt="Guestlist" width={300} height={80} className="mb-4" />
          <p className="text-sm tracking-widest text-[#D4AF37]">LOADING...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-black text-white' : 'bg-white text-black'} font-mono pb-12`}>
      {/* Sub-Header User Bar */}
      <div className={`border-b ${darkMode ? 'border-neutral-900 bg-neutral-950/55' : 'border-neutral-200 bg-neutral-50'} px-6 py-2`}>
        <div className="max-w-[900px] mx-auto flex items-center justify-end gap-3">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? (
              <svg className="w-4 h-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {session ? (
            <div className="flex items-center gap-2 relative" ref={userMenuRef}>
              {isAdmin && (
                <a href="/admin" className="px-3 py-1 text-[10px] font-black tracking-widest rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-colors">ADMIN</a>
              )}
              <button
                onClick={() => { setForceDJMode(!forceDJMode); setShowStreamSettings(false); }}
                className={`px-3 py-1 text-[10px] font-black tracking-widest rounded-lg border transition-colors ${
                  forceDJMode ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-neutral-900 text-neutral-400 border-neutral-700 hover:text-white'
                }`}
              >
                {forceDJMode ? 'DJ ON' : 'DJ MODE'}
              </button>
              {isDJ && (
                <button
                  onClick={() => setPreviewAsFan(!previewAsFan)}
                  className={`px-3 py-1 text-[10px] font-black tracking-widest rounded-lg border transition-colors ${
                    previewAsFan ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-neutral-900 text-neutral-400 border-neutral-700 hover:text-white'
                  }`}
                >
                  {previewAsFan ? '👁 PREVIEWING' : '👁 PREVIEW'}
                </button>
              )}
              {isDJ && <span className="px-2 py-0.5 text-[10px] font-black bg-[#D4AF37] text-black rounded tracking-wider">DJ</span>}
              
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <div className="w-6 h-6 bg-[#D4AF37] rounded-full flex items-center justify-center text-[10px] font-black text-black">
                  {getInitials(session.user.email || '')}
                </div>
                <span className="text-[10px] text-neutral-300 hidden sm:block">{session.user.email?.split('@')[0]}</span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl overflow-hidden z-50">
                  <div className="px-3 py-2 border-b border-neutral-800">
                    <p className="text-xs text-neutral-400 truncate">{session.user.email}</p>
                  </div>
                  <a href="/profile" className="w-full text-left px-3 py-2 text-xs text-white hover:bg-neutral-800 transition-colors block">Edit Profile</a>
                  <button onClick={() => { setShowStreamSettings(true); setShowUserMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-white hover:bg-neutral-800 transition-colors block">Account Settings</button>
                  <div className="border-t border-neutral-800">
                    <button onClick={handleSignOut} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-neutral-800 transition-colors">Sign Out</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => { setShowAuthModal(true); setAuthMode('signin'); }} className="px-4 py-1.5 bg-[#D4AF37] hover:bg-[#AA8417] text-black text-xs font-black tracking-widest rounded-lg transition-colors">SIGN IN</button>
          )}
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-4 pt-6">
        <EcosystemHeroBanner />
      </div>

      <div className="max-w-[900px] mx-auto px-4 py-6 space-y-6">
        
        {/* LIVE BROADCAST DJ'S (Expanded to fill broadcast window width with interactive switching) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black tracking-widest text-neutral-400 uppercase">LIVE BROADCAST DJ'S</span>
            <span className="text-[9px] text-[#D4AF37]">FOLLOWED NETWORK</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {djStories.map((dj, idx) => (
              <div 
                key={idx} 
                onClick={() => {
                  setActiveStream({
                    djName: dj.artist,
                    eventName: `${dj.room} Broadcast`,
                    livekitUrl: 'wss://guestlist-tv-ei1a8q8r.livekit.cloud',
                    livekitRoom: `${dj.name.toLowerCase()}-stream`,
                    isLive: dj.live,
                  });
                  setActiveChannel(dj.room);
                }}
                className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0 group"
              >
                <div className={`w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr ${dj.live ? 'from-red-500 via-[#D4AF37] to-amber-400' : 'from-neutral-700 to-neutral-800'} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                  <div className="w-full h-full rounded-full bg-neutral-900 flex items-center justify-center text-[11px] font-black text-white border border-black">
                    {dj.name}
                  </div>
                </div>
                <span className="text-[9px] text-neutral-300 font-mono tracking-tight truncate max-w-[56px] text-center">{dj.artist}</span>
              </div>
            ))}
          </div>
        </div>

        {/* LIVE HEADER STATUS */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-black tracking-widest text-red-500 uppercase">LIVE GUEST</span>
            <span className="text-sm text-neutral-400">{activeStream.djName} — {activeStream.eventName}</span>
          </div>
          <div className="text-xs font-bold tracking-widest text-neutral-500">142 VIEWERS</div>
        </div>

        {/* STREAM CONTROLS FOR DJ */}
        {isDJ && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStreamSettings(!showStreamSettings)}
              className={`px-3 py-1.5 text-[10px] font-black tracking-widest rounded-lg border transition-colors ${
                showStreamSettings ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-neutral-900 text-neutral-400 border-neutral-700 hover:text-white'
              }`}
            >
              {showStreamSettings ? '✓ SETTINGS OPEN' : '⚙️ STREAM SETTINGS'}
            </button>
            {!isCapturing ? (
              <button
                onClick={() => startCapture()}
                className="px-3 py-1.5 text-[10px] font-black tracking-widest rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
              >
                📷 START CAMERA
              </button>
            ) : (
              <button
                onClick={stopCapture}
                className="px-3 py-1.5 text-[10px] font-black tracking-widest rounded-lg bg-rose-950 border border-rose-800 text-rose-400 hover:bg-rose-900 transition-colors"
              >
                ⏹ STOP CAMERA
              </button>
            )}
            {isLiveStream && (
              <span className="px-2 py-1 text-[10px] font-black bg-red-600 text-white rounded animate-pulse">🔴 LIVE</span>
            )}
          </div>
        )}

        {/* STREAM SETTINGS DRAWER */}
        {isDJ && showStreamSettings && (
          <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-900 pb-2">
              <h3 className="text-[10px] font-black tracking-widest text-[#D4AF37] uppercase">Stream Configuration</h3>
              <button onClick={() => setShowStreamSettings(false)} className="text-neutral-500 hover:text-white text-lg">×</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">Video Source</label>
                <select
                  value={selectedVideoId}
                  onChange={(e) => setSelectedVideoId(e.target.value)}
                  disabled={isCapturing}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-[10px] text-white outline-none focus:border-[#D4AF37] disabled:opacity-50"
                >
                  {videoDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>{device.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">Audio Source</label>
                <select
                  value={selectedAudioId}
                  onChange={(e) => setSelectedAudioId(e.target.value)}
                  disabled={isCapturing}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-[10px] text-white outline-none focus:border-[#D4AF37] disabled:opacity-50"
                >
                  {audioDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>{device.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* BROADCAST PLAYER CONTAINER - Single stable container */}
        <div className="bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl mx-auto flex relative" style={{ maxHeight: '70vh', maxWidth: '900px' }}>
          {/* LEFT OVERLAY - DJ Avatar/Info (hidden on landscape) */}
          <div className={`w-48 bg-neutral-950 border-r border-neutral-800 flex flex-col items-center justify-center p-4 space-y-3 transition-all duration-500 ${streamOrientation === 'portrait' ? 'sm:flex' : 'hidden'}`}>
            <div className="w-20 h-20 bg-gradient-to-br from-[#D4AF37] to-orange-600 rounded-full flex items-center justify-center text-3xl shadow-md">🎧</div>
            <div className="text-center">
              <p className="text-xs font-bold text-white">{activeStream.djName}</p>
              <p className="text-[10px] text-neutral-400 mt-1">Dubstep • Garage</p>
            </div>
            <div className="w-full bg-neutral-900 rounded-lg p-2">
              <p className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold mb-1">Now Playing</p>
              <p className="text-[10px] text-[#D4AF37]">Unknown Track</p>
            </div>
          </div>

          {/* CENTER - Video (always mounted, CSS adjusts size) */}
          <div className="flex-1 bg-black relative" style={{ 
            aspectRatio: streamOrientation === 'portrait' ? '9/16' : '16/9',
            maxHeight: '70vh'
          }}>
            {isDJ && !previewAsFan ? (
              cameraStream ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  {isLiveStream && (
                    <div className="absolute top-4 left-4 bg-rose-600/95 text-white px-3 py-1 rounded-full font-black text-[10px] tracking-widest uppercase animate-pulse">
                      🔴 LIVE
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-neutral-600">
                  <span className="text-4xl">🎛️</span>
                  <span className="text-[11px] tracking-widest uppercase font-bold text-neutral-500">[ FEED_OFFLINE ]: START CAMERA TO PREVIEW</span>
                </div>
              )
            ) : (
              <LiveKitPlayer 
                url={activeStream.livekitUrl} 
                token={livekitToken} 
                className="w-full h-full"
                onVideoDimensions={(w, h) => {
                  if (!orientationSet.current) {
                    orientationSet.current = true;
                    if (h > w) setStreamOrientation('portrait');
                    else setStreamOrientation('landscape');
                  }
                }}
              />
            )}

            <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-white/10 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                  <span className="text-[9px] font-black text-neutral-300 tracking-widest">142</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black text-[#D4AF37]">●</span>
                  <span className="text-[9px] font-black text-neutral-300 tracking-widest">{isDJ && isLiveStream ? formatDuration(broadcastDuration) : '45:32'}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-[9px] font-black text-neutral-400 tracking-widest">
                  HEAT {hapticMetrics.globalHeatIndex}°
                </div>
                {isDJ && (
                  <button
                    onClick={handleGoLive}
                    disabled={isInitializingBroadcast || !isCapturing}
                    className={`text-[9px] font-black tracking-widest px-3 py-1 rounded transition-colors ${
                      isLiveStream ? 'bg-rose-600 text-white' : 'bg-[#D4AF37] text-black hover:bg-[#AA8417]'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {isLiveStream ? 'END' : isInitializingBroadcast ? '...' : 'GO LIVE'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT OVERLAY - Chat/Reactions (hidden on landscape) */}
          <div className={`w-48 bg-neutral-950 border-l border-neutral-800 flex flex-col transition-all duration-500 ${streamOrientation === 'portrait' ? 'sm:flex' : 'hidden'}`}>
            <div className="p-3 border-b border-neutral-800">
              <h3 className="text-[10px] font-black tracking-widest text-[#D4AF37] uppercase">💬 LIVE CHAT</h3>
            </div>
            <div className="flex-1 p-3 space-y-2 overflow-y-auto">
              <div className="text-[10px] text-neutral-500 text-center py-4">Chat messages appear here</div>
            </div>
            <div className="p-3 border-t border-neutral-800">
              <div className="text-[9px] text-neutral-400 text-center">🔥 142 viewers</div>
            </div>
          </div>
        </div>

        {/* MINI-BRAND ROOM CARDS (Balanced proportions matching screenshot reference 2) */}
        <div className="space-y-2">
          <span className="text-[10px] font-black tracking-widest text-neutral-400 uppercase">SELECT ROOM / MINI-BRANDS</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setActiveChannel(channel.id)}
                className={`relative rounded-xl overflow-hidden border transition-all duration-300 text-left h-24 bg-neutral-950 group ${
                  activeChannel === channel.id
                    ? 'border-[#D4AF37] ring-2 ring-[#D4AF37] shadow-xl scale-[1.02]'
                    : 'border-neutral-800 hover:border-neutral-600'
                }`}
              >
                <div className="relative z-10 p-2.5 flex flex-col justify-between h-full">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black text-neutral-400 tracking-widest block">{channel.label}</span>
                    <span className="text-[10px] text-white font-bold tracking-tight block">{channel.sub}</span>
                  </div>
                </div>
                <div className="absolute right-1 bottom-1 w-16 h-16 opacity-90 group-hover:scale-105 transition-transform duration-300">
                  <Image
                    src={channel.image}
                    alt={channel.label}
                    fill
                    className="object-contain"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CHAT CONTAINER */}
        {session ? (
          <div className="bg-neutral-950 border border-neutral-900 rounded-xl overflow-hidden">
            <div className="p-3 border-b border-neutral-900 flex justify-between items-center">
              <h3 className="text-[10px] font-black tracking-widest text-[#D4AF37] uppercase">💬 LIVE CHAT</h3>
              <span className="text-[9px] text-neutral-600">{chatMessages.length}</span>
            </div>
            <div ref={chatContainerRef} className="p-3 space-y-2 max-h-[160px] overflow-y-auto">
              {chatMessages.length === 0 ? (
                <div className="text-xs text-neutral-500 text-center py-3">No messages yet. Say something!</div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={msg.id || i} className="text-xs text-neutral-300 leading-relaxed">
                    <span className="text-[#D4AF37] font-bold">{msg.user_email?.split('@')[0] || 'Anonymous'}:</span> {msg.content}
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t border-neutral-900 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Send a message..."
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              />
              <button
                onClick={sendMessage}
                disabled={!chatInput.trim()}
                className="px-3 py-2 bg-[#D4AF37] text-black text-[10px] font-black rounded-lg hover:bg-[#AA8417] transition-colors disabled:opacity-50"
              >
                SEND
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 text-center">
            <p className="text-xs text-neutral-400 mb-2">Sign in to join the live chat</p>
            <button onClick={() => { setShowAuthModal(true); setAuthMode('signin'); }} className="px-4 py-2 bg-[#D4AF37] text-black text-[10px] font-black tracking-widest rounded-lg hover:bg-[#AA8417] transition-colors">SIGN IN TO CHAT</button>
          </div>
        )}

        <UpcomingStreams channelFilter={activeChannel} />

        {/* HAPTIC REACTION METRICS */}
        <div className="p-5 bg-neutral-950 border border-neutral-900 rounded-xl font-mono shadow-sm">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-neutral-900">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#D4AF37] uppercase">Haptic Reaction Node</span>
              <h3 className="text-sm font-extrabold tracking-wider uppercase mt-0.5">Live Heat Map Model</h3>
            </div>
            <div className="text-[11px] font-black text-rose-500 animate-pulse uppercase tracking-widest flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 block"></span>
              INDEX: {hapticMetrics.globalHeatIndex}%
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 flex flex-col gap-2">
              <div className="flex justify-between text-[10px] uppercase text-neutral-500 font-bold">
                <span>Sub Bass Resonance</span>
                <span className="text-white">{hapticMetrics.bassResonance}%</span>
              </div>
              <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#AA8417] to-[#D4AF37]" style={{ width: `${hapticMetrics.bassResonance}%` }} />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 flex flex-col gap-2">
              <div className="flex justify-between text-[10px] uppercase text-neutral-500 font-bold">
                <span>Vibration / Motion</span>
                <span className="text-white">{hapticMetrics.crowdMovement}%</span>
              </div>
              <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#AA8417] to-[#D4AF37]" style={{ width: `${hapticMetrics.crowdMovement}%` }} />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 flex flex-col gap-2">
              <div className="flex justify-between text-[10px] uppercase text-neutral-500 font-bold">
                <span>Tip Payout Velocity</span>
                <span className="text-white">{hapticMetrics.bountyVelocity}%</span>
              </div>
              <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#AA8417] to-[#D4AF37]" style={{ width: `${hapticMetrics.bountyVelocity}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* ARTIST CARD & RATING */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-orange-600 rounded-full flex items-center justify-center text-2xl shadow-md">🎧</div>
            <div className="flex-1">
              <h3 className="text-lg font-bold">{activeStream.djName}</h3>
              <p className="text-sm text-neutral-400">Dubstep • Garage • Bass Music</p>
            </div>
            <div className="flex flex-col gap-2">
              <button className="px-4 py-2 bg-[#D4AF37] text-black text-xs font-black tracking-widest rounded-lg hover:bg-[#AA8417] transition-colors">FOLLOW</button>
              {session && <TipButton djId="dj-fabian-id" djName={activeStream.djName} streamId={activeChannel} userEmail={session.user.email} userId={session.user.id} />}
            </div>
          </div>
          
          {session && (
            <div className="mt-4 pt-4 border-t border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">{hasRated ? 'Thanks for rating!' : 'Rate this set:'}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => { if (!hasRated) { setUserRating(star); setHasRated(true); } }}
                      disabled={hasRated}
                      className={`text-lg transition-colors ${star <= userRating ? 'text-[#D4AF37]' : 'text-neutral-600'} ${hasRated ? 'cursor-default' : 'hover:text-[#D4AF37]'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AUTH MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'} border rounded-2xl p-8 max-w-md w-full space-y-6 shadow-2xl`}>
            <div className="text-center space-y-2">
              <Image src="/the_guestlint_web.svg" alt="Guestlist" width={200} height={50} className="mx-auto" />
              <h2 className="text-xl font-black tracking-wider">{authMode === 'signup' ? 'JOIN GUESTLIST' : 'WELCOME BACK'}</h2>
            </div>
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="text-xs font-bold tracking-widest text-neutral-500">EMAIL</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full border border-neutral-800 rounded-lg px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-colors ${darkMode ? 'bg-black text-white' : 'bg-neutral-100 text-black'}`} placeholder="dj@example.com" required />
              </div>
              <div>
                <label className="text-xs font-bold tracking-widest text-neutral-500">PASSWORD</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full border border-neutral-800 rounded-lg px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-colors ${darkMode ? 'bg-black text-white' : 'bg-neutral-100 text-black'}`} placeholder="••••••••" required />
              </div>
              {authError && <div className="text-red-500 text-sm bg-red-950/50 border border-red-800 rounded-lg p-3">{authError}</div>}
              <button type="submit" className="w-full bg-[#D4AF37] hover:bg-[#AA8417] text-black font-black text-sm tracking-widest py-3 rounded-lg transition-colors">{authMode === 'signup' ? 'CREATE ACCOUNT' : 'SIGN IN'}</button>
            </form>
            <div className="text-center">
              <button onClick={() => { setAuthMode(authMode === 'signup' ? 'signin' : 'signup'); setAuthError(''); }} className="text-xs text-neutral-400 hover:text-white transition-colors">{authMode === 'signup' ? 'Already have an account? Sign in' : 'New here? Create account'}</button>
            </div>
            <button onClick={() => setShowAuthModal(false)} className="w-full py-2 text-xs text-neutral-500 hover:text-white transition-colors">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}