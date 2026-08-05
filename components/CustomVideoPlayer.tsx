import React, { useEffect, useRef } from 'react';

interface CustomVideoPlayerProps {
  hlsUrl: string;
  className?: string;
}

export default function CustomVideoPlayer({ hlsUrl, className = '' }: CustomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: any = null;

    // Check if HLS is supported natively (Safari/iOS)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(e => console.log('Autoplay prevented:', e));
      });
    } else if (typeof window !== 'undefined' && (window as any).Hls) {
      // Use hls.js for other browsers
      const Hls = (window as any).Hls;
      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(e => console.log('Autoplay prevented:', e));
        });
      }
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [hlsUrl]);

  return (
    <div ref={containerRef} className={`relative w-full h-full bg-black ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        playsInline
        muted
        autoPlay
      />
      
      {/* Custom overlay for DJ info */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
        <span className="text-white text-xs font-bold">🔴 LIVE</span>
      </div>
    </div>
  );
}
