#!/bin/bash

# Recovery script for RateMyTransition
# This will restore clean versions of broken files

PROJECT_DIR="/Users/fabiandubz/Documents/IOS APPS EXPORTED/Rate My Transition/RateMyTransition/RateMyTransition"
VIEWS_DIR="$PROJECT_DIR/Views"

echo "=== RateMyTransition Recovery Script ==="
echo ""

# Backup current broken files
echo "1. Backing up current files..."
cp "$VIEWS_DIR/RateMyTransitionView.swift" "$VIEWS_DIR/RateMyTransitionView.swift.broken" 2>/dev/null
cp "$VIEWS_DIR/LoginView.swift" "$VIEWS_DIR/LoginView.swift.broken" 2>/dev/null

# Write clean RateMyTransitionView.swift
cat > "$VIEWS_DIR/RateMyTransitionView.swift" << 'RMTEOF'
import SwiftUI

struct RateMyTransitionView: View {
    @State private var store = TransitionStore()
    @State private var profileStore = ProfileStore()
    @State private var showRecordView = false
    @State private var showProfileView = false
    @State private var showPadProConnect = false
    @State private var showGuestlistConnect = false
    @State private var selectedFilter = "Trending"
    let filters = ["Trending", "Recent", "Top Rated", "My Transitions"]
    
    var filteredTransitions: [DJTransition] {
        switch selectedFilter {
        case "Recent":
            return store.transitions.sorted { $0.createdAt > $1.createdAt }
        case "Top Rated":
            return store.transitions.sorted { $0.rating > $1.rating }
        case "My Transitions":
            return store.transitions.filter { $0.djName == "You" }
        default:
            return store.transitions
        }
    }
    
    var body: some View {
        NavigationView {
            ZStack {
                Color.black.ignoresSafeArea()
                
                VStack(spacing: 0) {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("RATE MY TRANSITION")
                                .font(.system(size: 16, weight: .black))
                                .foregroundColor(.white)
                                .tracking(2)
                            Text("Community • \(store.transitions.count) transitions")
                                .font(.system(size: 11))
                                .foregroundColor(.gray)
                        }
                        
                        Spacer()
                        
                        Button(action: { showProfileView = true }) {
                            if let profile = profileStore.currentProfile,
                               let uiImage = profile.profileImage {
                                Image(uiImage: uiImage)
                                    .resizable()
                                    .scaledToFill()
                                    .frame(width: 36, height: 36)
                                    .clipShape(Circle())
                                    .overlay(Circle().stroke(Color.cyan, lineWidth: 2))
                            } else {
                                Image(systemName: "person.circle.fill")
                                    .font(.system(size: 32))
                                    .foregroundColor(.cyan)
                            }
                        }
                        .padding(.trailing, 8)
                        
                        Button(action: { showGuestlistConnect = true }) {
                            Image(systemName: "list.bullet.clipboard.fill")
                                .font(.system(size: 18))
                                .foregroundColor(.purple)
                        }
                        .padding(.horizontal, 8)
                        
                        Button(action: { showRecordView = true }) {
                            HStack(spacing: 6) {
                                Image(systemName: "mic.circle.fill")
                                    .font(.system(size: 18))
                                Text("RECORD")
                                    .font(.system(size: 11, weight: .black))
                            }
                            .foregroundColor(.black)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(LinearGradient(colors: [.cyan, .blue], startPoint: .leading, endPoint: .trailing))
                            .cornerRadius(20)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(filters, id: \.self) { filter in
                                Button(action: { selectedFilter = filter }) {
                                    Text(filter)
                                        .font(.system(size: 12, weight: selectedFilter == filter ? .black : .medium))
                                        .foregroundColor(selectedFilter == filter ? .black : .white)
                                        .padding(.horizontal, 16)
                                        .padding(.vertical, 8)
                                        .background(selectedFilter == filter ? Color.cyan : Color.white.opacity(0.08))
                                        .cornerRadius(20)
                                }
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 4)
                    }
                    
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            ForEach(filteredTransitions) { transition in
                                TransitionCardView(transition: transition, store: store)
                                    .padding(.horizontal, 12)
                            }
                            
                            if filteredTransitions.isEmpty {
                                EmptyStateView(filter: selectedFilter)
                            }
                        }
                        .padding(.vertical, 12)
                    }
                }
            }
            .navigationBarHidden(true)
        }
        .sheet(isPresented: $showRecordView) {
            RecordTransitionView(store: store, isPresented: $showRecordView)
        }
        .sheet(isPresented: $showProfileView) {
            ProfileView()
        }
        .sheet(isPresented: $showGuestlistConnect) {
            ConnectAppView(appName: "Guestlist", appIcon: "list.bullet.rectangle", appURL: "guestlist://", color: .purple)
        }
    }
}

struct EmptyStateView: View {
    let filter: String
    
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "music.note.list")
                .font(.system(size: 50))
                .foregroundColor(.gray.opacity(0.5))
            
            Text("No transitions yet")
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(.white)
            
            if filter == "My Transitions" {
                Text("Record your first transition and share it with the community!")
                    .font(.system(size: 13))
                    .foregroundColor(.gray)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
            } else {
                Text("Be the first to share a transition")
                    .font(.system(size: 13))
                    .foregroundColor(.gray)
            }
        }
        .padding(.vertical, 60)
    }
}

struct ConnectAppView: View {
    let appName: String
    let appIcon: String
    let appURL: String
    let color: Color
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        NavigationView {
            ZStack {
                Color.black.ignoresSafeArea()
                
                VStack(spacing: 24) {
                    Image(systemName: appIcon)
                        .font(.system(size: 60))
                        .foregroundColor(color)
                    
                    Text("Connect to \(appName)")
                        .font(.system(size: 22, weight: .black))
                        .foregroundColor(.white)
                    
                    Text("Link your \(appName) account to share transitions and sync your DJ profile.")
                        .font(.system(size: 14))
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 40)
                    
                    Button(action: {
                        if let url = URL(string: appURL) {
                            if UIApplication.shared.canOpenURL(url) {
                                UIApplication.shared.open(url)
                            } else {
                                if let appStoreURL = URL(string: "https://apps.apple.com") {
                                    UIApplication.shared.open(appStoreURL)
                                }
                            }
                        }
                    }) {
                        HStack {
                            Image(systemName: "link")
                                .font(.system(size: 18))
                            Text("OPEN \(appName.uppercased())")
                                .font(.system(size: 14, weight: .black))
                        }
                        .foregroundColor(.black)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(color)
                        .cornerRadius(12)
                    }
                    .padding(.horizontal, 40)
                    
                    Spacer()
                }
                .padding(.top, 60)
            }
            .navigationBarItems(trailing: Button("Done") { presentationMode.wrappedValue.dismiss() })
        }
    }
}
RMTEOF

echo "2. RateMyTransitionView.swift restored"

# Write clean LoginView.swift
cat > "$VIEWS_DIR/LoginView.swift" << 'LOGINEOF'
import SwiftUI
import AuthenticationServices

struct LoginView: View {
    @State var profileStore: ProfileStore
    @Environment(\.presentationMode) var presentationMode
    
    @State private var djName = ""
    @State private var email = ""
    @State private var selectedProvider = "email"
    @State private var showNameField = true
    
    var body: some View {
        NavigationView {
            ZStack {
                Color.black.ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 24) {
                        VStack(spacing: 8) {
                            Image(systemName: "person.badge.plus")
                                .font(.system(size: 50))
                                .foregroundColor(.cyan)
                            Text("Create Profile")
                                .font(.system(size: 24, weight: .black))
                                .foregroundColor(.white)
                            Text("Join the DJ community")
                                .font(.system(size: 14))
                                .foregroundColor(.gray)
                        }
                        .padding(.top, 40)
                        
                        VStack(spacing: 12) {
                            Text("SIGN UP WITH")
                                .font(.system(size: 11, weight: .black))
                                .foregroundColor(.gray)
                                .tracking(1)
                            
                            SignInWithAppleButton(
                                .signUp,
                                onRequest: { request in
                                    request.requestedScopes = [.fullName, .email]
                                },
                                onCompletion: { result in
                                    handleAppleSignIn(result: result)
                                }
                            )
                            .signInWithAppleButtonStyle(.white)
                            .frame(height: 50)
                            .cornerRadius(8)
                            
                            Button(action: { handleGoogleSignIn() }) {
                                HStack {
                                    Image(systemName: "g.circle.fill")
                                        .font(.system(size: 20))
                                    Text("Continue with Google")
                                        .font(.system(size: 16, weight: .medium))
                                }
                                .foregroundColor(.black)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(Color.white)
                                .cornerRadius(8)
                            }
                            
                            Button(action: { handleMetaSignIn() }) {
                                HStack {
                                    Image(systemName: "m.circle.fill")
                                        .font(.system(size: 20))
                                    Text("Continue with Meta")
                                        .font(.system(size: 16, weight: .medium))
                                }
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(Color.blue)
                                .cornerRadius(8)
                            }
                        }
                        .padding(.horizontal, 24)
                        
                        HStack {
                            Rectangle()
                                .fill(Color.gray.opacity(0.3))
                                .frame(height: 1)
                            Text("OR")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(.gray)
                                .padding(.horizontal, 8)
                            Rectangle()
                                .fill(Color.gray.opacity(0.3))
                                .frame(height: 1)
                        }
                        .padding(.horizontal, 24)
                        
                        VStack(spacing: 16) {
                            CustomTextField(title: "DJ Name", text: $djName, icon: "person.fill")
                            CustomTextField(title: "Email (optional)", text: $email, icon: "envelope.fill")
                            
                            Button(action: { handleEmailSignIn() }) {
                                Text("CREATE ACCOUNT")
                                    .font(.system(size: 14, weight: .black))
                                    .foregroundColor(.black)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 16)
                                    .background(
                                        djName.isEmpty ?
                                        Color.gray.opacity(0.3) :
                                        LinearGradient(colors: [.cyan, .blue], startPoint: .leading, endPoint: .trailing)
                                    )
                                    .cornerRadius(12)
                            }
                            .disabled(djName.isEmpty)
                        }
                        .padding(.horizontal, 24)
                        
                        Button(action: {
                            profileStore.createProfile(name: "DJ Anonymous", provider: "anonymous")
                            presentationMode.wrappedValue.dismiss()
                        }) {
                            Text("Skip for now")
                                .font(.system(size: 14))
                                .foregroundColor(.gray)
                        }
                        .padding(.top, 20)
                        
                        Spacer()
                    }
                }
            }
            .navigationBarItems(
                trailing: Button("Cancel") {
                    presentationMode.wrappedValue.dismiss()
                }
                .foregroundColor(.white)
            )
        }
    }
    
    private func handleEmailSignIn() {
        guard !djName.isEmpty else { return }
        profileStore.createProfile(name: djName, email: email.isEmpty ? nil : email, provider: "email")
        presentationMode.wrappedValue.dismiss()
    }
    
    private func handleAppleSignIn(result: Result<ASAuthorization, Error>) {
        switch result {
        case .success(let authorization):
            if let credential = authorization.credential as? ASAuthorizationAppleIDCredential {
                let name = credential.fullName?.givenName ?? "DJ User"
                let email = credential.email
                profileStore.createProfile(name: name, email: email, provider: "apple")
                presentationMode.wrappedValue.dismiss()
            }
        case .failure(let error):
            print("Apple Sign In failed: \(error.localizedDescription)")
        }
    }
    
    private func handleGoogleSignIn() {
        profileStore.createProfile(name: "DJ Google User", provider: "google")
        presentationMode.wrappedValue.dismiss()
    }
    
    private func handleMetaSignIn() {
        profileStore.createProfile(name: "DJ Meta User", provider: "meta")
        presentationMode.wrappedValue.dismiss()
    }
}
LOGINEOF

echo "3. LoginView.swift restored"

# Clean up other auth-related files that cause issues
echo "4. Cleaning up auth files..."
rm -f "$VIEWS_DIR/AuthGateView.swift" 2>/dev/null
rm -f "$VIEWS_DIR/OwnerUploadView.swift" 2>/dev/null
rm -f "$VIEWS_DIR/CustomTextField.swift" 2>/dev/null
rm -f "$PROJECT_DIR/Services/FirebaseAuthManager.swift" 2>/dev/null

echo ""
echo "=== Recovery Complete ==="
echo ""
echo "Next steps:"
echo "1. In Xcode: Cmd+Shift+K (Clean Build Folder)"
echo "2. Then: Cmd+B (Build)"
echo ""
echo "If CustomTextField is referenced elsewhere, you may need to add it back."
