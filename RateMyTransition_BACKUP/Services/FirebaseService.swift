import Foundation
import FirebaseFirestore
import FirebaseStorage
import Combine

@MainActor
class FirebaseService: ObservableObject {
    static let shared = FirebaseService()
    private let db = Firestore.firestore()
    private let storage = Storage.storage()
    
    @Published var transitions: [DJTransition] = []
    @Published var isLoading = false
    
    private init() {}
    
    // MARK: - Transitions
    func loadTransitions() async {
        isLoading = true
        do {
            let snapshot = try await db.collection("transitions")
                .order(by: "createdAt", descending: true)
                .getDocuments()
            
            var loadedTransitions: [DJTransition] = []
            for document in snapshot.documents {
                if let transition = try? document.data(as: DJTransition.self) {
                    loadedTransitions.append(transition)
                }
            }
            
            await MainActor.run {
                self.transitions = loadedTransitions
                self.isLoading = false
            }
        } catch {
            print("Error loading transitions: \(error)")
            await MainActor.run {
                self.isLoading = false
            }
        }
    }
    
    func uploadTransition(_ transition: DJTransition, audioURL: URL? = nil, videoURL: URL? = nil) async throws -> DJTransition {
        var uploadedTransition = transition
        
        // Upload audio if provided
        if let audioURL = audioURL {
            let audioRef = storage.reference().child("transitions/\(transition.id ?? UUID().uuidString)/audio.m4a")
            _ = try await audioRef.putFileAsync(from: audioURL)
            let downloadURL = try await audioRef.downloadURL()
            uploadedTransition = uploadedTransition.withAudioURL(downloadURL.absoluteString)
        }
        
        // Upload video if provided
        if let videoURL = videoURL {
            let videoRef = storage.reference().child("transitions/\(transition.id ?? UUID().uuidString)/video.mp4")
            _ = try await videoRef.putFileAsync(from: videoURL)
            let downloadURL = try await videoRef.downloadURL()
            uploadedTransition = uploadedTransition.withVideoURL(downloadURL.absoluteString)
        }
        
        // Save to Firestore
        try await db.collection("transitions").document(uploadedTransition.id ?? UUID().uuidString).setData(from: uploadedTransition)
        
        return uploadedTransition
    }
    
    func voteForTransition(id: String, rating: Double) async throws {
        let transitionRef = db.collection("transitions").document(id)
        let document = try await transitionRef.getDocument()
        
        guard let data = document.data(),
              let currentRating = data["rating"] as? Double,
              let voteCount = data["voteCount"] as? Int else {
            throw NSError(domain: "FirebaseError", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid transition data"])
        }
        
        let newVoteCount = voteCount + 1
        let newRating = ((currentRating * Double(voteCount)) + rating) / Double(newVoteCount)
        
        try await transitionRef.updateData([
            "rating": newRating,
            "voteCount": newVoteCount
        ])
    }
    
    func addComment(transitionId: String, author: String, text: String) async throws {
        let comment = TransitionComment(
            id: UUID().uuidString,
            author: author,
            authorId: Auth.auth().currentUser?.uid ?? "anonymous",
            text: text,
            createdAt: Date()
        )
        
        try await db.collection("transitions").document(transitionId)
            .updateData([
                "comments": FieldValue.arrayUnion([try! JSONEncoder().encode(comment)])
            ])
    }
}

// Extension to make DJTransition Firestore compatible
extension DJTransition: FirestoreEntity {
    static func fromFirestore(data: [String: Any]) -> DJTransition? {
        guard let jsonData = try? JSONSerialization.data(withJSONObject: data),
              let transition = try? JSONDecoder().decode(DJTransition.self, from: jsonData) else {
            return nil
        }
        return transition
    }
}

protocol FirestoreEntity: Codable {
    static func fromFirestore(data: [String: Any]) -> Self?
}