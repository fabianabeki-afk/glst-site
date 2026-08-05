#!/bin/zsh

# Copy all auth/owner files from RMT OLD to the REAL project

echo "Copying files to real project..."

# Models
mkdir -p "/Users/fabiandubz/Documents/IOS APPS EXPORTED/Rate My Transition/RateMyTransition/Models"
cp "/Users/fabiandubz/Documents/RMT OLD/RateMyTransition/Models/ProfileModels.swift" "/Users/fabiandubz/Documents/IOS APPS EXPORTED/Rate My Transition/RateMyTransition/Models/ProfileModels.swift"
cp "/Users/fabiandubz/Documents/RMT OLD/RateMyTransition/Models/TransitionModels.swift" "/Users/fabiandubz/Documents/IOS APPS EXPORTED/Rate My Transition/RateMyTransition/Models/TransitionModels.swift"

# Views
mkdir -p "/Users/fabiandubz/Documents/IOS APPS EXPORTED/Rate My Transition/RateMyTransition/Views"
cp "/Users/fabiandubz/Documents/RMT OLD/RateMyTransition/Views/AuthGateView.swift" "/Users/fabiandubz/Documents/IOS APPS EXPORTED/Rate My Transition/RateMyTransition/Views/AuthGateView.swift"
cp "/Users/fabiandubz/Documents/RMT OLD/RateMyTransition/Views/OwnerUploadView.swift" "/Users/fabiandubz/Documents/IOS APPS EXPORTED/Rate My Transition/RateMyTransition/Views/OwnerUploadView.swift"

# Services
mkdir -p "/Users/fabiandubz/Documents/IOS APPS EXPORTED/Rate My Transition/RateMyTransition/Services"
cp "/Users/fabiandubz/Documents/RMT OLD/RateMyTransition/Services/FirebaseAuthManager.swift" "/Users/fabiandubz/Documents/IOS APPS EXPORTED/Rate My Transition/RateMyTransition/Services/FirebaseAuthManager.swift"

# Overwrite existing files with updated versions
cp "/Users/fabiandubz/Documents/RMT OLD/RateMyTransition/ContentView.swift" "/Users/fabiandubz/Documents/IOS APPS EXPORTED/Rate My Transition/RateMyTransition/ContentView.swift"
cp "/Users/fabiandubz/Documents/RMT OLD/RateMyTransition/Views/SplashScreenView.swift" "/Users/fabiandubz/Documents/IOS APPS EXPORTED/Rate My Transition/RateMyTransition/Views/SplashScreenView.swift"
cp "/Users/fabiandubz/Documents/RMT OLD/RateMyTransition/Views/RateMyTransitionView.swift" "/Users/fabiandubz/Documents/IOS APPS EXPORTED/Rate My Transition/RateMyTransition/Views/RateMyTransitionView.swift"
cp "/Users/fabiandubz/Documents/RMT OLD/RateMyTransition/Views/ProfileView.swift" "/Users/fabiandubz/Documents/IOS APPS EXPORTED/Rate My Transition/RateMyTransition/Views/ProfileView.swift"

echo "✅ Files copied successfully!"
echo ""
echo "Next steps:"
echo "1. Open Xcode"
echo "2. Right-click Models folder → Add Files to 'RateMyTransition'..."
echo "3. Select: ProfileModels.swift, TransitionModels.swift"
echo "4. Repeat for Views: AuthGateView.swift, OwnerUploadView.swift"
echo "5. Repeat for Services: FirebaseAuthManager.swift"
echo "6. Make sure 'Create groups' is selected and 'Copy items if needed' is UNCHECKED"
echo "7. Build and run!"
