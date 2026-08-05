'use client';

import { useEffect, useRef, useState } from 'react';

interface CloudflareHLSPlayerProps {
  hlsUrl: string;
  autoplay?: boolean;
}

export default function CloudflareHLSPlayer({ hlsUrl, autoplay = true }: CloudflareHLSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hlsUrl || !videoRef.current) return;

    let mounted = true;
    setIsConnected(false);
    setError(null);

    const video = videoRef.current;
    
    // Use native HLS on Safari, HLS.js on other browsers
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isSafari || video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = hlsUrl;
      video.addEventListener('loadedmetadata', () => {
        if (mounted) setIsConnected(true);
      });
    } else {
      // Use HLS.js for other browsers
      import('hls.js').then((HlsModule) => {
        const Hls = HlsModule.default;
        if (Hls.isSupported() && video) {
          const hls = new Hls({
            maxBufferLength: 30,
            liveSyncDurationCount: 3,
          });
          
          hls.loadSource(hlsUrl);
          hls.attachMedia(video);
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (mounted) setIsConnected(true);
            if (autoplay) video.play().catch(() => {});
          });
          
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal && mounted) {
              setError('Stream error: ' + data.type);
            }
          });
          
          return () => {
            hls.destroy();
          };
        }
      }).catch(() => {
        if (mounted) setError('Failed to load HLS player');
      });
    }

    return () => {
      mounted = false;
    };
  }, [hlsUrl, autoplay]);

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
        <div className="absolute top-4 left-4 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
          ● LIVE
        </div>
      )}
    </div>
  );
}
