import SwiftUI
import FirebaseCore

@main
struct RateMyTransitionApp: App {
    init() {
        FirebaseApp.configure()
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}