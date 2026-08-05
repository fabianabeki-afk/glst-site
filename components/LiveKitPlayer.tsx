import React, { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, VideoTrack, Track } from 'livekit-client';

interface LiveKitPlayerProps {
  url: string;
  token: string;
  className?: string;
}

export default function LiveKitPlayer({ url, token, className = '' }: LiveKitPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const roomRef = useRef<Room | null>(null);

  console.log('LiveKitPlayer render - token:', token ? 'present' : 'missing', 'url:', url);

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
          adaptiveStream: true,
          dynacast: true,
        });

        roomRef.current = room;

        // Handle incoming video tracks
        room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          console.log('TrackSubscribed event:', track.kind, 'from', participant.identity);
          if (track.kind === Track.Kind.Video) {
            console.log('Attaching video track');
            const videoElement = track.attach();
            videoElement.className = 'w-full h-full object-contain';
            
            if (containerRef.current) {
              // Clear previous content
              containerRef.current.innerHTML = '';
              containerRef.current.appendChild(videoElement);
            }
            
            setIsLoading(false);
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
      if (roomRef.current) {
        roomRef.current.disconnect();
        setIsConnected(false);
      }
    };
  }, [url, token]);

  return (
    <div className={`relative w-full h-full bg-black ${className}`}>
      {/* Video Container */}
      <div 
        ref={containerRef} 
        className="w-full h-full flex items-center justify-center"
      >
        {isLoading && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-sm">Connecting to stream...</p>
          </div>
        )}
      </div>

      {/* Status Overlay */}
      {isConnected && !isLoading && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-white text-xs font-medium">LIVE</span>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white p-4">
            <div className="text-red-400 mb-2">⚠️ Stream Error</div>
            <p className="text-sm">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
