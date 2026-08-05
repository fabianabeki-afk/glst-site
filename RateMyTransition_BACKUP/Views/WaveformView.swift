import SwiftUI

struct WaveformView: View {
    let waveformData: [Float]
    @State private var animationProgress: CGFloat = 0.0
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // Background gradient
                LinearGradient(
                    colors: [
                        Color.purple.opacity(0.3),
                        Color.blue.opacity(0.2),
                        Color.black.opacity(0.1)
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()
                
                // Waveform bars
                HStack(spacing: 2) {
                    ForEach(0..<waveformData.count, id: \.self) { index in
                        let normalizedValue = CGFloat((waveformData[index] + 1.0) / 2.0)
                        let barHeight = normalizedValue * geometry.size.height * 0.8
                        
                        RoundedRectangle(cornerRadius: 1)
                            .fill(
                                LinearGradient(
                                    colors: [
                                        Color.purple.opacity(0.8),
                                        Color.blue.opacity(0.6)
                                    ],
                                    startPoint: .top,
                                    endPoint: .bottom
                                )
                            )
                            .frame(width: 3, height: barHeight)
                            .frame(maxHeight: .infinity, alignment: .center)
                    }
                }
                .frame(width: geometry.size.width)
                
                // Playhead line
                Rectangle()
                    .fill(Color.yellow)
                    .frame(width: 2, height: geometry.size.height)
                    .position(x: geometry.size.width * animationProgress, y: geometry.size.height / 2)
            }
        }
        .onAppear {
            withAnimation(.linear(duration: 30).repeatForever(autoreverses: false)) {
                animationProgress = 1.0
            }
        }
    }
}

struct AudioWaveformCard: View {
    let transition: DJTransition
    @State private var isPlaying = false
    
    var body: some View {
        VStack(spacing: 0) {
            // Waveform visualization
            ZStack {
                // Generate sample waveform data if none exists
                WaveformView(waveformData: transition.waveformData ?? generateSampleWaveform())
                    .frame(height: 120)
                    .background(
                        LinearGradient(
                            colors: [
                                Color.purple.opacity(0.2),
                                Color.blue.opacity(0.1)
                            ],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .cornerRadius(8)
                
                // Play button overlay
                Button(action: { isPlaying.toggle() }) {
                    ZStack {
                        Circle()
                            .fill(Color.black.opacity(0.7))
                            .frame(width: 50, height: 50)
                        
                        Image(systemName: isPlaying ? "pause.fill" : "play.fill")
                            .font(.system(size: 24))
                            .foregroundColor(.yellow)
                    }
                }
            }
            .padding(.horizontal, 8)
            .padding(.top, 8)
            
            // Track info
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("From: \(transition.trackFrom)")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.white)
                    
                    Image(systemName: "arrow.right")
                        .foregroundColor(.yellow)
                        .font(.system(size: 12))
                    
                    Text("To: \(transition.trackTo)")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.white)
                }
                
                // Time markers
                HStack {
                    Text("00:00")
                        .font(.system(size: 10))
                        .foregroundColor(.gray)
                    
                    Spacer()
                    
                    Text("CROSSFADER")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.yellow)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(Color.yellow.opacity(0.2))
                        .cornerRadius(4)
                    
                    Spacer()
                    
                    Text("00:30")
                        .font(.system(size: 10))
                        .foregroundColor(.gray)
                }
                
                // DJ info and rating
                HStack {
                    HStack(spacing: 4) {
                        Image(systemName: "person.circle")
                            .foregroundColor(.yellow)
                        Text(transition.djName)
                            .font(.system(size: 13))
                            .foregroundColor(.gray)
                    }
                    
                    Spacer()
                    
                    // Star rating
                    HStack(spacing: 2) {
                        ForEach(1...5, id: \.self) { star in
                            Image(systemName: star <= Int(transition.rating) ? "star.fill" : "star")
                                .foregroundColor(.yellow)
                                .font(.system(size: 12))
                        }
                        Text(String(format: "%.1f", transition.rating))
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.yellow)
                    }
                }
            }
            .padding(12)
        }
        .background(Color.gray.opacity(0.15))
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.yellow.opacity(0.3), lineWidth: 1)
        )
    }
    
    private func generateSampleWaveform() -> [Float] {
        var data: [Float] = []
        for _ in 0..<100 {
            let value = Float.random(in: -0.8...0.8)
            data.append(value)
        }
        return data
    }
}

#Preview {
    AudioWaveformCard(transition: DJTransition(
        id: "1",
        djName: "DJ Snake",
        djId: "",
        djImageURL: nil,
        trackFrom: "Closer",
        trackTo: "Noisia",
        genre: "Electronic",
        rating: 4.8,
        voteCount: 234,
        audioURL: nil,
        videoURL: nil,
        waveformData: nil,
        createdAt: Date(),
        comments: [],
        reactions: [],
        isVideo: false
    ))
    .background(Color.black)
}