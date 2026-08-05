"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

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
  const [inputGain, setInputGain] = useState<number>(1.0); // Default 100% gain
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);

  // WebRTC PeerConnection Ref for Mux Ingest
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

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

      // Source -> Gain -> Analyser
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

  // Adjust Master Volume Gain Level (0.0 to 2.0)
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
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
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

  // Native WHIP Handshake proxied through local Next.js server route (/api/mux/whip)
  const startMuxWhipBroadcast = async (target: string) => {
    if (!activeStream) {
      throw new Error("No active media stream found.");
    }

    try {
      // 1. Create WebRTC PeerConnection with STUN Servers
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      });
      peerConnectionRef.current = pc;

      // 2. Add audio and video tracks as 'sendonly' for WHIP ingestion
      activeStream.getTracks().forEach(track => {
        pc.addTransceiver(track, {
          direction: 'sendonly',
          streams: [activeStream]
        });
      });

      // 3. Create Local SDP Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 4. Wait for WebRTC ICE Candidates to finish gathering
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === 'complete') {
          resolve();
        } else {
          const checkState = () => {
            if (pc.iceGatheringState === 'complete') {
              pc.removeEventListener('icegatheringstatechange', checkState);
              resolve();
            }
          };
          pc.addEventListener('icegatheringstatechange', checkState);
          setTimeout(resolve, 1000); // 1.0s fallback timeout
        }
      });

      const fullOfferSdp = pc.localDescription?.sdp || offer.sdp;

      // Pass raw dynamic target WHIP URL directly without hostname mutation
      const whipTargetUrl = target;

      // Try direct browser-to-Mux WHIP first (bypasses server Lambda DNS issues)
      // If CORS blocks it, we'll catch and can fall back to server proxy
      let answerSdp: string;
      try {
        const directResponse = await fetch(whipTargetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/sdp',
            'Accept': 'application/sdp',
          },
          body: fullOfferSdp,
        });
        
        if (!directResponse.ok) {
          throw new Error(`Direct WHIP failed with status ${directResponse.status}`);
        }
        
        answerSdp = await directResponse.text();
        console.log('[WHIP_DIRECT_SUCCESS]: Browser-to-Mux handshake succeeded');
      } catch (directErr: any) {
        console.warn('[WHIP_DIRECT_FALLBACK]:', directErr.message);
        
        // Fallback: Post via local server proxy route
        const proxyResponse = await fetch('/api/mux/whip', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({
            whipUrl: whipTargetUrl,
            sdp: fullOfferSdp
          })
        });

        const proxyData = await proxyResponse.json();

        if (!proxyResponse.ok || !proxyData.answerSdp) {
          throw new Error(proxyData.error || 'Server proxy failed to obtain SDP answer from Mux.');
        }
        
        answerSdp = proxyData.answerSdp;
      }

      // Set Remote SDP Answer from Mux
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp
      });

      setIsLiveStream(true);
    } catch (err: any) {
      console.error("[WHIP_BROADCAST_ERROR]:", err);
      setError(`Mux Broadcast Failed: ${err.message}`);
      setIsLiveStream(false);
      throw err;
    }
  };

  const toggleGoLive = async (target?: string) => {
    if (!isCapturing) {
      alert("PLEASE START CAPTURE ENGINE BEFORE GOING LIVE!");
      return;
    }

    if (isLiveStream) {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      setIsLiveStream(false);
    } else {
      if (target) {
        await startMuxWhipBroadcast(target);
      } else {
        setIsLiveStream(true);
      }
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