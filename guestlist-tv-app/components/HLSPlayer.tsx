import React, { useEffect, useRef, useState } from 'react';

interface HLSPlayerProps {
  streamUrl: string;
  djName?: string;
  isLive?: boolean;
}

export default function HLSPlayer({ streamUrl, djName = "DJ", isLive = true }: HLSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Use native HLS playback (Safari supports HLS natively)
    // For other browsers, you might need hls.js
    video.src = streamUrl;
    video.play().catch(err => {
      console.log('Auto-play prevented, waiting for user interaction');
    });

    const handleLoad = () => {
      setLoading(false);
      setError(null);
    };

    const handleError = () => {
      setError('Stream unavailable');
      setLoading(false);
    };

    video.addEventListener('loadedmetadata', handleLoad);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoad);
      video.removeEventListener('error', handleError);
      video.src = '';
    };
  }, [streamUrl]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading stream...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-white text-center">
            <p className="text-red-400 mb-2">{error}</p>
            <p className="text-sm opacity-60">Stream will appear when DJ goes live</p>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        muted
        autoPlay
        controls
      />
      
      {isLive && !error && !loading && (
        <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
          <span className="animate-pulse">●</span>
          LIVE
        </div>
      )}
      
      <div className="absolute bottom-4 left-4 text-white bg-black/50 px-3 py-1 rounded">
        {djName}
      </div>
    </div>
  );
}