import SwiftUI

struct RateMyTransitionView: View {
    @StateObject private var store = TransitionStore()
    @State private var showUpload = false
    @State private var showProfile = false
    @State private var selectedFilter = "Trending"
    
    let filters = ["Trending", "Recent", "Top Rated", "My Transitions"]
    
    var filteredTransitions: [DJTransition] {
        switch selectedFilter {
        case "Recent":
            return store.transitions.sorted { $0.createdAt > $1.createdAt }
        case "Top Rated":
            return store.transitions.sorted { $0.rating > $1.rating }
        case "My Transitions":
            return store.transitions.filter { $0.djName == "You" }
        default:
            return store.transitions
        }
    }
    
    var body: some View {
        NavigationView {
            ZStack {
                Color.black.ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // Header with Logo + App Links
                    VStack(spacing: 8) {
                        HStack(spacing: 12) {
                            Image("RateMyTransitionText")
                                .resizable()
                                .scaledToFit()
                                .frame(height: 40)
                            
                            Text("Rate My Transition")
                                .font(.system(size: 18, weight: .bold))
                                .foregroundColor(.yellow)
                            
                            Spacer()
                            
                            // PadPro Link
                            Button(action: { openAppURL("padpro://") }) {
                                Image("padpro_logo")
                                    .resizable()
                                    .scaledToFit()
                                    .frame(width: 40, height: 40)
                                    .cornerRadius(10)
                            }
                            
                            // Guestlist Link - opens web app
                            Button(action: { openAppURL("https://main.d1r2nez41w5xjf.amplifyapp.com/") }) {
                                Image("guestlist_logo")
                                    .resizable()
                                    .scaledToFit()
                                    .frame(width: 40, height: 40)
                                    .cornerRadius(10)
                            }
                            
                            // Profile
                            Button(action: { showProfile = true }) {
                                Image(systemName: "person.circle")
                                    .font(.system(size: 32))
                                    .foregroundColor(.yellow)
                            }
                        }
                        .padding(.horizontal)
                        .padding(.top, 8)
                    }
                    
                    // Filters
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            ForEach(filters, id: \.self) { filter in
                                Button(action: { selectedFilter = filter }) {
                                    Text(filter)
                                        .font(.system(size: 14, weight: .medium))
                                        .foregroundColor(selectedFilter == filter ? .black : .white)
                                        .padding(.horizontal, 16)
                                        .padding(.vertical, 8)
                                        .background(selectedFilter == filter ? Color.yellow : Color.gray.opacity(0.3))
                                        .cornerRadius(20)
                                }
                            }
                        }
                        .padding(.horizontal)
                    }
                    .padding(.vertical, 8)
                    
                    // Transitions List with Waveforms
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            ForEach(filteredTransitions) { transition in
                                AudioWaveformCard(transition: transition, store: store)
                                    .padding(.horizontal)
                            }
                        }
                        .padding(.bottom, 80)
                    }
                }
                
                // Floating Action Buttons
                VStack {
                    Spacer()
                    HStack(spacing: 16) {
                        Spacer()
                        
                        // Upload Button
                        Button(action: { showUpload = true }) {
                            ZStack {
                                Circle()
                                    .fill(Color.gray.opacity(0.8))
                                    .frame(width: 56, height: 56)
                                
                                Image(systemName: "arrow.up")
                                    .font(.system(size: 24))
                                    .foregroundColor(.yellow)
                            }
                        }
                    }
                    .padding(.trailing, 20)
                    .padding(.bottom, 20)
                }
            }
            .navigationBarHidden(true)
            .sheet(isPresented: $showUpload) {
                UploadTransitionView(store: store)
            }
            .sheet(isPresented: $showProfile) {
                ProfileView()
            }
        }
    }
    
    private func openAppURL(_ urlString: String) {
        if let url = URL(string: urlString) {
            UIApplication.shared.open(url, options: [:]) { success in
                if !success {
                    print("App not installed: \(urlString)")
                }
            }
        }
    }
}

#Preview {
    RateMyTransitionView()
}

// MARK: - Audio Waveform Card
struct AudioWaveformCard: View {
    let transition: DJTransition
    @ObservedObject var store: TransitionStore
    @State private var isPlaying = false
    @State private var commentText = ""
    
    var body: some View {
        VStack(spacing: 0) {
            // Waveform visualization
            ZStack {
                WaveformView(waveformData: transition.waveformData ?? generateSampleWaveform(), isPlaying: isPlaying)
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
                // From → To
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
                
                // DJ info, comment count, and rating
                HStack {
                    HStack(spacing: 4) {
                        Image(systemName: "person.circle")
                            .foregroundColor(.yellow)
                        Text(transition.djName)
                            .font(.system(size: 13))
                            .foregroundColor(.gray)
                    }
                    
                    Spacer()
                    
                    // Comment count
                    HStack(spacing: 4) {
                        Image(systemName: "bubble.left")
                            .font(.system(size: 12))
                        Text("\(transition.comments.count)")
                            .font(.system(size: 12))
                    }
                    .foregroundColor(.gray)
                    
                    // Interactive star rating
                    HStack(spacing: 2) {
                        ForEach(1...5, id: \.self) { star in
                            Button(action: {
                                store.voteForTransition(id: transition.id ?? "", rating: Double(star))
                            }) {
                                Image(systemName: star <= Int(transition.rating) ? "star.fill" : "star")
                                    .foregroundColor(.yellow)
                                    .font(.system(size: 14))
                            }
                        }
                        Text(String(format: "%.1f", transition.rating))
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.yellow)
                    }
                }
                
                // Comments section (displayed inline below like Instagram/TikTok)
                if !transition.comments.isEmpty {
                    VStack(alignment: .leading, spacing: 6) {
                        ForEach(transition.comments.prefix(3)) { comment in
                            HStack(alignment: .top, spacing: 6) {
                                Text(comment.author)
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundColor(.yellow)
                                Text(comment.text)
                                    .font(.system(size: 12))
                                    .foregroundColor(.white)
                            }
                        }
                        
                        if transition.comments.count > 3 {
                            Text("View all \(transition.comments.count) comments")
                                .font(.system(size: 12))
                                .foregroundColor(.gray)
                        }
                    }
                    .padding(.top, 8)
                }
                
                // Add comment field
                HStack {
                    TextField("Add a comment...", text: $commentText)
                        .font(.system(size: 13))
                        .foregroundColor(.white)
                    
                    Button("Post") {
                        if !commentText.isEmpty {
                            store.addComment(transitionId: transition.id ?? "", author: "You", text: commentText)
                            commentText = ""
                        }
                    }
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(.yellow)
                }
                .padding(.top, 8)
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

// MARK: - Waveform View
struct WaveformView: View {
    let waveformData: [Float]
    let isPlaying: Bool
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
                
                // Playhead line - only animate when playing
                if isPlaying {
                    Rectangle()
                        .fill(Color.yellow)
                        .frame(width: 2, height: geometry.size.height)
                        .position(x: geometry.size.width * animationProgress, y: geometry.size.height / 2)
                        .onAppear {
                            withAnimation(.linear(duration: 30).repeatForever(autoreverses: false)) {
                                animationProgress = 1.0
                            }
                        }
                        .onDisappear {
                            animationProgress = 0.0
                        }
                }
            }
        }
    }
}