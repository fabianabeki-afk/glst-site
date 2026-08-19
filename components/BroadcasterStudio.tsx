"use client";

import React, { useRef, useEffect, useState } from 'react';
import { useGuestlistCamera } from '@/hooks/useGuestlistCamera';

export function BroadcasterStudio() {
  const {
    videoDevices,
    audioDevices,
    selectedVideoId,
    setSelectedVideoId,
    selectedAudioId,
    setSelectedAudioId,
    activeStream,
    isCapturing,
    isLiveStream,
    audioLevel,
    inputGain,
    changeGain,
    error,
    startCapture,
    stopCapture,
    toggleGoLive
  } = useGuestlistCamera();

  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [showOverlay, setShowOverlay] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isInitializingMux, setIsInitializingMux] = useState(false);
  
  // LiveKit doesn't need a playback URL - viewers connect directly to the room
  
  // Explicitly mapping to Audio/Visual Settings menu modal state
  const [isAudioVisualSettingsOpen, setIsAudioVisualSettingsOpen] = useState(false);

  useEffect(() => {
    if (videoRef.current && activeStream) {
      videoRef.current.srcObject = activeStream;
    }
  }, [activeStream]);

  const selectedDevice = videoDevices.find(d => d.deviceId === selectedVideoId);
  const isContinuity = selectedDevice?.isContinuity || 
                       selectedDevice?.label?.toLowerCase().includes('iphone') || 
                       selectedDevice?.label?.toLowerCase().includes('continuity');

  const handleGoLiveClick = async () => {
    if (isLiveStream) {
      await toggleGoLive();
      return;
    }

    if (!activeStream) {
      alert("SIGNAL_ERROR: Active video/audio stream required. Turn on camera first.");
      return;
    }

    setIsInitializingMux(true);

    try {
      await toggleGoLive();
    } catch (err: any) {
      console.error("LIVEKIT_BROADCAST_EXCEPTION:", err);
      alert(`Broadcast Error: ${err.message}`);
    } finally {
      setIsInitializingMux(false);
    }
  };

  return (
    <div className="w-full bg-neutral-950 border border-neutral-900 rounded-2xl p-6 font-mono text-white flex flex-col gap-4 shadow-2xl relative">
      {/* Ambient Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

      {/* 1. TOP BAR */}
      <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLiveStream ? 'bg-rose-500 opacity-80' : isCapturing ? 'bg-emerald-400 opacity-75' : 'bg-neutral-600'}`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isLiveStream ? 'bg-rose-600' : isCapturing ? 'bg-emerald-500' : 'bg-neutral-600'}`} />
          </span>
          <span className="text-[10px] tracking-widest text-neutral-400 uppercase font-bold">
            [SYSTEM_SECURE]: PLATFORM MODE GRANTED // <span className="text-[#D4AF37]">BROADCASTER LAYOUT</span>
          </span>
        </div>
      </div>

      {/* 2. MAIN STUDIO VIEWPORT */}
      <div className={`relative w-full bg-black rounded-xl border border-neutral-900 overflow-hidden flex items-center justify-center group transition-all duration-300 ${
        aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16] max-w-sm mx-auto'
      }`}>
        {activeStream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-neutral-600">
            <span className="text-4xl">🎛️</span>
            <span className="text-[11px] tracking-widest uppercase font-bold text-neutral-500">
              [ FEED_OFFLINE ]: SELECT INPUT HARDWARE &amp; START STREAM
            </span>
          </div>
        )}

        {showOverlay && activeStream && (
          <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between border-2 border-[#D4AF37]/10 rounded-xl">
            <div className="flex justify-between items-start">
              <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-neutral-800 text-[9px] font-bold tracking-widest text-[#D4AF37] uppercase">
                4K UNCOMPRESSED // 60 FPS
              </div>
              <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-neutral-800 text-[9px] font-bold tracking-widest text-emerald-400 uppercase">
                LATENCY: &lt;20ms
              </div>
            </div>

            {isLiveStream && (
              <div className="self-center bg-rose-600/90 text-white px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest uppercase animate-pulse shadow-xl">
                ● BROADCASTING LIVE TO NETWORK
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="absolute inset-x-4 bottom-4 p-3 bg-rose-950/90 border border-rose-800 text-rose-300 text-[10px] rounded-lg backdrop-blur-md z-20">
            ⚠️ INGEST_ERROR: {error}
          </div>
        )}
      </div>

      {/* 3. BOTTOM CONTROL BAR */}
      <div className="flex flex-col md:flex-row items-center justify-between border-t border-neutral-900 pt-4 gap-4 relative">
        <div className="flex flex-col">
          <h2 className="text-sm font-black tracking-wider text-white uppercase">
            [ STUDIO_FEED ]: {isLiveStream ? "LIVE BROADCAST" : isCapturing ? "PREVIEW ACTIVE" : "ENGINE STANDBY"}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {isContinuity && (
            <div className="px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2 text-[10px] text-amber-400 font-bold tracking-widest uppercase hidden sm:flex">
              <span> CONTINUITY CAMERA 4K</span>
            </div>
          )}

          {/* Audio/Visual Settings Menu Trigger Button */}
          <button 
            onClick={() => setIsAudioVisualSettingsOpen(!isAudioVisualSettingsOpen)}
            className="px-4 py-2.5 text-[10px] font-bold tracking-widest rounded-lg border border-neutral-800 bg-neutral-900 text-[#D4AF37] hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all uppercase cursor-pointer flex items-center gap-2"
          >
            🎛️ AUDIO/VISUAL SETTINGS <span className="text-[8px]">▼</span>
          </button>

          {/* Main Action Button */}
          {!isCapturing ? (
            <button
              onClick={() => startCapture()}
              className="px-5 py-2.5 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all shadow-lg cursor-pointer bg-neutral-100 text-black hover:scale-[1.02]"
            >
              📷 TURN ON CAMERA
            </button>
          ) : (
            <button
              onClick={handleGoLiveClick}
              disabled={isInitializingMux}
              className={`px-5 py-2.5 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all shadow-lg cursor-pointer ${
                isLiveStream
                  ? 'bg-neutral-700 text-white hover:bg-neutral-600'
                  : 'bg-red-600 text-white hover:bg-red-700 hover:scale-[1.02] shadow-red-900/50'
              } disabled:opacity-40`}
            >
              {isInitializingMux ? "⏳ CONNECTING..." : isLiveStream ? "🔴 CEASE BROADCAST" : "🔴 GUEST LIVE"}
            </button>
          )}

          {/* 4. AUDIO / VISUAL SETTINGS POPUP MENU (Encapsulated cleanly) */}
          {isAudioVisualSettingsOpen && (
            <div className="absolute bottom-[110%] right-0 w-96 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-5 z-50 flex flex-col gap-4 animate-in slide-in-from-bottom-2 fade-in">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                <h3 className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase">Audio / Visual Settings</h3>
                <button onClick={() => setIsAudioVisualSettingsOpen(false)} className="text-neutral-500 hover:text-white text-lg leading-none cursor-pointer">×</button>
              </div>
              
              {/* Video Capture Source Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">Video Capture Source</label>
                <select
                  value={selectedVideoId}
                  onChange={(e) => setSelectedVideoId(e.target.value)}
                  disabled={isCapturing}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-[10px] text-white outline-none focus:border-[#D4AF37] disabled:opacity-50 cursor-pointer"
                >
                  {videoDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>{device.label}</option>
                  ))}
                </select>
              </div>

              {/* Audio Ingest Source Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">Audio Ingest Source (Pioneer DJ / Interface / Mic)</label>
                <select
                  value={selectedAudioId}
                  onChange={(e) => setSelectedAudioId(e.target.value)}
                  disabled={isCapturing}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-[10px] text-white outline-none focus:border-[#D4AF37] disabled:opacity-50 cursor-pointer"
                >
                  {audioDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>{device.label}</option>
                  ))}
                </select>
              </div>

              {/* Master Volume Gain & Stereo VU Meter */}
              <div className="flex flex-col gap-3 p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
                    <span>Master Gain Volume:</span>
                    <span className="text-[#D4AF37]">{Math.round(inputGain * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.05"
                    value={inputGain}
                    onChange={(e) => changeGain(parseFloat(e.target.value))}
                    className="w-full accent-[#D4AF37] cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-1.5 pt-2 border-t border-neutral-950">
                  <div className="flex justify-between items-center text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
                    <span>Stereo Master Audio Decibels (VU):</span>
                    <span className={audioLevel > 85 ? 'text-rose-500 font-bold' : 'text-emerald-400'}>{audioLevel}% {audioLevel > 85 ? 'PEAKING' : 'OK'}</span>
                  </div>
                  <div className="h-2 bg-black rounded-full overflow-hidden p-0.5 border border-neutral-800 flex gap-0.5">
                    <div 
                      className={`h-full rounded-full transition-all duration-75 ${audioLevel > 85 ? 'bg-gradient-to-r from-emerald-500 to-rose-600' : 'bg-gradient-to-r from-emerald-500 to-[#D4AF37]'}`}
                      style={{ width: `${audioLevel}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Viewport Config & Single-Line Start/Stop Engine Button */}
              <div className="flex flex-col gap-3 pt-2 border-t border-neutral-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest">Aspect Ratio / HUD:</span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <button onClick={() => setAspectRatio('16:9')} className={`px-2 py-1 text-[9px] font-bold rounded cursor-pointer ${aspectRatio === '16:9' ? 'bg-[#D4AF37] text-black' : 'bg-neutral-800 text-neutral-400'}`}>16:9</button>
                      <button onClick={() => setAspectRatio('9:16')} className={`px-2 py-1 text-[9px] font-bold rounded cursor-pointer ${aspectRatio === '9:16' ? 'bg-[#D4AF37] text-black' : 'bg-neutral-800 text-neutral-400'}`}>9:16</button>
                    </div>
                    <button onClick={() => setShowOverlay(!showOverlay)} className="text-[9px] text-[#D4AF37] font-bold underline cursor-pointer">
                      {showOverlay ? "HIDE HUD" : "SHOW HUD"}
                    </button>
                  </div>
                </div>

                {!isCapturing ? (
                  <button
                    onClick={() => startCapture()}
                    className="w-full py-3 bg-gradient-to-r from-[#AA8417] to-[#D4AF37] text-black font-black text-[10px] tracking-widest rounded-xl transition-all uppercase shadow-md cursor-pointer whitespace-nowrap text-center"
                  >
                    [ START INGEST ENGINE ]
                  </button>
                ) : (
                  <button
                    onClick={stopCapture}
                    className="w-full py-3 bg-rose-950/60 border border-rose-800 text-rose-400 font-black text-[10px] tracking-widest rounded-xl transition-all uppercase cursor-pointer whitespace-nowrap text-center"
                  >
                    [ STOP INGEST ENGINE ]
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LiveKit broadcast indicator */}
      {isLiveStream && (
        <div className="mt-2 p-3 bg-neutral-900/90 border border-[#D4AF37]/40 rounded-xl flex items-center justify-center gap-2 text-[11px]">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-emerald-400 font-bold uppercase tracking-wider">
            LIVEKIT BROADCAST ACTIVE - VIEWERS CAN CONNECT
          </span>
        </div>
      )}

    </div>
  );
}