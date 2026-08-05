import SwiftUI
import AVFoundation

struct CameraPreviewControllerWrapper: UIViewControllerRepresentable {
    let captureSession: AVCaptureSession
    
    func makeUIViewController(context: Context) -> CameraPreviewUIViewController {
        let controller = CameraPreviewUIViewController()
        controller.captureSession = captureSession
        return controller
    }
    
    func updateUIViewController(_ uiViewController: CameraPreviewUIViewController, context: Context) {
        uiViewController.captureSession = captureSession
    }
}
