# LiveKit Token Generation

## Why We Need This

Tokens are required for authentication. The API Secret should NEVER be exposed in client-side code (iOS app or web browser).

## Backend API Endpoint

Add this to your guestlist.tv backend:

```typescript
import { AccessToken } from 'livekit-server-sdk';

// Your LiveKit credentials (store securely)
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

/**
 * Generate broadcaster token (for iOS app)
 * POST /api/livekit/broadcaster-token
 */
export async function createBroadcasterToken(req, res) {
  try {
    const { roomName, userId } = req.body;
    
    // Create token
    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: userId || 'ios-broadcaster',
      name: 'DJ Fabian',
      // Token valid for 24 hours
      ttl: 24 * 60 * 60,
    });
    
    // Grant broadcaster permissions
    token.addGrant({
      roomJoin: true,
      room: roomName || 'dj-fabian-stream',
      canPublish: true,
      canSubscribe: false,
      canPublishData: true,
      roomRecord: false,
    });
    
    // Return token
    res.json({
      token: token.toJwt(),
      url: 'wss://guestlist-tv-ei1a8q8r.livekit.cloud',
      roomName: roomName || 'dj-fabian-stream',
    });
    
  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
}

/**
 * Generate viewer token (for web app)
 * POST /api/livekit/viewer-token
 */
export async function createViewerToken(req, res) {
  try {
    const { roomName, userId } = req.body;
    
    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: userId || `viewer-${Date.now()}`,
      name: 'Viewer',
      ttl: 24 * 60 * 60,
    });
    
    // Grant viewer permissions (can only watch)
    token.addGrant({
      roomJoin: true,
      room: roomName || 'dj-fabian-stream',
      canPublish: false,
      canSubscribe: true,
      canPublishData: false,
    });
    
    res.json({
      token: token.toJwt(),
      url: 'wss://guestlist-tv-ei1a8q8r.livekit.cloud',
      roomName: roomName || 'dj-fabian-stream',
    });
    
  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
}
```

## Installation

```bash
npm install livekit-server-sdk
```

## Environment Variables

Add to your `.env` file:

```
LIVEKIT_API_KEY=APIVuJ9L9M3j6sh
LIVEKIT_API_SECRET=your-secret-here
LIVEKIT_URL=wss://guestlist-tv-ei1a8q8r.livekit.cloud
```

## API Usage

### iOS App (Broadcasting)

```swift
func getBroadcastToken() async -> String {
    let url = URL(string: "https://guestlist.tv/api/livekit/broadcaster-token")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let body = [
        "roomName": "dj-fabian-stream",
        "userId": "dj-fabian-123"
    ]
    request.httpBody = try? JSONSerialization.data(withJSONObject: body)
    
    let (data, _) = try await URLSession.shared.data(for: request)
    let response = try JSONDecoder().decode(TokenResponse.self, from: data)
    
    return response.token
}

struct TokenResponse: Codable {
    let token: String
    let url: String
    let roomName: String
}
```

### Web App (Viewing)

```javascript
async function getViewerToken() {
  const response = await fetch('https://guestlist.tv/api/livekit/viewer-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      roomName: 'dj-fabian-stream',
      userId: `viewer-${Date.now()}`,
    }),
  });
  
  const data = await response.json();
  return data;
}
```

## Security Notes

1. **NEVER expose API Secret** in client code
2. **Validate users** before generating broadcaster tokens
3. **Rate limit** token generation
4. **Use HTTPS** for token endpoint
5. **Short TTL** for tokens (24 hours max)

## Next Steps

1. Add this to your backend
2. Update iOS app to fetch tokens
3. Update web app to fetch viewer tokens
4. Test end-to-end streaming

Need help implementing this on your backend?
