import SwiftUI
import AVFoundation

struct CameraPreviewView: UIViewRepresentable {
    let captureSession: AVCaptureSession
    
    func makeUIView(context: Context) -> UIView {
        print("GLST: Creating camera preview view")
        let view = UIView()
        view.backgroundColor = .red // Debug color to see if view is visible
        
        let previewLayer = AVCaptureVideoPreviewLayer(session: captureSession)
        previewLayer.videoGravity = .resizeAspectFill
        if #available(iOS 17.0, *) {
            previewLayer.connection?.videoRotationAngle = 90 // Portrait
        } else {
            previewLayer.connection?.videoOrientation = .portrait
        }
        
        view.layer.addSublayer(previewLayer)
        
        // Delay setting frame to ensure view has bounds
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            print("GLST: Setting preview frame: \(view.bounds)")
            previewLayer.frame = view.bounds
        }
        
        return view
    }
    
    func updateUIView(_ uiView: UIView, context: Context) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            if let previewLayer = uiView.layer.sublayers?.first as? AVCaptureVideoPreviewLayer {
                previewLayer.frame = uiView.bounds
            }
        }
    }
}
