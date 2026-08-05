'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface CloudflareBroadcasterProps {
  djName: string;
  eventName?: string;
  onLiveStateChange?: (isLive: boolean, streamData?: any) => void;
}

export default function CloudflareBroadcaster({
  djName,
  eventName = 'Live Set',
  onLiveStateChange,
}: CloudflareBroadcasterProps) {
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveInput, setLiveInput] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, frameRate: 30 },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err: any) {
      throw new Error(`Camera access denied: ${err.message}`);
    }
  };

  const createLiveInput = async () => {
    const res = await fetch('/api/cloudflare/live-input', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ djName, eventName }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    setLiveInput(data.liveInput);
    return data.liveInput;
  };

  const startBroadcast = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const stream = await startCapture();
      const input = await createLiveInput();
      const whipUrl = input.whipUrl;

      if (!whipUrl) {
        throw new Error('No WHIP URL returned from Cloudflare');
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }],
      });
      pcRef.current = pc;

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === 'complete') {
          resolve();
        } else {
          const check = () => {
            if (pc.iceGatheringState === 'complete') {
              pc.removeEventListener('icegatheringstatechange', check);
              resolve();
            }
          };
          pc.addEventListener('icegatheringstatechange', check);
          setTimeout(resolve, 2000);
        }
      });

      const response = await fetch(whipUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp',
        },
        body: pc.localDescription?.sdp,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`WHIP failed: ${response.status} ${errorText}`);
      }

      const answerSdp = await response.text();
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      });

      setIsLive(true);
      onLiveStateChange?.(true, input);

    } catch (err: any) {
      console.error('[BROADCAST_ERROR]:', err);
      setError(err.message);
      stopBroadcast();
    } finally {
      setIsLoading(false);
    }
  };

  const stopBroadcast = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;

    pcRef.current?.close();
    pcRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsLive(false);
    setLiveInput(null);
    onLiveStateChange?.(false);
  }, [onLiveStateChange]);

  useEffect(() => {
    return () => stopBroadcast();
  }, [stopBroadcast]);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="relative w-full max-w-2xl aspect-video bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        {isLive && (
          <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
            ● LIVE
          </div>
        )}
      </div>

      <div className="flex gap-4">
        {!isLive ? (
          <button
            onClick={startBroadcast}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Starting...' : '🔴 Go Live'}
          </button>
        ) : (
          <button
            onClick={stopBroadcast}
            className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-full font-bold transition-colors"
          >
            ⏹ Stop Broadcast
          </button>
        )}
      </div>

      {error && (
        <div className="text-red-500 bg-red-50 px-4 py-2 rounded-lg max-w-xl text-center">
          {error}
        </div>
      )}

      {liveInput && isLive && (
        <div className="text-sm text-gray-400 text-center">
          <p>Stream ID: {liveInput.uid}</p>
          <p>Share this WHEP URL with viewers:</p>
          <code className="block mt-1 p-2 bg-gray-800 rounded text-xs break-all">
            {liveInput.whepUrl}
          </code>
        </div>
      )}
    </div>
  );
}
