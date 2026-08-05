import UIKit
import AVFoundation

class CameraPreviewUIViewController: UIViewController {
    var captureSession: AVCaptureSession?
    private var previewLayer: AVCaptureVideoPreviewLayer?
    
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        setupPreviewLayer()
    }
    
    private func setupPreviewLayer() {
        if let session = captureSession {
            let layer = AVCaptureVideoPreviewLayer(session: session)
            layer.videoGravity = .resizeAspectFill // Fills the container completely without black bars
            view.layer.addSublayer(layer)
            previewLayer = layer
        }
    }
    
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        // Ensure the preview layer matches the exact bounds of the view without stacking duplicate layers
        previewLayer?.frame = view.bounds
    }
}
