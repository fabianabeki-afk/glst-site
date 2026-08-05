import React, { useEffect, useRef, useState } from 'react';

interface WHEPPlayerProps {
  whepUrl: string;
  hlsFallbackUrl: string;
  className?: string;
}

export default function WHEPPlayer({ whepUrl, hlsFallbackUrl, className = '' }: WHEPPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingHLS, setUsingHLS] = useState(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: any = null;

    const startWHEP = async () => {
      try {
        // Create peer connection
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        pcRef.current = pc;

        // Create offer
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });

        await pc.setLocalDescription(offer);

        // Wait for ICE gathering
        await new Promise<void>((resolve) => {
          if (pc.iceGatheringState === 'complete') {
            resolve();
            return;
          }
          const checkState = () => {
            if (pc.iceGatheringState === 'complete') {
              pc.removeEventListener('icegatheringstatechange', checkState);
              resolve();
            }
          };
          pc.addEventListener('icegatheringstatechange', checkState);
          // Timeout after 3 seconds
          setTimeout(() => {
            pc.removeEventListener('icegatheringstatechange', checkState);
            resolve();
          }, 3000);
        });

        // Send offer to WHEP endpoint
        const response = await fetch(whepUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/sdp',
          },
          body: pc.localDescription?.sdp,
        });

        if (!response.ok) {
          throw new Error(`WHEP error: ${response.status}`);
        }

        // Get answer
        const answerSdp = await response.text();
        await pc.setRemoteDescription({
          type: 'answer',
          sdp: answerSdp,
        });

        // Handle incoming tracks
        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            video.srcObject = event.streams[0];
            video.play().catch(e => console.log('Autoplay prevented:', e));
            setIsLoading(false);
          }
        };

      } catch (err) {
        console.error('WHEP failed:', err);
        // Fall back to HLS
        startHLS();
      }
    };

    const startHLS = () => {
      setUsingHLS(true);
      
      // Check if HLS is supported natively (Safari/iOS)
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = hlsFallbackUrl;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(e => console.log('Autoplay prevented:', e));
          setIsLoading(false);
        });
      } else if (typeof window !== 'undefined' && (window as any).Hls) {
        // Use hls.js for other browsers
        const Hls = (window as any).Hls;
        if (Hls.isSupported()) {
          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
          });
          
          hls.loadSource(hlsFallbackUrl);
          hls.attachMedia(video);
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(e => console.log('Autoplay prevented:', e));
            setIsLoading(false);
          });
        }
      }
    };

    // Try WHEP first, fall back to HLS
    startWHEP();

    return () => {
      if (pcRef.current) {
        pcRef.current.close();
      }
      if (hls) {
        hls.destroy();
      }
    };
  }, [whepUrl, hlsFallbackUrl]);

  return (
    <div className={`relative w-full h-full bg-black ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        muted
        autoPlay
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-sm">
              {usingHLS ? 'Loading stream (HLS)...' : 'Connecting via WebRTC...'}
            </p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center text-white p-4">
            <p className="text-red-400 mb-2">Stream Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
