import Foundation
import Combine

struct DJTransition: Identifiable, Codable {
    var id: String?
    let djName: String
    let djId: String
    let djImageURL: String?
    let trackFrom: String
    let trackTo: String
    let genre: String
    var rating: Double
    var voteCount: Int
    let audioURL: String?
    let videoURL: String?
    let waveformData: [Float]?
    let createdAt: Date
    var comments: [TransitionComment]
    var reactions: [TransitionReaction]
    let isVideo: Bool
}

struct TransitionComment: Identifiable, Codable {
    let id: String
    let author: String
    let authorId: String
    let text: String
    let createdAt: Date
}

struct TransitionReaction: Identifiable, Codable {
    let id: String
    let emoji: String
    let userId: String
    let count: Int
    let timestamp: Date
}

class TransitionStore: ObservableObject {
    @Published var transitions: [DJTransition] = []
    
    init() {
        // Load mock data
        transitions = [
            DJTransition(
                id: "1",
                djName: "DJ Shadow",
                djId: "",
                djImageURL: nil,
                trackFrom: "Midnight City",
                trackTo: "Instant Crush",
                genre: "Electronic",
                rating: 4.8,
                voteCount: 234,
                audioURL: nil,
                videoURL: nil,
                waveformData: nil,
                createdAt: Date().addingTimeInterval(-3600),
                comments: [],
                reactions: [],
                isVideo: false
            ),
            DJTransition(
                id: "2",
                djName: "DJ Snake",
                djId: "",
                djImageURL: nil,
                trackFrom: "Turn Down for What",
                trackTo: "Lean On",
                genre: "EDM",
                rating: 4.5,
                voteCount: 189,
                audioURL: nil,
                videoURL: nil,
                waveformData: nil,
                createdAt: Date().addingTimeInterval(-7200),
                comments: [],
                reactions: [],
                isVideo: false
            ),
            DJTransition(
                id: "3",
                djName: "Carl Cox",
                djId: "",
                djImageURL: nil,
                trackFrom: "I Want You",
                trackTo: "Your Mind",
                genre: "Techno",
                rating: 4.9,
                voteCount: 567,
                audioURL: nil,
                videoURL: nil,
                waveformData: nil,
                createdAt: Date().addingTimeInterval(-86400),
                comments: [],
                reactions: [],
                isVideo: true
            )
        ]
    }
    
    func addTransition(_ transition: DJTransition) {
        var newTransition = transition
        newTransition.id = UUID().uuidString
        transitions.insert(newTransition, at: 0)
    }
    
    func voteForTransition(id: String, rating: Double) {
        if let index = transitions.firstIndex(where: { $0.id == id }) {
            let oldRating = transitions[index].rating
            let oldCount = transitions[index].voteCount
            let newCount = oldCount + 1
            let newRating = ((oldRating * Double(oldCount)) + rating) / Double(newCount)
            transitions[index].rating = newRating
            transitions[index].voteCount = newCount
        }
    }
    
    func addComment(transitionId: String, author: String, text: String) {
        if let index = transitions.firstIndex(where: { $0.id == transitionId }) {
            let comment = TransitionComment(
                id: UUID().uuidString,
                author: author,
                authorId: "You",
                text: text,
                createdAt: Date()
            )
            transitions[index].comments.append(comment)
        }
    }
}