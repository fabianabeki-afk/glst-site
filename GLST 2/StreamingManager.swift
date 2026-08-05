import Foundation
import WebRTC
import AVFoundation
import Combine

/// Represents a discoverable camera on the device
struct CameraOption: Identifiable, Equatable {
    let id = UUID()
    let name: String
    let device: AVCaptureDevice
    let position: AVCaptureDevice.Position
}

class StreamManager: NSObject, ObservableObject {
    // MARK: - Published Properties
    @Published var currentBitrate: String = "0.00 Mbps"
    @Published var streamDuration: String = "00:00"
    @Published var isLive: Bool = false
    @Published var connectionState: String = "Disconnected"
    
    // MARK: - WebRTC Components
    private var peerConnection: RTCPeerConnection?
    var factory: RTCPeerConnectionFactory?
    private var localVideoTrack: RTCVideoTrack?
    private var localAudioTrack: RTCAudioTrack?
    
    @Published var previewVideoTrack: RTCVideoTrack? {
        didSet {
            if previewVideoTrack != nil {
                print("GLST: Preview track now available")
            }
        }
    }
    
    private var videoSource: RTCVideoSource?
    private var audioSource: RTCAudioSource?
    private var videoCapturer: RTCCameraVideoCapturer?
    private var capturer: RTCCameraVideoCapturer? { return videoCapturer }
    
    private var streamStartTime: Date?
    private var timer: Timer?
    private var lastBytesSent: Int64 = 0
    
    private var iceServers: [RTCIceServer] = []
    private var whipEndpointUrl: String?
    private var streamKey: String?
    
    override init() {
        super.init()
        
        let encoderFactory = RTCDefaultVideoEncoderFactory()
        let decoderFactory = RTCDefaultVideoDecoderFactory()
        
        if let h264 = encoderFactory.supportedCodecs().first(where: { $0.name == "H264" }) {
            encoderFactory.preferredCodec = h264
            print("GLST: Using H264 hardware encoding")
        }
        
        self.factory = RTCPeerConnectionFactory(encoderFactory: encoderFactory, decoderFactory: decoderFactory)
        print("GLST: WebRTC factory initialized")
    }
    
    // MARK: - Streaming Control
    func startCapture() {
        guard localVideoTrack == nil else {
            print("GLST: Capture already initialized, skipping")
            return
        }
        
        print("GLST: startCapture() called")
        guard let factory = factory else {
            print("GLST: Factory not initialized")
            return
        }
        
        // Create video source and track
        let videoSource = factory.videoSource()
        self.videoSource = videoSource
        
        let videoCapturer = RTCCameraVideoCapturer(delegate: videoSource)
        self.videoCapturer = videoCapturer
        
        self.localVideoTrack = factory.videoTrack(with: videoSource, trackId: "video0")
        self.localVideoTrack?.isEnabled = true
        self.previewVideoTrack = self.localVideoTrack
        print("GLST: Video track created and published")
        
        // Create audio
        let audioSource = factory.audioSource(with: nil)
        self.audioSource = audioSource
        self.localAudioTrack = factory.audioTrack(with: audioSource, trackId: "audio0")
        print("GLST: Audio track created")
        
        // Configure audio session
        let audioSession = AVAudioSession.sharedInstance()
        do {
            try audioSession.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker])
            try audioSession.setActive(true)
            print("GLST: Audio session configured")
        } catch {
            print("GLST: Failed to configure audio session: \(error)")
        }
        
        // Start with front camera (better for DJ streaming)
        startCameraCapture(position: .front)
        
        print("GUESTLIST: Studio Engine is officially RUNNING")
    }
    
    private func startCameraCapture(position: AVCaptureDevice.Position) {
        guard let videoCapturer = videoCapturer else { return }
        
        let devices = RTCCameraVideoCapturer.captureDevices()
        guard let camera = devices.first(where: { $0.position == position }) ?? devices.first else {
            print("GLST: Could not find camera")
            return
        }
        
        let formats = RTCCameraVideoCapturer.supportedFormats(for: camera)
        let preferredFormat = formats.first { format in
            let dimensions = CMVideoFormatDescriptionGetDimensions(format.formatDescription)
            return dimensions.width == 1280 && dimensions.height == 720
        } ?? formats.first { format in
            let dimensions = CMVideoFormatDescriptionGetDimensions(format.formatDescription)
            return dimensions.width >= 1280
        } ?? formats.last
        
        if let format = preferredFormat {
            let fps = min(30, format.videoSupportedFrameRateRanges.first?.maxFrameRate ?? 30)
            videoCapturer.startCapture(with: camera, format: format, fps: Int(fps))
            let dimensions = CMVideoFormatDescriptionGetDimensions(format.formatDescription)
            print("GLST: Camera capture started: \(dimensions.width)x\(dimensions.height) @\(fps)fps")
        }
        
        // Landscape orientation
        if #available(iOS 17.0, *) {
            if let connection = videoCapturer.captureSession.connections.first(where: { $0.isVideoRotationAngleSupported(90) }) {
                connection.videoRotationAngle = 90
            }
        } else {
            if let connection = videoCapturer.captureSession.connections.first(where: { $0.isVideoOrientationSupported }) {
                connection.videoOrientation = .landscapeRight
            }
        }
    }
    
    func connectAndPublish(whipUrl: String, streamData: [String: Any]) {
        print("GLST: connectAndPublish called")
        
        guard let factory = factory else { return }
        
        if localVideoTrack == nil {
            print("GLST: Video track not ready - starting capture")
            startCapture()
        }
        
        guard localVideoTrack != nil else {
            print("GLST: Video track still not initialized!")
            return
        }
        
        self.whipEndpointUrl = whipUrl
        
        if let key = streamData["uid"] as? String {
            self.streamKey = key
        } else if let key = streamData["streamKey"] as? String {
            self.streamKey = key
        }
        
        // ICE servers
        if let iceServersData = streamData["ice_servers"] as? [[String: Any]] {
            var servers: [RTCIceServer] = []
            for iceServerDict in iceServersData {
                if let urls = iceServerDict["urls"] as? [String] {
                    let username = iceServerDict["username"] as? String ?? ""
                    let credential = iceServerDict["credential"] as? String ?? ""
                    servers.append(RTCIceServer(urlStrings: urls, username: username, credential: credential))
                } else if let url = iceServerDict["urls"] as? String {
                    let username = iceServerDict["username"] as? String ?? ""
                    let credential = iceServerDict["credential"] as? String ?? ""
                    servers.append(RTCIceServer(urlStrings: [url], username: username, credential: credential))
                }
            }
            self.iceServers = servers
        }
        
        // Create peer connection
        let config = RTCConfiguration()
        config.iceServers = iceServers.isEmpty ? [RTCIceServer(urlStrings: ["stun:stun.l.google.com:19302"])] : iceServers
        config.sdpSemantics = .unifiedPlan
        
        let constraints = RTCMediaConstraints(mandatoryConstraints: nil, optionalConstraints: nil)
        
        guard let peerConnection = factory.peerConnection(with: config, constraints: constraints, delegate: self) else {
            print("GLST: Failed to create peer connection")
            return
        }
        
        self.peerConnection = peerConnection
        
        if let videoTrack = localVideoTrack {
            peerConnection.add(videoTrack, streamIds: ["stream"])
        }
        if let audioTrack = localAudioTrack {
            peerConnection.add(audioTrack, streamIds: ["stream"])
        }
        
        // Create offer
        let offerConstraints = RTCMediaConstraints(mandatoryConstraints: [
            kRTCMediaConstraintsOfferToReceiveAudio: kRTCMediaConstraintsValueFalse,
            kRTCMediaConstraintsOfferToReceiveVideo: kRTCMediaConstraintsValueFalse
        ], optionalConstraints: nil)
        
        peerConnection.offer(for: offerConstraints) { [weak self] sdp, error in
            guard let self = self else { return }
            
            if let error = error {
                print("GLST: Failed to create offer: \(error)")
                return
            }
            
            guard let sdp = sdp else {
                print("GLST: No SDP generated")
                return
            }
            
            peerConnection.setLocalDescription(sdp) { error in
                if let error = error {
                    print("GLST: Failed to set local description: \(error)")
                    return
                }
                
                print("GLST: Local description set")
                self.sendOfferToWHIP(sdp: sdp.sdp)
            }
        }
    }
    
    private func sendOfferToWHIP(sdp: String) {
        guard let whipUrl = whipEndpointUrl else { return }
        guard let url = URL(string: whipUrl) else {
            print("GLST: Invalid WHIP URL")
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/sdp", forHTTPHeaderField: "Content-Type")
        
        // Note: Cloudflare WHIP uses URL-based auth, no Authorization header needed
        request.httpBody = sdp.data(using: .utf8)
        
        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            if let error = error {
                print("GLST: WHIP request failed: \(error)")
                return
            }
            
            guard let httpResponse = response as? HTTPURLResponse else {
                print("GLST: Invalid response")
                return
            }
            
            print("GLST: WHIP response status: \(httpResponse.statusCode)")
            
            if httpResponse.statusCode == 200 || httpResponse.statusCode == 201 {
                guard let data = data, let answerSDP = String(data: data, encoding: .utf8) else {
                    print("GLST: No SDP answer received")
                    return
                }
                
                print("GLST: Received SDP answer")
                
                let answer = RTCSessionDescription(type: .answer, sdp: answerSDP)
                self?.peerConnection?.setRemoteDescription(answer) { error in
                    if let error = error {
                        print("GLST: Failed to set remote description: \(error)")
                    } else {
                        print("GLST: Remote description set - Stream LIVE!")
                        DispatchQueue.main.async {
                            self?.isLive = true
                        }
                    }
                }
            } else {
                print("GLST: WHIP endpoint returned \(httpResponse.statusCode)")
            }
        }.resume()
    }
    
    func stopStreaming() {
        timer?.invalidate()
        timer = nil
        
        videoCapturer?.stopCapture()
        peerConnection?.close()
        peerConnection = nil
        
        localVideoTrack = nil
        previewVideoTrack = nil
        localAudioTrack = nil
        videoSource = nil
        audioSource = nil
        videoCapturer = nil
        
        isLive = false
        streamStartTime = nil
        connectionState = "Disconnected"
        currentBitrate = "0.00 Mbps"
        streamDuration = "00:00"
        whipEndpointUrl = nil
        
        print("GLST: Stream stopped")
    }
    
    // MARK: - Camera Switching
    
    func discoverAvailableCameras() -> [CameraOption] {
        // Use AVCaptureDevice directly for accurate discovery
        let discoverySession = AVCaptureDevice.DiscoverySession(
            deviceTypes: [
                .builtInTripleCamera,
                .builtInDualCamera,
                .builtInDualWideCamera,
                .builtInWideAngleCamera,
                .builtInUltraWideCamera,
                .builtInTelephotoCamera,
                .builtInTrueDepthCamera,
            ],
            mediaType: .video,
            position: .unspecified
        )
        
        return discoverySession.devices.map { device in
            let displayName: String
            let position = device.position
            
            // Use position first, then device type for accurate naming
            switch position {
            case .front:
                displayName = "Front Camera"
            case .back:
                switch device.deviceType {
                case .builtInTripleCamera:
                    displayName = "Back Triple Camera"
                case .builtInDualCamera, .builtInDualWideCamera:
                    displayName = "Back Dual Camera"
                case .builtInUltraWideCamera:
                    displayName = "Back Ultra Wide"
                case .builtInTelephotoCamera:
                    displayName = "Back Telephoto"
                case .builtInWideAngleCamera:
                    displayName = "Back Wide Camera"
                default:
                    displayName = "Back Camera"
                }
            case .unspecified:
                displayName = device.localizedName
            @unknown default:
                displayName = device.localizedName
            }
            
            return CameraOption(
                name: displayName,
                device: device,
                position: position
            )
        }
    }
    
    func switchToCamera(_ cameraOption: CameraOption) {
        guard let videoCapturer = videoCapturer else {
            print("GLST: No video capturer available")
            return
        }
        
        videoCapturer.stopCapture()
        
        let device = cameraOption.device
        let formats = RTCCameraVideoCapturer.supportedFormats(for: device)
        
        let preferredFormat = formats.first { format in
            let dimensions = CMVideoFormatDescriptionGetDimensions(format.formatDescription)
            return dimensions.width == 1280 && dimensions.height == 720
        } ?? formats.first { format in
            let dimensions = CMVideoFormatDescriptionGetDimensions(format.formatDescription)
            return dimensions.width >= 1280
        } ?? formats.last
        
        guard let format = preferredFormat else {
            print("GLST: No formats available for \(cameraOption.name)")
            return
        }
        
        let fps = min(30, format.videoSupportedFrameRateRanges.first?.maxFrameRate ?? 30)
        
        videoCapturer.startCapture(with: device, format: format, fps: Int(fps))
        
        let dimensions = CMVideoFormatDescriptionGetDimensions(format.formatDescription)
        print("GLST: Switched to \(cameraOption.name): \(dimensions.width)x\(dimensions.height) @\(fps)fps")
        
        // Orientation
        if #available(iOS 17.0, *) {
            if let connection = videoCapturer.captureSession.connections.first(where: { $0.isVideoRotationAngleSupported(90) }) {
                connection.videoRotationAngle = 90
            }
        } else {
            if let connection = videoCapturer.captureSession.connections.first(where: { $0.isVideoOrientationSupported }) {
                connection.videoOrientation = .landscapeRight
            }
        }
        
        // Refresh preview
        DispatchQueue.main.async {
            self.previewVideoTrack = nil
            self.previewVideoTrack = self.localVideoTrack
        }
    }
    
    func toggleFrontBackCamera() {
        let devices = discoverAvailableCameras()
        
        guard let currentDevice = videoCapturer?.captureSession.inputs.first as? AVCaptureDeviceInput else {
            if let front = devices.first(where: { $0.position == .front }) {
                switchToCamera(front)
            }
            return
        }
        
        let targetPosition: AVCaptureDevice.Position = currentDevice.device.position == .front ? .back : .front
        
        if let targetCamera = devices.first(where: { $0.position == targetPosition }) {
            switchToCamera(targetCamera)
        }
    }
    
    // MARK: - Monitoring
    private func startMonitoring() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self = self, let startTime = self.streamStartTime else { return }
            
            let elapsed = Date().timeIntervalSince(startTime)
            let minutes = Int(elapsed) / 60
            let seconds = Int(elapsed) % 60
            self.streamDuration = String(format: "%02d:%02d", minutes, seconds)
            
            self.updateBitrate()
        }
    }
    
    private func updateBitrate() {
        peerConnection?.statistics { [weak self] report in
            guard let self = self else { return }
            
            var totalBytesSent: Int64 = 0
            let totalBytesSentBefore = self.lastBytesSent
            
            for (_, stat) in report.statistics {
                if stat.type == "outbound-rtp" {
                    if let bytesSent = stat.values["bytesSent"] as? Int64 {
                        totalBytesSent += bytesSent
                    }
                }
            }
            
            self.lastBytesSent = totalBytesSent
            let bytesDiff = totalBytesSent - totalBytesSentBefore
            let bitrateMbps = Double(bytesDiff) * 8.0 / 1_000_000.0
            
            DispatchQueue.main.async {
                if bitrateMbps < 1.0 {
                    self.currentBitrate = String(format: "%.2f Kbps", bitrateMbps * 1000)
                } else {
                    self.currentBitrate = String(format: "%.2f Mbps", bitrateMbps)
                }
            }
        }
    }
}

// MARK: - RTCPeerConnectionDelegate
extension StreamManager: RTCPeerConnectionDelegate {
    func peerConnection(_ peerConnection: RTCPeerConnection, didChange stateChanged: RTCSignalingState) {
        DispatchQueue.main.async {
            self.connectionState = "Signaling: \(stateChanged)"
        }
    }
    
    func peerConnection(_ peerConnection: RTCPeerConnection, didAdd stream: RTCMediaStream) {
        print("GLST: Media stream added")
    }
    
    func peerConnection(_ peerConnection: RTCPeerConnection, didRemove stream: RTCMediaStream) {
        print("GLST: Media stream removed")
    }
    
    func peerConnectionShouldNegotiate(_ peerConnection: RTCPeerConnection) {
        print("GLST: Should negotiate")
    }
    
    func peerConnection(_ peerConnection: RTCPeerConnection, didChange newState: RTCIceConnectionState) {
        DispatchQueue.main.async {
            print("GLST: ICE state: \(newState)")
            switch newState {
            case .connected:
                self.connectionState = "Connected"
                self.isLive = true
                self.streamStartTime = Date()
                self.startMonitoring()
                print("GLST: ICE connected - LIVE!")
            case .completed:
                self.connectionState = "Completed"
                self.isLive = true
            case .failed, .disconnected, .closed:
                self.connectionState = "\(newState)"
                self.isLive = false
            default:
                self.connectionState = "\(newState)"
            }
        }
    }
    
    func peerConnection(_ peerConnection: RTCPeerConnection, didChange newState: RTCIceGatheringState) {
        print("GLST: ICE gathering: \(newState)")
    }
    
    func peerConnection(_ peerConnection: RTCPeerConnection, didGenerate candidate: RTCIceCandidate) {
        // Auto-trickle or store candidates
    }
    
    func peerConnection(_ peerConnection: RTCPeerConnection, didRemove candidates: [RTCIceCandidate]) {}
    
    func peerConnection(_ peerConnection: RTCPeerConnection, didOpen dataChannel: RTCDataChannel) {
        print("GLST: Data channel opened")
    }
}
