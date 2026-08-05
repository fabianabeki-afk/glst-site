#!/usr/bin/env python3
"""
Swift Brace Fixer
Moves ChatMessageData before BroadcastView and fixes missing braces
"""

import sys
import re

def fix_swift_file(filepath):
    """Fix the ContentView.swift file."""
    try:
        with open(filepath, 'r') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        return False
    
    # Check if ChatMessageData is defined after BroadcastView
    broadcast_pos = content.find('struct BroadcastView: View {')
    chat_data_pos = content.find('struct ChatMessageData: Identifiable {')
    
    if broadcast_pos != -1 and chat_data_pos != -1 and chat_data_pos > broadcast_pos:
        print("Found ChatMessageData after BroadcastView - need to reorder")
        
        # Extract ChatMessageData block
        chat_data_end = content.find('}\n\nstruct StreamSettingsView', chat_data_pos)
        if chat_data_end == -1:
            chat_data_end = content.find('}\n\nstruct ContentView_Previews', chat_data_pos)
        
        if chat_data_end != -1:
            chat_data_block = content[chat_data_pos:chat_data_end+1]
            
            # Remove ChatMessageData from current position
            content = content[:chat_data_pos] + content[chat_data_end+1:]
            
            # Insert before BroadcastView
            content = content[:broadcast_pos] + chat_data_block + '\n\n' + content[broadcast_pos:]
            
            print("Moved ChatMessageData before BroadcastView")
    
    # Count braces to check balance
    open_count = content.count('{')
    close_count = content.count('}')
    
    print(f"Opening braces: {{ = {open_count}")
    print(f"Closing braces: }} = {close_count}")
    
    if open_count == close_count:
        print("✅ Braces are balanced!")
        with open(filepath, 'w') as f:
            f.write(content)
        return True
    else:
        print(f"❌ Still mismatched by {open_count - close_count}")
        # Try to add missing closing braces at the end
        diff = open_count - close_count
        if diff > 0:
            content += '\n' + ('}\n' * diff)
            print(f"Added {diff} closing braces at end")
            with open(filepath, 'w') as f:
                f.write(content)
            return True
    
    with open(filepath, 'w') as f:
        f.write(content)
    return False

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 fix_braces.py <swift_file>")
        sys.exit(1)
    
    filepath = sys.argv[1]
    success = fix_swift_file(filepath)
    sys.exit(0 if success else 1)
