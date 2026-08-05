import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface HLSStreamPlayerProps {
  src: string;
  className?: string;
}

export default function HLSStreamPlayer({ src, className = '' }: HLSStreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      
      hls.loadSource(src);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(e => console.log('Autoplay prevented:', e));
      });

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(e => console.log('Autoplay prevented:', e));
      });
    }
  }, [src]);

  return (
    <video
      ref={videoRef}
      className={className}
      controls
      playsInline
      muted
      style={{ width: '100%', height: '100%' }}
    />
  );
}
