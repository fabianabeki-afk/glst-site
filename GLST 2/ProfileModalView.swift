import SwiftUI

struct ProfileModalView: View {
    @Binding var isPresented: Bool
    
    var body: some View {
        ZStack {
            Color.black.opacity(0.9)
                .ignoresSafeArea()
                .onTapGesture {
                    isPresented = false
                }
            
            ProfileView(isPresented: $isPresented)
        }
    }
}