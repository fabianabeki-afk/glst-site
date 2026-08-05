import SwiftUI

struct HomeView: View {
    @State private var selectedChannel = "G2"
    @State private var showProfile = false
    @State private var activeDJ = "DJ Fabian"
    @State private var viewerCount = 142
    @State private var isLive = true
    @State private var currentPerkIndex = 0
    @State private var showChat = false
    @State private var showDJProfile = false
    
    let channels = [
        ("G1", "PRODUCER", Color(red: 0.831, green: 0.686, blue: 0.216)),
        ("G2", "SKILLS", Color.red),
        ("G3", "DJ", Color.purple),
        ("G4", "BEDROOM", Color.blue)
    ]
    
    let perks = [
        ("PRODUCER PIPELINE", "Upload stems. Get signed. Keep your masters.", "Get PadPro →"),
        ("DIRECT MARKET", "Sell your transitions. Name your price.", "Get RMT →"),
        ("ECOSYSTEM PASS", "One login. Three apps. Full control.", "Learn More →")
    ]
    
    var body: some View {
        NavigationView {
            ZStack {
                Color.black.ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 0) {
                        // HEADER
                        HStack {
                            Image("G_logo")
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(width: 40, height: 40)
                            
                            Image("the_guestlint_web")
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(height: 24)
                                .padding(.leading, 8)
                            
                            Spacer()
                            
                            // Theme toggle (moon icon)
                            Button(action: {}) {
                                Image(systemName: "moon.fill")
                                    .font(.title3)
                                    .foregroundColor(.gray)
                            }
                            
                            // Profile Button
                            Button(action: { showProfile = true }) {
                                Image(systemName: "person.circle.fill")
                                    .font(.title2)
                                    .foregroundColor(Color(red: 0.831, green: 0.686, blue: 0.216))
                            }
                        }
                        .padding()
                        .background(Color.black.opacity(0.8))
                        
                        // ECOSYSTEM BANNER (like website)
                        HStack(spacing: 12) {
                            // PadPro side
                            Image("PADPRO_MASTER_1024")
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(width: 40, height: 40)
                                .cornerRadius(6)
                                .opacity(0.8)
                            
                            // Center perks slideshow
                            VStack(spacing: 6) {
                                Text(perks[currentPerkIndex].0)
                                    .font(.system(.caption, design: .monospaced))
                                    .fontWeight(.black)
                                    .foregroundColor(Color(red: 0.831, green: 0.686, blue: 0.216))
                                
                                Text(perks[currentPerkIndex].1)
                                    .font(.system(.caption2, design: .monospaced))
                                    .foregroundColor(.white)
                                    .multilineTextAlignment(.center)
                                    .lineLimit(1)
                                
                                Text(perks[currentPerkIndex].2)
                                    .font(.system(.caption2, design: .monospaced))
                                    .foregroundColor(Color(red: 0.831, green: 0.686, blue: 0.216))
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(
                                LinearGradient(
                                    colors: [Color.purple.opacity(0.2), Color.blue.opacity(0.2)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .cornerRadius(12)
                            .onAppear {
                                // Auto-cycle perks
                                Timer.scheduledTimer(withTimeInterval: 5.5, repeats: true) { _ in
                                    withAnimation {
                                        currentPerkIndex = (currentPerkIndex + 1) % perks.count
                                    }
                                }
                            }
                            
                            // RMT side
                            Image("RMT_logo_official_logo_1Black_1024")
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(width: 40, height: 40)
                                .cornerRadius(6)
                                .opacity(0.8)
                        }
                        .padding(.horizontal)
                        .padding(.vertical, 8)
                        
                        // DOT INDICATORS
                        HStack(spacing: 6) {
                            ForEach(0..<perks.count, id: \.self) { index in
                                Circle()
                                    .fill(index == currentPerkIndex ? Color(red: 0.831, green: 0.686, blue: 0.216) : Color.gray.opacity(0.3))
                                    .frame(width: 6, height: 6)
                            }
                        }
                        .padding(.bottom, 8)
                        
                        // FOLLOWED ARTISTS / BROADCASTERS (like stories)
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 16) {
                                ForEach(0..<5) { index in
                                    VStack(spacing: 6) {
                                        ZStack {
                                            Circle()
                                                .stroke(Color(red: 0.831, green: 0.686, blue: 0.216), lineWidth: 2)
                                                .frame(width: 72, height: 72)

                                            Circle()
                                                .fill(Color(red: 0.2, green: 0.2, blue: 0.2))
                                                .frame(width: 64, height: 64)
                                                .overlay(
                                                    Text("DJ\(index + 1)")
                                                        .font(.system(.caption, design: .monospaced))
                                                        .foregroundColor(.white)
                                                )
                                        }
                                        .padding(.vertical, 2) // tiny breathing room inside each item

                                        Text("Artist \(index + 1)")
                                            .font(.system(.caption2, design: .monospaced))
                                            .foregroundColor(.gray)
                                    }
                                    .padding(.vertical, 2) // space above and below each item
                                }
                            }
                            .padding(.horizontal)
                        }
                        .padding(.vertical, 12) // add more space around the whole stories row
                        
                        // STREAM PLAYER - Bigger with corner overlays
                        ZStack {
                            Rectangle()
                                .fill(Color(red: 0.05, green: 0.05, blue: 0.05))
                                .frame(height: 350) // Bigger
                            
                            // Center content
                            VStack {
                                Image(systemName: "video.fill")
                                    .font(.system(size: 80))
                                    .foregroundColor(Color(red: 0.831, green: 0.686, blue: 0.216))
                                
                                Text(activeDJ)
                                    .font(.system(.title2, design: .monospaced))
                                    .fontWeight(.black)
                                    .foregroundColor(.white)
                                    .padding(.top, 12)
                            }
                            
                            // Top-left: LIVE GUEST
                            VStack {
                                HStack {
                                    HStack(spacing: 4) {
                                        Circle()
                                            .fill(Color.red)
                                            .frame(width: 8, height: 8)
                                        
                                        Text("LIVE GUEST")
                                            .font(.system(.caption, design: .monospaced))
                                            .fontWeight(.black)
                                            .foregroundColor(.red)
                                    }
                                    .padding(8)
                                    .background(Color.black.opacity(0.6))
                                    .cornerRadius(8)
                                    
                                    Spacer()
                                }
                                .padding(12)
                                
                                Spacer()
                            }
                            
                            // Top-right: Viewers
                            VStack {
                                HStack {
                                    Spacer()
                                    
                                    HStack(spacing: 4) {
                                        Image(systemName: "eye.fill")
                                            .font(.caption)
                                            .foregroundColor(Color(red: 0.831, green: 0.686, blue: 0.216))
                                        
                                        Text("\(viewerCount)")
                                            .font(.system(.caption, design: .monospaced))
                                            .fontWeight(.black)
                                            .foregroundColor(.white)
                                    }
                                    .padding(8)
                                    .background(Color.black.opacity(0.6))
                                    .cornerRadius(8)
                                }
                                .padding(12)
                                
                                Spacer()
                            }
                            
                            // Bottom-left: BASS (haptic)
                            VStack {
                                Spacer()
                                
                                HStack {
                                    VStack(spacing: 2) {
                                        Text("BASS")
                                            .font(.system(.caption2, design: .monospaced))
                                            .foregroundColor(.gray)
                                        
                                        Text("94%")
                                            .font(.system(.caption, design: .monospaced))
                                            .fontWeight(.black)
                                            .foregroundColor(Color(red: 0.831, green: 0.686, blue: 0.216))
                                    }
                                    .padding(8)
                                    .background(Color.black.opacity(0.6))
                                    .cornerRadius(8)
                                    
                                    Spacer()
                                }
                                .padding(12)
                            }
                            
                            // Bottom-right: HEAT (haptic)
                            VStack {
                                Spacer()
                                
                                HStack {
                                    Spacer()
                                    
                                    VStack(spacing: 2) {
                                        Text("HEAT")
                                            .font(.system(.caption2, design: .monospaced))
                                            .foregroundColor(.gray)
                                        
                                        Text("88%")
                                            .font(.system(.caption, design: .monospaced))
                                            .fontWeight(.black)
                                            .foregroundColor(Color(red: 0.831, green: 0.686, blue: 0.216))
                                    }
                                    .padding(8)
                                    .background(Color.black.opacity(0.6))
                                    .cornerRadius(8)
                                }
                                .padding(12)
                            }
                        }
                        .padding(.horizontal, 0) // Edge to edge
                        
                        // ROOMS SECTION - Under broadcast
                        VStack(alignment: .leading, spacing: 12) {
                            Text("SELECT ROOM")
                                .font(.system(.caption, design: .monospaced))
                                .fontWeight(.black)
                                .foregroundColor(.gray)
                                .padding(.horizontal)
                            
                            HStack(spacing: 12) {
                                ForEach(channels, id: \.0) { channel in
                                    Button(action: { selectedChannel = channel.0 }) {
                                        VStack(spacing: 8) {
                                            Image(channel.0)
                                                .resizable()
                                                .aspectRatio(contentMode: .fit)
                                                .frame(height: 100)
                                            
                                            Text(channel.1)
                                                .font(.system(.subheadline, design: .monospaced))
                                                .fontWeight(.black)
                                                .foregroundColor(selectedChannel == channel.0 ? channel.2 : .gray)
                                        }
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 12)
                                    }
                                }
                            }
                            .padding(.horizontal)
                        }
                        .padding(.vertical, 12)
                        
                        // COMBINED CHAT & DJ SECTION
                        VStack(spacing: 0) {
                            // Toggle bar
                            HStack(spacing: 0) {
                                // Chat half
                                Button(action: { showChat.toggle(); showDJProfile = false }) {
                                    HStack {
                                        Image(systemName: "message.fill")
                                            .font(.caption)
                                        Text("CHAT")
                                            .font(.system(.caption, design: .monospaced))
                                            .fontWeight(.black)
                                    }
                                    .foregroundColor(showChat ? Color(red: 0.831, green: 0.686, blue: 0.216) : .gray)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 12)
                                    .background(showChat ? Color(red: 0.831, green: 0.686, blue: 0.216).opacity(0.1) : Color.clear)
                                }
                                
                                Divider()
                                    .background(Color.gray.opacity(0.3))
                                
                                // DJ half
                                Button(action: { showDJProfile.toggle(); showChat = false }) {
                                    HStack {
                                        Image(systemName: "person.fill")
                                            .font(.caption)
                                        Text("DJ")
                                            .font(.system(.caption, design: .monospaced))
                                            .fontWeight(.black)
                                    }
                                    .foregroundColor(showDJProfile ? Color(red: 0.831, green: 0.686, blue: 0.216) : .gray)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 12)
                                    .background(showDJProfile ? Color(red: 0.831, green: 0.686, blue: 0.216).opacity(0.1) : Color.clear)
                                }
                            }
                            .background(Color(red: 0.08, green: 0.08, blue: 0.08))
                            
                            // Chat Section
                            if showChat {
                                VStack(spacing: 8) {
                                    HStack {
                                        Text("LIVE CHAT")
                                            .font(.system(.caption, design: .monospaced))
                                            .fontWeight(.black)
                                            .foregroundColor(.gray)
                                            .padding(.horizontal)
                                            .padding(.top, 12)
                                        
                                        Spacer()
                                    }
                                    
                                    VStack(spacing: 8) {
                                        ChatMessage(username: "raver_42", message: "Sick bassline! 🔥", time: "2m")
                                        ChatMessage(username: "dj_sarah", message: "What track is this?", time: "1m")
                                        ChatMessage(username: "underground", message: "Proper underground vibes", time: "30s")
                                    }
                                    .padding(.horizontal)
                                    
                                    // Chat input
                                    HStack {
                                        TextField("Say something...", text: .constant(""))
                                            .font(.system(.body, design: .monospaced))
                                            .padding(8)
                                            .background(Color(red: 0.15, green: 0.15, blue: 0.15))
                                            .cornerRadius(8)
                                        
                                        Button(action: {}) {
                                            Image(systemName: "paperplane.fill")
                                                .foregroundColor(Color(red: 0.831, green: 0.686, blue: 0.216))
                                        }
                                    }
                                    .padding(.horizontal)
                                    .padding(.vertical, 8)
                                }
                                .background(Color(red: 0.08, green: 0.08, blue: 0.08))
                            }
                            
                            // DJ Profile Section
                            if showDJProfile {
                                VStack(alignment: .leading, spacing: 12) {
                                    HStack {
                                        Circle()
                                            .fill(Color(red: 0.831, green: 0.686, blue: 0.216))
                                            .frame(width: 50, height: 50)
                                            .overlay(
                                                Text("🎧")
                                                    .font(.title)
                                            )
                                        
                                        VStack(alignment: .leading) {
                                            Text(activeDJ)
                                                .font(.system(.headline, design: .monospaced))
                                                .fontWeight(.black)
                                            
                                            Text("Dubstep • Garage • Bass")
                                                .font(.system(.caption, design: .monospaced))
                                                .foregroundColor(.gray)
                                        }
                                        
                                        Spacer()
                                        
                                        VStack(spacing: 4) {
                                            Button(action: {}) {
                                                Text("FOLLOW")
                                                    .font(.system(.caption, design: .monospaced))
                                                    .fontWeight(.black)
                                                    .foregroundColor(.black)
                                                    .padding(.horizontal, 12)
                                                    .padding(.vertical, 6)
                                                    .background(Color(red: 0.831, green: 0.686, blue: 0.216))
                                                    .cornerRadius(8)
                                            }
                                            
                                            Button(action: {}) {
                                                HStack {
                                                    Image(systemName: "dollarsign.circle.fill")
                                                    Text("TIP DJ")
                                                }
                                                .font(.system(.caption2, design: .monospaced))
                                                .foregroundColor(Color(red: 0.831, green: 0.686, blue: 0.216))
                                            }
                                        }
                                    }
                                    
                                    // Rating
                                    HStack {
                                        ForEach(1...5, id: \.self) { star in
                                            Image(systemName: "star.fill")
                                                .foregroundColor(star <= 4 ? Color(red: 0.831, green: 0.686, blue: 0.216) : Color.gray)
                                        }
                                        Text("4.0")
                                            .font(.system(.caption, design: .monospaced))
                                            .foregroundColor(.gray)
                                    }
                                }
                                .padding()
                                .background(Color(red: 0.08, green: 0.08, blue: 0.08))
                            }
                        }
                        .background(Color(red: 0.08, green: 0.08, blue: 0.08))
                        .cornerRadius(12)
                        .padding(.horizontal)
                        .padding(.vertical, 8)
                        
                        Spacer(minLength: 100)
                    }
                }
                
                // Profile Modal
                if showProfile {
                    ProfileModalView(isPresented: $showProfile)
                }
            }
            .navigationBarHidden(true)
        }
    }
}

// Chat Message Component
struct ChatMessage: View {
    let username: String
    let message: String
    let time: String
    
    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Text(username)
                .font(.system(.caption, design: .monospaced))
                .fontWeight(.bold)
                .foregroundColor(Color(red: 0.831, green: 0.686, blue: 0.216))
            
            Text(message)
                .font(.system(.caption, design: .monospaced))
                .foregroundColor(.white)
            
            Spacer()
            
            Text(time)
                .font(.system(.caption2, design: .monospaced))
                .foregroundColor(.gray)
        }
    }
}

// Stat Pill Component (like website)
struct StatPill: View {
    let value: String
    let label: String
    
    var body: some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(.caption, design: .monospaced))
                .fontWeight(.black)
                .foregroundColor(Color(red: 0.831, green: 0.686, blue: 0.216))
            
            Text(label)
                .font(.system(.caption2, design: .monospaced))
                .foregroundColor(.gray)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color.black.opacity(0.6))
        .cornerRadius(6)
    }
}

struct HomeView_Previews: PreviewProvider {
    static var previews: some View {
        HomeView()
    }
}
