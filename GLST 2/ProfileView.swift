import SwiftUI

struct ProfileView: View {
    @Binding var isPresented: Bool
    @State private var displayName = "DJ Fabian"
    @State private var bio = ""
    @State private var genres: [String] = []
    @State private var genreInput = ""
    @State private var avatarUrl = ""
    @State private var instagram = ""
    @State private var twitter = ""
    @State private var soundcloud = ""
    @State private var mixcloud = ""
    @State private var isSaving = false
    @State private var showImagePicker = false
    @State private var selectedImageData: Data?
    
    var body: some View {
        NavigationView {
            Form {
                // Avatar Section
                Section(header: Text("AVATAR").font(.system(.caption, design: .monospaced))) {
                    HStack {
                        Spacer()
                        VStack {
                            if let imageData = selectedImageData,
                               let uiImage = UIImage(data: imageData) {
                                Image(uiImage: uiImage)
                                    .resizable()
                                    .aspectRatio(contentMode: .fill)
                                    .frame(width: 100, height: 100)
                                    .clipShape(Circle())
                            } else if !avatarUrl.isEmpty {
                                AsyncImage(url: URL(string: avatarUrl)) { image in
                                    image
                                        .resizable()
                                        .aspectRatio(contentMode: .fill)
                                } placeholder: {
                                    ProgressView()
                                }
                                .frame(width: 100, height: 100)
                                .clipShape(Circle())
                            } else {
                                Circle()
                                    .fill(Color(red: 0.831, green: 0.686, blue: 0.216))
                                    .frame(width: 100, height: 100)
                                    .overlay(
                                        Text(String(displayName.prefix(2)).uppercased())
                                            .font(.system(.title, design: .monospaced))
                                            .fontWeight(.black)
                                            .foregroundColor(.black)
                                    )
                            }
                            
                            Button(action: { showImagePicker = true }) {
                                Text("CHANGE AVATAR")
                                    .font(.system(.caption, design: .monospaced))
                                    .fontWeight(.bold)
                                    .foregroundColor(Color(red: 0.831, green: 0.686, blue: 0.216))
                            }
                        }
                        Spacer()
                    }
                    .padding(.vertical, 10)
                }
                
                // Basic Info
                Section(header: Text("BASIC INFO").font(.system(.caption, design: .monospaced))) {
                    TextField("Display Name", text: $displayName)
                        .font(.system(.body, design: .monospaced))
                    
                    TextEditor(text: $bio)
                        .font(.system(.body, design: .monospaced))
                        .frame(minHeight: 80)
                        .overlay(
                            Group {
                                if bio.isEmpty {
                                    Text("Tell fans about your sound...")
                                        .foregroundColor(.gray)
                                        .padding(.top, 8)
                                        .padding(.leading, 5)
                                }
                            }, alignment: .topLeading
                        )
                }
                
                // Genres
                Section(header: Text("GENRES").font(.system(.caption, design: .monospaced))) {
                    HStack {
                        TextField("Add genre", text: $genreInput)
                            .font(.system(.body, design: .monospaced))
                        
                        Button(action: addGenre) {
                            Image(systemName: "plus.circle.fill")
                                .foregroundColor(Color(red: 0.831, green: 0.686, blue: 0.216))
                        }
                    }
                    
                    FlowLayout(spacing: 8) {
                        ForEach(genres, id: \.self) { genre in
                            HStack {
                                Text(genre)
                                    .font(.system(.caption, design: .monospaced))
                                    .fontWeight(.bold)
                                Button(action: { removeGenre(genre) }) {
                                    Image(systemName: "xmark.circle.fill")
                                        .font(.caption)
                                }
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color(red: 0.831, green: 0.686, blue: 0.216).opacity(0.2))
                            .foregroundColor(Color(red: 0.831, green: 0.686, blue: 0.216))
                            .cornerRadius(20)
                        }
                    }
                }
                
                // Social Links
                Section(header: Text("SOCIAL LINKS").font(.system(.caption, design: .monospaced))) {
                    TextField("Instagram", text: $instagram)
                        .font(.system(.body, design: .monospaced))
                    TextField("Twitter", text: $twitter)
                        .font(.system(.body, design: .monospaced))
                    TextField("SoundCloud", text: $soundcloud)
                        .font(.system(.body, design: .monospaced))
                    TextField("Mixcloud", text: $mixcloud)
                        .font(.system(.body, design: .monospaced))
                }
                
                // Save Button
                Section {
                    Button(action: saveProfile) {
                        HStack {
                            Spacer()
                            if isSaving {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .black))
                            } else {
                                Text("SAVE PROFILE")
                                    .font(.system(.headline, design: .monospaced))
                                    .fontWeight(.black)
                            }
                            Spacer()
                        }
                    }
                    .disabled(isSaving)
                    .listRowBackground(Color(red: 0.831, green: 0.686, blue: 0.216))
                    .foregroundColor(.black)
                }
            }
            .navigationTitle("EDIT PROFILE")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("CLOSE") {
                        isPresented = false
                    }
                    .font(.system(.caption, design: .monospaced))
                    .fontWeight(.bold)
                }
            }
            .sheet(isPresented: $showImagePicker) {
                ImagePicker(selectedImageData: $selectedImageData, onImageSelected: { data in
                    if let data = data {
                        uploadAvatar(imageData: data)
                    }
                })
            }
        }
    }
    
    func addGenre() {
        let trimmed = genreInput.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty, !genres.contains(trimmed) else { return }
        genres.append(trimmed)
        genreInput = ""
    }
    
    func removeGenre(_ genre: String) {
        genres.removeAll { $0 == genre }
    }
    
    func saveProfile() {
        isSaving = true
        
        // Get userId from UserDefaults or generate one
        let userId = UserDefaults.standard.string(forKey: "user_id") ?? UUID().uuidString
        UserDefaults.standard.set(userId, forKey: "user_id")
        
        // Create profile data with userId
        let profileData: [String: Any] = [
            "userId": userId,
            "display_name": displayName,
            "bio": bio,
            "genres": genres,
            "social_links": [
                "instagram": instagram,
                "twitter": twitter,
                "soundcloud": soundcloud,
                "mixcloud": mixcloud
            ]
        ]
        
        // Call Guestlist API to save profile
        Task {
            do {
                guard let url = URL(string: "https://www.guestlist.tv/api/dj-profile") else {
                    throw URLError(.badURL)
                }
                
                var request = URLRequest(url: url)
                request.httpMethod = "POST"
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                
                // Add auth token if available
                if let token = UserDefaults.standard.string(forKey: "auth_token") {
                    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
                }
                
                request.httpBody = try JSONSerialization.data(withJSONObject: profileData)
                
                let (_, response) = try await URLSession.shared.data(for: request)
                
                if let httpResponse = response as? HTTPURLResponse {
                    if httpResponse.statusCode == 200 {
                        print("Profile saved successfully")
                        
                        // Save locally too
                        UserDefaults.standard.set(displayName, forKey: "dj_name")
                        UserDefaults.standard.set(bio, forKey: "dj_bio")
                        UserDefaults.standard.set(genres, forKey: "dj_genres")
                    } else {
                        print("Failed to save profile - Status: \(httpResponse.statusCode)")
                    }
                } else {
                    print("Failed to save profile - No HTTP response")
                }
            } catch {
                print("Error saving profile: \(error)")
            }
            
            await MainActor.run {
                isSaving = false
                isPresented = false
            }
        }
    }
    
    // Avatar upload function
    func uploadAvatar(imageData: Data) {
        guard let url = URL(string: "https://www.guestlist.tv/api/upload-avatar") else { return }
        
        let userId = UserDefaults.standard.string(forKey: "user_id") ?? UUID().uuidString
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        
        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        var body = Data()
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"userId\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(userId)\r\n".data(using: .utf8)!)
        
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"avatar.jpg\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
        body.append(imageData)
        body.append("\r\n".data(using: .utf8)!)
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        
        request.httpBody = body
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("Upload error: \(error)")
                return
            }
            
            if let data = data,
               let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let url = json["url"] as? String {
                DispatchQueue.main.async {
                    self.avatarUrl = url
                }
            }
        }.resume()
    }
}

// Image Picker
struct ImagePicker: UIViewControllerRepresentable {
    @Binding var selectedImageData: Data?
    var onImageSelected: (Data?) -> Void
    @Environment(\.presentationMode) var presentationMode
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.delegate = context.coordinator
        picker.allowsEditing = true
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UINavigationControllerDelegate, UIImagePickerControllerDelegate {
        let parent: ImagePicker
        
        init(_ parent: ImagePicker) {
            self.parent = parent
        }
        
        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            if let image = info[.editedImage] as? UIImage ?? info[.originalImage] as? UIImage {
                if let data = image.jpegData(compressionQuality: 0.8) {
                    parent.selectedImageData = data
                    parent.onImageSelected(data)
                }
            }
            parent.presentationMode.wrappedValue.dismiss()
        }
        
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.presentationMode.wrappedValue.dismiss()
        }
    }
}

// Helper view for flowing layout
struct FlowLayout: Layout {
    var spacing: CGFloat = 8
    
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = FlowResult(in: proposal.width ?? 0, subviews: subviews, spacing: spacing)
        return result.size
    }
    
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = FlowResult(in: bounds.width, subviews: subviews, spacing: spacing)
        for (index, subview) in subviews.enumerated() {
            subview.place(at: CGPoint(x: result.positions[index].x + bounds.minX,
                                      y: result.positions[index].y + bounds.minY),
                         proposal: .unspecified)
        }
    }
    
    struct FlowResult {
        var size: CGSize = .zero
        var positions: [CGPoint] = []
        
        init(in maxWidth: CGFloat, subviews: Subviews, spacing: CGFloat) {
            var x: CGFloat = 0
            var y: CGFloat = 0
            var lineHeight: CGFloat = 0
            
            for subview in subviews {
                let size = subview.sizeThatFits(.unspecified)
                
                if x + size.width > maxWidth {
                    x = 0
                    y += lineHeight + spacing
                    lineHeight = 0
                }
                
                positions.append(CGPoint(x: x, y: y))
                lineHeight = max(lineHeight, size.height)
                x += size.width + spacing
                
                self.size.width = max(self.size.width, x)
                self.size.height = max(self.size.height, y + lineHeight)
            }
        }
    }
}

struct ProfileView_Previews: PreviewProvider {
    static var previews: some View {
        ProfileView(isPresented: .constant(true))
    }
}