"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Room, RoomEvent } from 'livekit-client';

export interface MediaDeviceChoice {
  deviceId: string;
  label: string;
  isContinuity?: boolean;
}

export function useGuestlistCamera() {
  const [videoDevices, setVideoDevices] = useState<MediaDeviceChoice[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceChoice[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');
  const [selectedAudioId, setSelectedAudioId] = useState<string>('');

  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLiveStream, setIsLiveStream] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Master Gain & Audio Metering States
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [inputGain, setInputGain] = useState<number>(1.0);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);

  // LiveKit Room Ref
  const livekitRoomRef = useRef<Room | null>(null);

  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const allDevices = await navigator.mediaDevices.enumerateDevices();

      const vDevs: MediaDeviceChoice[] = allDevices
        .filter(d => d.kind === 'videoinput')
        .map(d => ({
          deviceId: d.deviceId,
          label: d.label || `Camera (${d.deviceId.slice(0, 6)}...)`,
          isContinuity: /iphone|ipad|desk view/i.test(d.label)
        }));

      const aDevs: MediaDeviceChoice[] = allDevices
        .filter(d => d.kind === 'audioinput')
        .map(d => ({
          deviceId: d.deviceId,
          label: d.label || `Audio In (${d.deviceId.slice(0, 6)}...)`
        }));

      setVideoDevices(vDevs);
      setAudioDevices(aDevs);

      if (vDevs.length > 0 && !selectedVideoId) {
        const preferred = vDevs.find(d => d.isContinuity) || vDevs[0];
        setSelectedVideoId(preferred.deviceId);
      }
      if (aDevs.length > 0 && !selectedAudioId) {
        setSelectedAudioId(aDevs[0].deviceId);
      }
    } catch (err: any) {
      setError(`[CAMERA_ENUM_ERROR]: ${err.message}`);
    }
  }, [selectedVideoId, selectedAudioId]);

  // Web Audio Graph Setup with Gain Node
  const setupAudioGraph = (stream: MediaStream) => {
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      const gainNode = audioCtx.createGain();
      const analyser = audioCtx.createAnalyser();

      gainNode.gain.value = inputGain;
      analyser.fftSize = 64;

      source.connect(gainNode);
      gainNode.connect(analyser);

      audioContextRef.current = audioCtx;
      gainNodeRef.current = gainNode;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        setAudioLevel(normalized);
        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (err) {
      console.error("[AUDIO_GRAPH_ERROR]:", err);
    }
  };

  const changeGain = (newGain: number) => {
    setInputGain(newGain);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = newGain;
    }
  };

  const stopAudioMeter = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    setAudioLevel(0);
  };

  const startCapture = useCallback(async (overrideVideoId?: string, overrideAudioId?: string) => {
    const targetVideoId = overrideVideoId || selectedVideoId;
    const targetAudioId = overrideAudioId || selectedAudioId;

    setError(null);
    try {
      if (activeStream) {
        activeStream.getTracks().forEach(track => {
          if (track.readyState !== 'ended') {
            track.stop();
          }
        });
      }

      const constraints: MediaStreamConstraints = {
        video: targetVideoId ? {
          deviceId: { exact: targetVideoId },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        } : {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: targetAudioId ? {
          deviceId: { exact: targetAudioId },
          echoCancellation: true,
          noiseSuppression: true
        } : true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setActiveStream(stream);
      setIsCapturing(true);

      refreshDevices();
      setupAudioGraph(stream);

      if ('wakeLock' in navigator) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch (e) {
          console.warn("[WAKE_LOCK_WARN]: Screen wake lock unavailable.");
        }
      }
    } catch (err: any) {
      setError(`[STREAM_CAPTURE_ERROR]: ${err.message}`);
      setIsCapturing(false);
    }
  }, [selectedVideoId, selectedAudioId, activeStream, refreshDevices]);

  const stopCapture = useCallback(() => {
    // Disconnect LiveKit room if connected
    if (livekitRoomRef.current) {
      livekitRoomRef.current.disconnect();
      livekitRoomRef.current = null;
    }
    if (activeStream) {
      activeStream.getTracks().forEach(track => {
        if (track.readyState !== 'ended') {
          track.stop();
        }
      });
      setActiveStream(null);
    }
    stopAudioMeter();
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
    setIsCapturing(false);
    setIsLiveStream(false);
  }, [activeStream]);

  // LiveKit Broadcast
  const startLiveKitBroadcast = async () => {
    if (!activeStream) {
      throw new Error("No active media stream found.");
    }

    try {
      // Get broadcaster token from API
      const tokenRes = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: 'fabiandubz-stream',
          identity: 'dj-fabian-web',
          role: 'broadcaster'
        })
      });

      if (!tokenRes.ok) {
        throw new Error('Failed to get LiveKit token');
      }

      const { token } = await tokenRes.json();
      
      // Create LiveKit room
      const room = new Room({
        adaptiveStream: false,
        dynacast: false,
      });

      livekitRoomRef.current = room;

      // Connect to room
      const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://guestlist-tv-ei1a8q8r.livekit.cloud';
      await room.connect(wsUrl, token);
      console.log('[LIVEKIT]: Connected to room');

      // Publish audio and video tracks
      const videoTrack = activeStream.getVideoTracks()[0];
      const audioTrack = activeStream.getAudioTracks()[0];

      if (videoTrack) {
        const pub = await room.localParticipant.publishTrack(videoTrack, {
          name: 'camera',
          simulcast: false,
        });
        console.log('[LIVEKIT]: Published video track', pub.trackSid);
      }

      if (audioTrack) {
        const pub = await room.localParticipant.publishTrack(audioTrack, {
          name: 'microphone',
        });
        console.log('[LIVEKIT]: Published audio track', pub.trackSid);
      }

      setIsLiveStream(true);
    } catch (err: any) {
      console.error("[LIVEKIT_BROADCAST_ERROR]:", err);
      setError(`LiveKit Broadcast Failed: ${err.message}`);
      setIsLiveStream(false);
      throw err;
    }
  };

  const toggleGoLive = async () => {
    if (!isCapturing) {
      alert("PLEASE START CAPTURE ENGINE BEFORE GOING LIVE!");
      return;
    }

    if (isLiveStream) {
      // Stop broadcast
      if (livekitRoomRef.current) {
        livekitRoomRef.current.disconnect();
        livekitRoomRef.current = null;
      }
      setIsLiveStream(false);
    } else {
      // Start LiveKit broadcast
      await startLiveKitBroadcast();
    }
  };

  useEffect(() => {
    refreshDevices();
    navigator.mediaDevices?.addEventListener('devicechange', refreshDevices);
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', refreshDevices);
    };
  }, [refreshDevices]);

  return {
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
    refreshDevices,
    startCapture,
    stopCapture,
    toggleGoLive
  };
}
