import React, { useEffect, useRef } from 'react';

interface HLSPlayerProps {
  streamUrl: string;
}

export default function HLSPlayer({ streamUrl }: HLSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.src = streamUrl;
    video.play().catch(err => console.log('Autoplay prevented'));
  }, [streamUrl]);

  return (
    <video
      ref={videoRef}
      className="w-full aspect-video"
      playsInline
      muted
      autoPlay
      controls
    />
  );
}
