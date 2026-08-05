#!/bin/bash

# Fix CustomTextField and RecordTransitionView

PROJECT_DIR="/Users/fabiandubz/Documents/IOS APPS EXPORTED/Rate My Transition/RateMyTransition/RateMyTransition"
VIEWS_DIR="$PROJECT_DIR/Views"

echo "=== Fixing Remaining Issues ==="

# 1. Restore CustomTextField.swift
cat > "$VIEWS_DIR/CustomTextField.swift" << 'FIELDEEOF'
import SwiftUI

struct CustomTextField: View {
    let title: String
    @Binding var text: String
    let icon: String
    var isSecure: Bool = false
    var keyboardType: UIKeyboardType = .default
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.gray)
            
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 16))
                    .foregroundColor(.cyan)
                
                if isSecure {
                    SecureField("", text: $text)
                        .font(.system(size: 16))
                        .foregroundColor(.white)
                } else {
                    TextField("", text: $text)
                        .font(.system(size: 16))
                        .foregroundColor(.white)
                        .keyboardType(keyboardType)
                        .autocapitalization(.none)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(Color.white.opacity(0.08))
            .cornerRadius(12)
        }
    }
}
FIELDEEOF

echo "1. CustomTextField.swift restored"

# 2. Fix deprecated requestRecordPermission in RecordTransitionView
# Use sed to replace the deprecated call
if [ -f "$VIEWS_DIR/RecordTransitionView.swift" ]; then
    # Backup
    cp "$VIEWS_DIR/RecordTransitionView.swift" "$VIEWS_DIR/RecordTransitionView.swift.bak"
    
    # Replace deprecated requestRecordPermission
    sed -i '' 's/AVAudioSession.sharedInstance().requestRecordPermission/AVAudioApplication.requestRecordPermission/g' "$VIEWS_DIR/RecordTransitionView.swift"
    
    echo "2. RecordTransitionView.swift updated (deprecated API fixed)"
else
    echo "2. RecordTransitionView.swift not found - skipping"
fi

echo ""
echo "=== Fixes Complete ==="
echo "Clean build (Cmd+Shift+K) and rebuild (Cmd+B)"
