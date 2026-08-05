import SwiftUI

struct ContentView: View {
    @State private var showSplash = true
    
    var body: some View {
        ZStack {
            if showSplash {
                SplashScreenView()
                    .transition(.opacity)
            } else {
                RateMyTransitionView()
                    .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.5), value: showSplash)
    }
}

struct SplashScreenView: View {
    @State private var opacity: Double = 0
    @State private var scale: CGFloat = 0.8
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            VStack(spacing: 20) {
                Image("RateMyTransitionText")
                    .resizable()
                    .scaledToFit()
                    .frame(height: 225)
                    .opacity(opacity)
                    .scaleEffect(scale)
            }
        }
        .onAppear {
            withAnimation(.easeIn(duration: 1.0)) {
                opacity = 1.0
                scale = 1.0
            }
            
            // Hide splash after 2.5 seconds
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
                if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                   let window = windowScene.windows.first {
                    withAnimation(.easeOut(duration: 0.5)) {
                        window.rootViewController = UIHostingController(rootView: RateMyTransitionView())
                        window.makeKeyAndVisible()
                    }
                }
            }
        }
    }
}

#Preview {
    ContentView()
}