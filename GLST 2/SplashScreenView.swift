import SwiftUI

struct SplashScreenView: View {
    @State private var showMainApp = false
    @State private var opacity = 0.0
    @State private var scale = 0.8
    
    var body: some View {
        Group {
            if showMainApp {
                ContentView()
            } else {
                ZStack {
                    Color.black.ignoresSafeArea()
                    
                    VStack(spacing: 20) {
                        Spacer()
                        
                        // G Logo
                        Image("G_logo")
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width: 120, height: 120)
                            .scaleEffect(scale)
                            .opacity(opacity)
                        
                        Text("GUESTLIST")
                            .font(.system(.largeTitle, design: .monospaced))
                            .fontWeight(.black)
                            .foregroundColor(Color(red: 0.831, green: 0.686, blue: 0.216))
                            .opacity(opacity)
                        
                        Text("LIVE. RAW. UNDERGROUND.")
                            .font(.system(.caption, design: .monospaced))
                            .foregroundColor(.gray)
                            .opacity(opacity)
                        
                        Spacer()
                        
                        // App logos row
                        HStack(spacing: 30) {
                            Image("PADPRO_MASTER_1024")
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(width: 40, height: 40)
                                .opacity(0.6)
                            
                            Image("DIFF OPPS_white_NB")
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(width: 80, height: 80)
                                .opacity(0.8)
                            
                            Image("RMT_logo_official_logo_1Black_1024")
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(width: 40, height: 40)
                                .opacity(0.6)
                        }
                        .opacity(opacity)
                        
                        Text("PART OF THE DIFF OPPS ECOSYSTEM")
                            .font(.system(.caption2, design: .monospaced))
                            .foregroundColor(.gray)
                            .opacity(opacity * 0.5)
                            .padding(.bottom, 40)
                    }
                }
                .onAppear {
                    withAnimation(.easeIn(duration: 1.0)) {
                        opacity = 1.0
                        scale = 1.0
                    }
                    
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
                        withAnimation(.easeOut(duration: 0.5)) {
                            showMainApp = true
                        }
                    }
                }
            }
        }
    }
}

struct SplashScreenView_Previews: PreviewProvider {
    static var previews: some View {
        SplashScreenView()
    }
}