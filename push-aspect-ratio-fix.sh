#!/bin/bash
cd "/Users/fabiandubz/Documents/The Guestlist/glst-site"
git add -f components/LiveKitPlayer.tsx
git commit -m "Fix video aspect ratio - 9/16 portrait with proper styling"
git push origin main --force
echo "Done! Check AWS Amplify for build status."