import UIKit
import WebRTC

class WebRTCVideoView: UIView {
    private var videoTrack: RTCVideoTrack?
    private var renderer: UIView?
    
    init(videoTrack: RTCVideoTrack) {
        self.videoTrack = videoTrack
        super.init(frame: .zero)
        setupRenderer()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
    }
    
    private func setupRenderer() {
        // Use RTCMTLVideoView for Metal rendering (iOS 9+)
        if #available(iOS 9.0, *) {
            let metalRenderer = RTCMTLVideoView(frame: bounds)
            // Use scaleAspectFill to fill entire frame (no black bars)
            metalRenderer.contentMode = .scaleAspectFill
            metalRenderer.videoContentMode = .scaleAspectFill
            addSubview(metalRenderer)
            renderer = metalRenderer
            videoTrack?.add(metalRenderer)
            print("GLST: Created Metal video renderer with frame: \(bounds)")
        } else {
            // Fallback to RTCEAGLVideoView for older iOS
            let eglRenderer = RTCEAGLVideoView(frame: bounds)
            eglRenderer.contentMode = .scaleAspectFill
            addSubview(eglRenderer)
            renderer = eglRenderer
            videoTrack?.add(eglRenderer)
            print("GLST: Created EGL video renderer with frame: \(bounds)")
        }
    }
    
    override func layoutSubviews() {
        super.layoutSubviews()
        renderer?.frame = bounds
        print("GLST: Layout updated, renderer frame: \(bounds)")
    }
}
