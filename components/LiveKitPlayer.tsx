import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';

interface LiveKitPlayerProps {
  url: string;
  token: string;
  className?: string;
  onVideoDimensions?: (width: number, height: number) => void;
}

export default function LiveKitPlayer({ url, token, className = '', onVideoDimensions }: LiveKitPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const roomRef = useRef<Room | null>(null);
  const trackRef = useRef<any>(null);
  const dimensionsReported = useRef(false);
  const onVideoDimensionsRef = useRef(onVideoDimensions);

  // Keep ref in sync without triggering re-renders
  onVideoDimensionsRef.current = onVideoDimensions;

  // Handle video track attachment - stable callback, no dependencies
  const attachVideoTrack = useCallback((track: any) => {
    if (videoRef.current) {
      track.attach(videoRef.current);
      trackRef.current = track;
      
      // Detect video dimensions when metadata loads - only report once
      videoRef.current.onloadedmetadata = () => {
        if (videoRef.current && onVideoDimensionsRef.current && !dimensionsReported.current) {
          dimensionsReported.current = true;
          const w = videoRef.current.videoWidth;
          const h = videoRef.current.videoHeight;
          onVideoDimensionsRef.current(w, h);
        }
      };
    }
    setIsLoading(false);
  }, []); // NO dependencies - stable forever

  useEffect(() => {
    if (!token || !url) {
      return;
    }

    // Prevent reconnection while already connected to same room
    if (roomRef.current?.state === 'connected') {
      return;
    }

    let cancelled = false;

    const connectToRoom = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const room = new Room({
          adaptiveStream: false,
          dynacast: false,
          // Quality improvements
          publishDefaults: {
            videoCodec: 'h264',  // Better browser compatibility than VP8
            videoEncoding: {
              maxBitrate: 2_500_000,  // 2.5 Mbps for 1080p
              maxFramerate: 30,
            },
            screenShareEncoding: {
              maxBitrate: 5_000_000,  // 5 Mbps for screen share
              maxFramerate: 30,
            },
          },
          // Subscribe to highest quality available
          videoCaptureDefaults: {
            resolution: { width: 1920, height: 1080 },
          },
        });

        roomRef.current = room;

        // Handle incoming video tracks
        room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          if (track.kind === Track.Kind.Video) {
            attachVideoTrack(track);
          }
        });

        // Handle participant connected - subscribe to their tracks
        room.on(RoomEvent.ParticipantConnected, (participant) => {
          participant.trackPublications.forEach(publication => {
            publication.setSubscribed(true);
          });
        });

        // Handle disconnected tracks
        room.on(RoomEvent.TrackUnsubscribed, (track) => {
          track.detach();
        });

        // Connect to room
        await room.connect(url, token);
        if (cancelled) return;
        setIsConnected(true);
        
        // Subscribe to all existing tracks from remote participants
        room.remoteParticipants.forEach(participant => {
          participant.trackPublications.forEach(publication => {
            publication.setSubscribed(true);
          });
        });

      } catch (err) {
        if (cancelled) return;
        setError('Failed to connect to stream');
        setIsLoading(false);
      }
    };

    connectToRoom();

    return () => {
      cancelled = true;
      if (trackRef.current) {
        trackRef.current.detach();
        trackRef.current = null;
      }
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
      setIsConnected(false);
    };
  }, [url, token]); // ONLY url and token - no attachVideoTrack

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm">Connecting to stream...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-white text-center p-4">
            <p className="text-red-400 mb-2">⚠️ {error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-contain"
        style={{ backgroundColor: '#000', willChange: 'transform' }}
      />
      
      {isConnected && (
        <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
          ● LIVE
        </div>
      )}
    </div>
  );
}