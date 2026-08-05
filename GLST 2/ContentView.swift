import SwiftUI
import LiveKit

struct ContentView: View {
    @State private var isLive = false
    @State private var isLoading = false
    @State private var showBroadcast = false
    @State private var djName = "DJ Fabian"
    @State private var eventName = "Live Set"
    
    var body: some View {
        Group {
            if showBroadcast {
                LiveKitBroadcastView(
                    isLive: $isLive,
                    isLoading: $isLoading,
                    djName: $djName,
                    onClose: { showBroadcast = false }
                )
            } else {
                HomeView()
                    .overlay(
                        VStack {
                            Spacer()
                            HStack {
                                Spacer()
                                Button(action: {
                                    showBroadcast = true
                                }) {
                                    HStack {
                                        if isLoading {
                                            ProgressView()
                                                .progressViewStyle(CircularProgressViewStyle(tint: .black))
                                        } else {
                                            Image(systemName: "video.fill")
                                            Text("GO LIVE")
                                                .font(.system(.caption, design: .monospaced))
                                                .fontWeight(.black)
                                        }
                                    }
                                    .foregroundColor(.black)
                                    .padding(.horizontal, 20)
                                    .padding(.vertical, 12)
                                    .background(Color(red: 0.831, green: 0.686, blue: 0.216))
                                    .cornerRadius(25)
                                    .shadow(color: Color(red: 0.831, green: 0.686, blue: 0.216).opacity(0.4), radius: 10)
                                }
                                .padding(.trailing, 20)
                                .padding(.bottom, 30)
                            }
                        }
                    )
            }
        }
        .onAppear {
            print("GLST: ContentView appeared")
        }
    }
}
