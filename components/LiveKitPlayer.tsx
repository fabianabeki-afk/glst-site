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

  console.log('LiveKitPlayer render - token:', token ? 'present' : 'missing', 'url:', url);

  // Handle video track attachment
  const attachVideoTrack = useCallback((track: any) => {
    console.log('Attaching video track');
    if (videoRef.current) {
      // Don't replace the video element, just attach the media stream
      track.attach(videoRef.current);
      trackRef.current = track;
      
      // Detect video dimensions when metadata loads - only report once
      videoRef.current.onloadedmetadata = () => {
        if (videoRef.current && onVideoDimensions && !dimensionsReported.current) {
          dimensionsReported.current = true;
          const w = videoRef.current.videoWidth;
          const h = videoRef.current.videoHeight;
          console.log('Video dimensions detected:', w, 'x', h, '- orientation:', h > w ? 'portrait' : 'landscape');
          onVideoDimensions(w, h);
        }
      };
    }
    setIsLoading(false);
  }, [onVideoDimensions]);

  useEffect(() => {
    console.log('LiveKitPlayer useEffect - token:', token ? 'present' : 'missing');
    if (!token) {
      console.log('No token provided, skipping connection');
      return;
    }

    const connectToRoom = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const room = new Room({
          adaptiveStream: false,
          dynacast: false,
        });

        roomRef.current = room;

        // Handle incoming video tracks
        room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          console.log('TrackSubscribed event:', track.kind, 'from', participant.identity);
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
        setIsConnected(true);
        console.log('Connected to LiveKit room');
        console.log('Remote participants:', room.remoteParticipants.size);
        
        // Subscribe to all existing tracks from remote participants
        room.remoteParticipants.forEach(participant => {
          console.log('Participant:', participant.identity, 'Tracks:', participant.trackPublications.size);
          participant.trackPublications.forEach(publication => {
            console.log('Subscribing to track:', publication.trackName, 'Kind:', publication.kind);
            publication.setSubscribed(true);
          });
        });

      } catch (err) {
        console.error('LiveKit connection error:', err);
        setError('Failed to connect to stream');
        setIsLoading(false);
      }
    };

    connectToRoom();

    return () => {
      if (trackRef.current) {
        trackRef.current.detach();
      }
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
      setIsConnected(false);
    };
  }, [url, token, attachVideoTrack]);

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