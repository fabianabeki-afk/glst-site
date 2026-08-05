import SwiftUI
import LiveKit
import AVFoundation
import Combine

class LiveKitStreamManager: ObservableObject {
    @Published var isStreaming = false
    @Published var isConnecting = false
    @Published var connectionState: LiveKit.ConnectionState = .disconnected
    @Published var viewerCount = 0
    @Published var streamDuration: String = "00:00:00"
    @Published var trackVersion = 0 // Forces SwiftUI to redraw video view on change
    
    private var room: Room?
    private var token: String = ""
    private var url: String {
        ProcessInfo.processInfo.environment["LIVEKIT_URL"] ?? "wss://guestlist-tv-ei1a8q8r.livekit.cloud"
    }
    private var timer: Timer?
    private var startTime: Date?
    
    private var currentPosition: AVCaptureDevice.Position = .front
    private var currentDeviceType: AVCaptureDevice.DeviceType = .builtInWideAngleCamera
    
    func prepareCameraPreview() async {
        if room == nil {
            room = Room()
        }
        guard let room = room else { return }
        
        let generator = LiveKitTokenGenerator()
        let token = generator.getToken()
        
        if !token.isEmpty && room.connectionState == .disconnected {
            do {
                try await room.connect(url: url, token: token)
            } catch {
                print("LiveKit: Connection error - \(error)")
                return
            }
        }
        
        do {
            let cameraOptions = CameraCaptureOptions(
                deviceType: currentDeviceType,
                position: currentPosition,
                dimensions: Dimensions(width: 1280, height: 720),
                fps: 30
            )
            let _ = try await room.localParticipant.setCamera(enabled: true, captureOptions: cameraOptions)
            let _ = try await room.localParticipant.setMicrophone(enabled: true)
            
            await MainActor.run {
                self.connectionState = .connected
                self.trackVersion += 1
            }
            
            print("LiveKit: Camera preview and connection initialized successfully")
        } catch {
            print("LiveKit: Preview error - \(error)")
        }
    }
    
    func setCameraLens(position: AVCaptureDevice.Position, deviceType: AVCaptureDevice.DeviceType) async {
        guard let room = room else {
            print("LiveKit: Error switching lens - Room is nil")
            return
        }
        
        currentPosition = position
        currentDeviceType = deviceType
        
        print("LiveKit: Recreating camera capture session -> Position: \(position == .front ? "Front" : "Back"), Device: \(deviceType)")
        
        do {
            // 1. Completely remove camera video track publication from the room session
            if let videoTrack = room.localParticipant.firstCameraVideoTrack,
               let publication = room.localParticipant.localVideoTracks.first(where: { $0.track === videoTrack }) {
                try await room.localParticipant.unpublish(publication: publication)
            }
            
            // 2. Allow AVFoundation hardware session to fully release locks
            try await Task.sleep(nanoseconds: 500_000_000)
            
            // 3. Create a brand-new camera track with the desired hardware position and device type
            let cameraOptions = CameraCaptureOptions(
                deviceType: deviceType,
                position: position,
                dimensions: Dimensions(width: 1280, height: 720),
                fps: 30
            )
            let _ = try await room.localParticipant.setCamera(enabled: true, captureOptions: cameraOptions)
            
            await MainActor.run {
                self.trackVersion += 1
            }
            
            print("LiveKit: Successfully created, published new camera lens track, and refreshed view.")
        } catch {
            print("LiveKit: Error switching lens - \(error)")
        }
    }
    
    func connect(withToken: String) async {
        self.token = withToken
        guard !token.isEmpty else { return }
        
        await MainActor.run { isConnecting = true }
        
        do {
            let activeRoom = room ?? Room()
            if activeRoom.connectionState == .disconnected {
                try await activeRoom.connect(url: url, token: token)
            }
            await MainActor.run {
                self.room = activeRoom
                self.isConnecting = false
                self.connectionState = .connected
            }
        } catch {
            await MainActor.run {
                isConnecting = false
                connectionState = .disconnected
            }
        }
    }
    
    func startStreaming() async {
        guard let room = room else { return }
        if room.localParticipant.videoTracks.isEmpty {
            let cameraOptions = CameraCaptureOptions(
                deviceType: currentDeviceType,
                position: currentPosition,
                dimensions: Dimensions(width: 1280, height: 720),
                fps: 30
            )
            _ = try? await room.localParticipant.setCamera(enabled: true, captureOptions: cameraOptions)
            _ = try? await room.localParticipant.setMicrophone(enabled: true)
        }
        await MainActor.run {
            isStreaming = true
            startTimer()
        }
    }
    
    func stopStreaming() async {
        guard let room = room else { return }
        _ = try? await room.localParticipant.setCamera(enabled: false)
        _ = try? await room.localParticipant.setMicrophone(enabled: false)
        await MainActor.run {
            isStreaming = false
            stopTimer()
        }
    }
    
    func disconnect() async {
        await room?.disconnect()
        await MainActor.run {
            room = nil
            isStreaming = false
            isConnecting = false
            connectionState = .disconnected
            stopTimer()
        }
    }
    
    var localVideoTrack: VideoTrack? {
        _ = trackVersion // Explicit dependency injection for SwiftUI observation binding
        return room?.localParticipant.firstCameraVideoTrack
    }
    
    private func startTimer() {
        startTime = Date()
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            guard let startTime = self.startTime else { return }
            let elapsed = Date().timeIntervalSince(startTime)
            let hours = Int(elapsed) / 3600
            let minutes = (Int(elapsed) % 3600) / 60
            let seconds = Int(elapsed) % 60
            self.streamDuration = String(format: "%02d:%02d:%02d", hours, minutes, seconds)
        }
    }
    
    private func stopTimer() {
        timer?.invalidate()
        timer = nil
        startTime = nil
        streamDuration = "00:00:00"
    }
    
    deinit {
        timer?.invalidate()
    }
}
