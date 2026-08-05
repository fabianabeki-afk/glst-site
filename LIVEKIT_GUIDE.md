# LiveKit Integration Guide for GLST

## Overview
Replace WHIP/RTMP with LiveKit for reliable streaming to guestlist.tv

## 1. LiveKit Setup

### Create Account
1. Go to https://cloud.livekit.io
2. Create account
3. Create new project
4. Note down:
   - Project URL: `wss://your-project.livekit.cloud`
   - API Key
   - API Secret

### Generate Token
You'll need a token to authenticate streaming:
```bash
# Install livekit-cli
npm install -g livekit-cli

# Generate token
livekit-cli create-token \
  --api-key YOUR_API_KEY \
  --api-secret YOUR_API_SECRET \
  --join \
  --room "dj-fabian-stream" \
  --identity "ios-broadcaster" \
  --valid-for "24h"
```

## 2. iOS Integration

### Add SDK
In Xcode: File → Add Packages → `https://github.com/livekit/client-sdk-swift`

### Basic Broadcasting Code
```swift
import LiveKit
import SwiftUI

class BroadcastManager: ObservableObject {
    private var room: Room?
    @Published var isConnected = false
    @Published var isPublishing = false
    
    let url = "wss://your-project.livekit.cloud"
    let token = "your-generated-token"
    
    func connect() async {
        do {
            let room = Room()
            try await room.connect(url: url, token: token)
            
            await MainActor.run {
                self.room = room
                self.isConnected = true
            }
            
            print("Connected to LiveKit room")
        } catch {
            print("Connection error: \(error)")
        }
    }
    
    func startBroadcasting() async {
        guard let room = room else { return }
        
        do {
            // Enable camera and microphone
            try await room.localParticipant.setCamera(enabled: true)
            try await room.localParticipant.setMicrophone(enabled: true)
            
            await MainActor.run {
                isPublishing = true
            }
            
            print("Started broadcasting")
        } catch {
            print("Publishing error: \(error)")
        }
    }
    
    func stopBroadcasting() {
        Task {
            await room?.localParticipant.setCamera(enabled: false)
            await room?.localParticipant.setMicrophone(enabled: false)
            
            await MainActor.run {
                isPublishing = false
            }
        }
    }
    
    func disconnect() {
        Task {
            await room?.disconnect()
            await MainActor.run {
                isConnected = false
                isPublishing = false
            }
        }
    }
}
```

### SwiftUI View
```swift
struct LiveKitBroadcastView: View {
    @StateObject private var broadcastManager = BroadcastManager()
    
    var body: some View {
        VStack {
            // Video preview
            VideoView(
                participant: broadcastManager.room?.localParticipant,
                videoTrack: broadcastManager.room?.localParticipant.cameraTrack
            )
            .aspectRatio(9/16, contentMode: .fit)
            
            // Controls
            HStack {
                Button(action: {
                    Task {
                        await broadcastManager.connect()
                    }
                }) {
                    Text("Connect")
                }
                .disabled(broadcastManager.isConnected)
                
                Button(action: {
                    Task {
                        await broadcastManager.startBroadcasting()
                    }
                }) {
                    Text("Go Live")
                }
                .disabled(!broadcastManager.isConnected || broadcastManager.isPublishing)
                .background(broadcastManager.isPublishing ? Color.red : Color.green)
                
                Button(action: {
                    broadcastManager.stopBroadcasting()
                }) {
                    Text("Stop")
                }
                .disabled(!broadcastManager.isPublishing)
            }
        }
    }
}
```

## 3. Web App Integration

### Install SDK
```bash
npm install livekit-client
```

### Playback Code
```typescript
import { Room } from 'livekit-client';

async function startPlayback() {
  const room = new Room();
  
  // Connect with viewer token
  await room.connect('wss://your-project.livekit.cloud', viewerToken);
  
  // Handle incoming tracks
  room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
    if (track.kind === Track.Kind.Video) {
      // Attach to video element
      track.attach(document.getElementById('video-element'));
    }
  });
}
```

## 4. Backend Token Generation

### API Endpoint
```typescript
import { AccessToken } from 'livekit-server-sdk';

// Generate broadcaster token
function createBroadcasterToken(roomName: string, userId: string) {
  const token = new AccessToken(API_KEY, API_SECRET, {
    identity: userId,
    name: 'DJ Fabian',
  });
  
  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: false,
  });
  
  return token.toJwt();
}

// Generate viewer token
function createViewerToken(roomName: string, userId: string) {
  const token = new AccessToken(API_KEY, API_SECRET, {
    identity: userId,
    name: 'Viewer',
  });
  
  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: false,
    canSubscribe: true,
  });
  
  return token.toJwt();
}
```

## 5. Benefits Over WHIP/RTMP

✅ **Simpler API** - No complex SDP negotiation
✅ **Automatic Reconnection** - Built-in resilience
✅ **Better Error Handling** - Clear error messages
✅ **Room Management** - Built-in presence, metadata
✅ **Adaptive Bitrate** - Automatic quality adjustment
✅ **Simulcast** - Multiple quality layers
✅ **Screen Sharing** - Easy to add later

## Next Steps

1. Set up LiveKit Cloud account
2. Get API credentials
3. Integrate iOS SDK
4. Add web playback
5. Test end-to-end

Need help with any specific step?
