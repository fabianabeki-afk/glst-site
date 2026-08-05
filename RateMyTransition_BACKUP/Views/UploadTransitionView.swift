import SwiftUI

struct UploadTransitionView: View {
    @ObservedObject var store: TransitionStore
    @Environment(\.presentationMode) var presentationMode
    
    @State private var trackFrom = ""
    @State private var trackTo = ""
    @State private var genre = "House"
    @State private var isVideo = false
    @State private var showAudioPicker = false
    @State private var showVideoPicker = false
    @State private var audioURL: URL?
    @State private var videoURL: URL?
    
    let genres = ["House", "Techno", "Hip Hop", "Drum & Bass", "Dubstep", "Trance", "EDM", "Trap"]
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Track Information").foregroundColor(.yellow)) {
                    TextField("From Track", text: $trackFrom)
                        .autocapitalization(.words)
                    
                    TextField("To Track", text: $trackTo)
                        .autocapitalization(.words)
                    
                    Picker("Genre", selection: $genre) {
                        ForEach(genres, id: \.self) { genre in
                            Text(genre).tag(genre)
                        }
                    }
                }
                
                Section(header: Text("Content Type").foregroundColor(.yellow)) {
                    Toggle("Is Video Transition", isOn: $isVideo)
                    
                    if isVideo {
                        Button("Select Video") {
                            showVideoPicker = true
                        }
                        .foregroundColor(.yellow)
                    } else {
                        Button("Select Audio") {
                            showAudioPicker = true
                        }
                        .foregroundColor(.yellow)
                    }
                }
                
                Section {
                    Button("Upload Transition") {
                        submitTransition()
                    }
                    .frame(maxWidth: .infinity)
                    .foregroundColor(.black)
                    .padding()
                    .background(Color.yellow)
                    .cornerRadius(10)
                    .disabled(trackFrom.isEmpty || trackTo.isEmpty)
                }
            }
            .navigationTitle("Upload Transition")
            .navigationBarItems(trailing: Button("Cancel") {
                presentationMode.wrappedValue.dismiss()
            })
        }
    }
    
    private func submitTransition() {
        let transition = DJTransition(
            id: UUID().uuidString,
            djName: "You",
            djId: "",
            djImageURL: nil,
            trackFrom: trackFrom,
            trackTo: trackTo,
            genre: genre,
            rating: 0.0,
            voteCount: 0,
            audioURL: audioURL?.absoluteString,
            videoURL: videoURL?.absoluteString,
            waveformData: nil,
            createdAt: Date(),
            comments: [],
            reactions: [],
            isVideo: isVideo
        )
        store.addTransition(transition)
        presentationMode.wrappedValue.dismiss()
    }
}

#Preview {
    UploadTransitionView(store: TransitionStore())
}