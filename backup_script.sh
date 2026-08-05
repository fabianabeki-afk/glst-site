#!/bin/bash
# Backup script for GLST LiveKit version
cp -R /Users/fabiandubz/.openclaw/workspace/glst-backup/GLST-source /Users/fabiandubz/.openclaw/workspace/glst-backup/GLST_LiveKitBirth_$(date +%Y%m%d_%H%M%S)
echo "Backup created successfully"