#!/usr/bin/env python3
"""
Swift Brace Validator
Checks if a Swift file has matching braces, considering comments and strings.
"""

import sys
import re

def validate_swift_braces(filepath):
    """Check if braces are balanced in a Swift file."""
    try:
        with open(filepath, 'r') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        return False
    
    # Remove comments and string literals to avoid false positives
    # First, handle multi-line comments
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    
    # Handle single-line comments
    content = re.sub(r'//.*$', '', content, flags=re.MULTILINE)
    
    # Handle string literals (basic approach - may need refinement)
    content = re.sub(r'".*?"', 'STRING_LITERAL', content)
    
    # Now count braces
    open_count = content.count('{')
    close_count = content.count('}')
    
    print(f"File: {filepath}")
    print(f"Opening braces: {{   = {open_count}")
    print(f"Closing braces: }}   = {close_count}")
    print(f"Difference: {close_count - open_count}")
    
    if open_count == close_count:
        print("✅ Braces are balanced!")
        return True
    else:
        print(f"❌ Mismatch! Missing {open_count - close_count if open_count > close_count else close_count - open_count} {'opening' if open_count > close_count else 'closing'} braces")
        
        # Try to find line numbers of unmatched braces
        lines = content.split('\n')
        stack = []
        
        for line_num, line in enumerate(lines, 1):
            for char_num, char in enumerate(line, 1):
                if char == '{':
                    stack.append((line_num, char_num))
                elif char == '}':
                    if stack:
                        stack.pop()
                    else:
                        print(f"  Extra closing brace at line {line_num}, col {char_num}")
        
        # Remaining items in stack are unmatched opening braces
        for line_num, char_num in stack:
            print(f"  Unmatched opening brace at line {line_num}, col {char_num}")
        
        return False

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 brace_validator.py <swift_file>")
        sys.exit(1)
    
    filepath = sys.argv[1]
    is_valid = validate_swift_braces(filepath)
    sys.exit(0 if is_valid else 1)
