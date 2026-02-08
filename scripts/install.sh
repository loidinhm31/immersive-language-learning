#!/bin/bash
cd "$(dirname "$0")/.."
# Exit on error
set -e

echo "📦 Installing frontend dependencies..."
npm install

echo "Installing backend dependencies..."
pip3 install -r requirements.txt

echo "✅ Installation complete! You can now run ./dev.sh to start the app."
