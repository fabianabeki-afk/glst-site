'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UnifiedStreamPlayerProps {
  hlsUrl?: string;
  whepUrl?: string;
  autoplay?: boolean;
}

export default function UnifiedStreamPlayer({ hlsUrl, whepUrl, autoplay = true }: UnifiedStreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamType, setStreamType] = useState<'hls' | 'whep' | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  // Native WebRTC WHEP implementation
  const setupWHEP = useCallback(async (url: string, video: HTMLVideoElement) => {
    try {
      console.log('Starting native WHEP connection...');
      
      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.cloudflare.com:3478' }
        ]
      });
      pcRef.current = pc;

      // Add transceiver for video
      pc.addTransceiver('video', { direction: 'recvonly' });

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait for ICE gathering to complete
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
        }
      });

      // Send offer to WHEP endpoint
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp'
        },
        body: pc.localDescription?.sdp
      });

      if (!response.ok) {
        throw new Error(`WHEP endpoint returned ${response.status}`);
      }

      // Get answer SDP
      const answerSdp = await response.text();
      
      // Set remote description
      await pc.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp: answerSdp
      }));

      // Connect video element
      pc.ontrack = (event) => {
        console.log('Track received:', event.track.kind);
        if (event.streams && event.streams[0]) {
          video.srcObject = event.streams[0];
          setIsConnected(true);
          setStreamType('whep');
        }
      };

      console.log('WHEP connection established');
    } catch (err) {
      console.error('WHEP setup error:', err);
      throw err;
    }
  }, []);

  // HLS Setup
  const setupHLS = useCallback(async (url: string, video: HTMLVideoElement) => {
    try {
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      
      if (isSafari || video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support
        video.src = url;
        video.addEventListener('loadedmetadata', () => {
          setIsConnected(true);
          setStreamType('hls');
        });
      } else {
        // HLS.js for other browsers
        const HlsModule = await import('hls.js');
        const Hls = HlsModule.default;
        
        if (Hls.isSupported()) {
          const hls = new Hls({
            maxBufferLength: 30,
            liveSyncDurationCount: 3,
          });
          
          hls.loadSource(url);
          hls.attachMedia(video);
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsConnected(true);
            setStreamType('hls');
            if (autoplay) video.play().catch(() => {});
          });
          
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) {
              setError('HLS stream error: ' + data.type);
            }
          });
          
          return () => hls.destroy();
        }
      }
    } catch (err) {
      console.error('HLS setup error:', err);
      setError('HLS stream failed to load');
    }
  }, [autoplay]);

  useEffect(() => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    let cleanup: (() => void) | undefined;
    
    const initializePlayer = async () => {
      setIsConnected(false);
      setError(null);
      
      // Priority: Try WHEP first (WebRTC), fallback to HLS
      if (whepUrl) {
        try {
          await setupWHEP(whepUrl, video);
          return;
        } catch (err) {
          console.log('WHEP failed, trying HLS fallback');
        }
      }
      
      if (hlsUrl) {
        cleanup = await setupHLS(hlsUrl, video);
      }
    };
    
    initializePlayer();
    
    return () => {
      if (cleanup) cleanup();
      if (pcRef.current) {
        pcRef.current.close();
      }
    };
  }, [hlsUrl, whepUrl, setupWHEP, setupHLS]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay={autoplay}
        muted
        playsInline
        controls
        className="w-full h-full object-cover"
      />
      
      {!isConnected && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
            <p className="text-sm">Connecting to stream...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90">
          <div className="text-center px-4">
            <p className="text-red-400 font-bold mb-2">Connection Failed</p>
            <p className="text-sm text-neutral-400">{error}</p>
          </div>
        </div>
      )}
      
      {isConnected && (
        <div className="absolute top-4 left-4 flex gap-2">
          <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
            ● LIVE
          </div>
          {streamType === 'whep' && (
            <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
              WebRTC
            </div>
          )}
          {streamType === 'hls' && (
            <div className="bg-green-600 text-white px-2 py-1 rounded text-xs">
              HLS
            </div>
          )}
        </div>
      )}
    </div>
  );
}
