import Foundation

/// LiveKit Token Manager - Uses environment variables or fallback
class LiveKitTokenGenerator {
    
    /// Get token from environment or generate locally
    func getToken() -> String {
        // Check for token from environment (Xcode scheme or CI/CD)
        if let envToken = ProcessInfo.processInfo.environment["LIVEKIT_TOKEN"], !envToken.isEmpty {
            print("Using token from environment variable")
            return envToken
        }
        
        // Fallback: Use hardcoded token from dashboard
        // TODO: Replace this with backend API call
        return generateFallbackToken()
    }
    
    /// Generate a fallback token (for testing only)
    private func generateFallbackToken() -> String {
        // This should be replaced with a backend API call
        // For now, return empty to force environment variable usage
        print("WARNING: No LIVEKIT_TOKEN environment variable set")
        print("Set it in Xcode: Product > Scheme > Edit Scheme > Arguments > Environment Variables")
        return ""
    }
    
    /// Get WebSocket URL from environment or use default
    func getWebSocketURL() -> String {
        if let envURL = ProcessInfo.processInfo.environment["LIVEKIT_URL"], !envURL.isEmpty {
            return envURL
        }
        return "wss://guestlist-tv-ei1a8q8r.livekit.cloud"
    }
}

// MARK: - Usage in LiveKitBroadcastView
extension LiveKitBroadcastView {
    func getBroadcastToken() async -> String {
        // Get token from environment or generator
        let generator = LiveKitTokenGenerator()
        return generator.getToken()
        
        // Option 2: Fetch from your backend (RECOMMENDED)
        /*
        let url = URL(string: "https://guestlist.tv/api/livekit/broadcaster-token")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = [
            "roomName": "fabiandubz-stream",
            "userId": "dj-fabian-123"
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONDecoder().decode(TokenResponse.self, from: data)
        
        return response.token
        */
    }
}

struct TokenResponse: Codable {
    let token: String
    let url: String
    let roomName: String
}
