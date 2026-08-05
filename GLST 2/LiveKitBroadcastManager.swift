import Foundation
import LiveKit
import Combine

/// LiveKit Broadcast Manager - Handles streaming to LiveKit Cloud
class LiveKitBroadcastManager: ObservableObject {
    @Published var isConnected = false
    @Published var isPublishing = false
    @Published var connectionState: ConnectionState = .disconnected
    
    private var room: Room?
    private var token: String
    private let url: String
    
    init(url: String = "wss://guestlist-tv-eila8q8r.livekit.cloud", 
         token: String = "") {
        self.url = url
        self.token = token
    }
    
    /// Update token (call this after getting fresh token from server)
    func updateToken(_ newToken: String) {
        self.token = newToken
    }
    
    /// Connect to LiveKit room
    func connect() async {
        guard !token.isEmpty else {
            print("LiveKit: No token provided")
            return
        }
        
        do {
            let room = Room()
            
            try await room.connect(url: url, token: token)
            
            await MainActor.run {
                self.room = room
                self.isConnected = true
                self.connectionState = .connected
            }
            
            print("LiveKit: Connected to room")
            
        } catch {
            print("LiveKit: Connection error - \(error)")
            await MainActor.run {
                self.connectionState = .disconnected
            }
        }
    }
    
    /// Start broadcasting camera and microphone
    func startBroadcasting() async {
        guard let room = room else {
            print("LiveKit: Not connected")
            return
        }
        
        do {
            // Enable camera with good quality
            let cameraOptions = CameraCaptureOptions(
                dimensions: Dimensions(width: 1080, height: 1920), // Portrait 1080p
                fps: 30
            )
            let _ = try await room.localParticipant.setCamera(enabled: true, captureOptions: cameraOptions)
            
            // Enable microphone
            let _ = try await room.localParticipant.setMicrophone(enabled: true)
            
            await MainActor.run {
                self.isPublishing = true
            }
            
            print("LiveKit: Broadcasting started")
            
        } catch {
            print("LiveKit: Publishing error - \(error)")
        }
    }
    
    /// Stop broadcasting but keep connection
    func stopBroadcasting() async {
        guard let room = room else { return }
        
        let _ = try? await room.localParticipant.setCamera(enabled: false)
        let _ = try? await room.localParticipant.setMicrophone(enabled: false)
        
        await MainActor.run {
            self.isPublishing = false
        }
        
        print("LiveKit: Broadcasting stopped")
    }
    
    /// Disconnect from room
    func disconnect() async {
        await room?.disconnect()
        
        await MainActor.run {
            self.room = nil
            self.isConnected = false
            self.isPublishing = false
            self.connectionState = .disconnected
        }
        
        print("LiveKit: Disconnected")
    }
    
    /// Get local video track for preview
    var localVideoTrack: VideoTrack? {
        // In LiveKit v2, access tracks differently
        room?.localParticipant.firstCameraVideoTrack
    }
}
