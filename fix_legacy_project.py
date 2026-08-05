#!/usr/bin/env python3
import sys

project_path = "/Users/fabiandubz/Documents/IOS APPS EXPORTED/PadPro7.5.1_Legacy_Universal/PadPro7.5.1.xcodeproj/project.pbxproj"

with open(project_path, 'r') as f:
    content = f.read()

# Count replacements
old_deploy = content.count('IPHONEOS_DEPLOYMENT_TARGET = 16.6;')
old_bundle = content.count('PRODUCT_BUNDLE_IDENTIFIER = com.diffopps.PadProApp;')

content = content.replace('IPHONEOS_DEPLOYMENT_TARGET = 16.6;', 'IPHONEOS_DEPLOYMENT_TARGET = 15.0;')
content = content.replace('PRODUCT_BUNDLE_IDENTIFIER = com.diffopps.PadProApp;', 'PRODUCT_BUNDLE_IDENTIFIER = com.diffopps.PadProAppLegacy;')

with open(project_path, 'w') as f:
    f.write(content)

print(f"Updated {old_deploy} deployment targets (16.6 → 15.0)")
print(f"Updated {old_bundle} bundle IDs (PadProApp → PadProAppLegacy)")
print("Done!")
