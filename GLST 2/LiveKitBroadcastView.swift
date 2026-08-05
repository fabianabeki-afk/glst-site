import SwiftUI
import LiveKit
import AVFoundation

struct LiveKitBroadcastView: View {
    @StateObject private var streamManager = LiveKitStreamManager()
    @State private var showControls = true
    @Binding var isLive: Bool
    @Binding var isLoading: Bool
    @Binding var djName: String
    var onClose: () -> Void
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // Background
                Color.black.ignoresSafeArea()
                
                // Video Preview
                if let videoTrack = streamManager.localVideoTrack {
                    SwiftUIVideoView(videoTrack, layoutMode: .fill)
                        .frame(width: geometry.size.width, height: geometry.size.height)
                        .clipped()
                        .ignoresSafeArea()
                } else {
                    // Placeholder when no camera
                    VStack {
                        ProgressView()
                            .tint(.white)
                        Text("Initializing Camera Preview...")
                            .font(.system(.caption, design: .monospaced))
                            .foregroundColor(.white.opacity(0.5))
                            .padding(.top, 10)
                    }
                }
                
                // Overlay Controls
                VStack {
                    // Top Bar
                    HStack {
                        // Close Button
                        Button(action: {
                            Task {
                                await streamManager.disconnect()
                            }
                            onClose()
                        }) {
                            Image(systemName: "xmark")
                                .font(.title2)
                                .foregroundColor(.white)
                                .padding(12)
                                .background(.ultraThinMaterial)
                                .clipShape(Circle())
                        }
                        
                        // Lens Selection Menu Button
                        Menu {
                            Button(action: {
                                Task {
                                    await streamManager.setCameraLens(position: .front, deviceType: .builtInWideAngleCamera)
                                }
                            }) {
                                Label("Front Camera", systemImage: "video.fill")
                            }
                            
                            Button(action: {
                                Task {
                                    await streamManager.setCameraLens(position: .back, deviceType: .builtInWideAngleCamera)
                                }
                            }) {
                                Label("Back Wide Camera", systemImage: "camera")
                            }
                            
                            Button(action: {
                                Task {
                                    await streamManager.setCameraLens(position: .back, deviceType: .builtInUltraWideCamera)
                                }
                            }) {
                                Label("Back Ultra-Wide", systemImage: "camera.macro")
                            }
                            
                            Button(action: {
                                Task {
                                    await streamManager.setCameraLens(position: .back, deviceType: .builtInTelephotoCamera)
                                }
                            }) {
                                Label("Back Telephoto", systemImage: "camera.aperture")
                            }
                        } label: {
                            Image(systemName: "camera.rotate.fill")
                                .font(.title2)
                                .foregroundColor(.white)
                                .padding(12)
                                .background(.ultraThinMaterial)
                                .clipShape(Circle())
                        }
                        .padding(.leading, 8)
                        
                        Spacer()
                        
                        // Live Indicator
                        if streamManager.isStreaming {
                            HStack(spacing: 6) {
                                Circle()
                                    .fill(Color.red)
                                    .frame(width: 8, height: 8)
                                Text("LIVE")
                                    .font(.system(.caption, design: .monospaced))
                                    .fontWeight(.black)
                                    .foregroundColor(.white)
                                Text(streamManager.streamDuration)
                                    .font(.system(.caption, design: .monospaced))
                                    .foregroundColor(.white)
                                    .monospacedDigit()
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(.ultraThinMaterial)
                            .cornerRadius(15)
                        }
                        
                        Spacer()
                        
                        // Connection Status
                        Circle()
                            .fill(streamManager.isStreaming ? Color.green : (streamManager.isConnecting ? Color.yellow : Color.red))
                            .frame(width: 12, height: 12)
                            .padding(8)
                            .background(.ultraThinMaterial)
                            .clipShape(Circle())
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, geometry.safeAreaInsets.top + 8)
                    
                    Spacer()
                    
                    // Bottom Controls
                    VStack(spacing: 20) {
                        if !streamManager.isStreaming {
                            // GO LIVE Button
                            Button(action: {
                                Task {
                                    isLoading = true
                                    let generator = LiveKitTokenGenerator()
                                    let token = generator.getToken()
                                    
                                    if token.isEmpty {
                                        print("ERROR: No LiveKit token. Set LIVEKIT_TOKEN environment variable in Xcode")
                                        isLoading = false
                                        return
                                    }
                                    
                                    await streamManager.connect(withToken: token)
                                    await streamManager.startStreaming()
                                    
                                    isLoading = false
                                    isLive = true
                                }
                            }) {
                                HStack {
                                    Image(systemName: "video.fill")
                                    Text("GO LIVE")
                                        .font(.system(.headline, design: .monospaced))
                                        .fontWeight(.black)
                                }
                                .foregroundColor(.black)
                                .padding(.horizontal, 30)
                                .padding(.vertical, 14)
                                .background(Color(red: 0.831, green: 0.686, blue: 0.216))
                                .cornerRadius(25)
                                .shadow(color: Color(red: 0.831, green: 0.686, blue: 0.216).opacity(0.4), radius: 10)
                            }
                            .disabled(streamManager.isConnecting)
                        } else {
                            // STOP Button
                            Button(action: {
                                Task {
                                    await streamManager.stopStreaming()
                                    isLive = false
                                }
                            }) {
                                HStack {
                                    Image(systemName: "stop.fill")
                                    Text("STOP")
                                        .font(.system(.headline, design: .monospaced))
                                        .fontWeight(.black)
                                }
                                .foregroundColor(.white)
                                .padding(.horizontal, 30)
                                .padding(.vertical, 14)
                                .background(Color.red)
                                .cornerRadius(25)
                                .shadow(color: Color.red.opacity(0.4), radius: 10)
                            }
                        }
                        
                        // Status Text
                        Text(statusText)
                            .font(.system(.caption, design: .monospaced))
                            .foregroundColor(.gray)
                    }
                    .padding(.bottom, max(30, geometry.safeAreaInsets.bottom + 8))
                }
            }
        }
        .task {
            await streamManager.prepareCameraPreview()
        }
    }
    
    private var statusText: String {
        if streamManager.isStreaming {
            return "STREAMING LIVE"
        } else if streamManager.isConnecting {
            return "CONNECTING..."
        } else {
            return "READY TO STREAM"
        }
    }
}

// MARK: - Preview
struct LiveKitBroadcastView_Previews: PreviewProvider {
    static var previews: some View {
        LiveKitBroadcastView(
            isLive: .constant(false),
            isLoading: .constant(false),
            djName: .constant("DJ Fabian"),
            onClose: {}
        )
    }
}
