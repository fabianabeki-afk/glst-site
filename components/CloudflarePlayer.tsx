import React from 'react';

interface CloudflarePlayerProps {
  streamId: string;
  className?: string;
}

export default function CloudflarePlayer({ streamId, className = '' }: CloudflarePlayerProps) {
  const iframeUrl = `https://customer-xfdlafmmuylrdexv.cloudflarestream.com/${streamId}/iframe`;
  
  return (
    <div className={`relative w-full h-full ${className}`}>
      <iframe
        src={iframeUrl}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen
        frameBorder="0"
      />
    </div>
  );
}
