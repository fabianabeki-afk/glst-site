import SwiftUI
import WebRTC

struct WebRTCVideoPreview: UIViewRepresentable {
    let videoTrack: RTCVideoTrack
    
    func makeUIView(context: Context) -> WebRTCVideoView {
        return WebRTCVideoView(videoTrack: videoTrack)
    }
    
    func updateUIView(_ uiView: WebRTCVideoView, context: Context) {
        // Update if needed
    }
}
