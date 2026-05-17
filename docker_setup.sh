#!/bin/bash
# Add Docker to PATH for Git Bash / WSL / Cygwin on Windows
# Run this script at the start of each session, or add to ~/.bashrc

DOCKER_PATH="/c/Program Files/Docker/Docker/resources/bin"

if [ -d "$DOCKER_PATH" ]; then
    export PATH="$PATH:$DOCKER_PATH"
    echo "✅ Docker added to PATH"
    docker --version 2>/dev/null
else
    echo "❌ Docker not found at $DOCKER_PATH"
fi
