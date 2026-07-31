#!/usr/bin/env bash
# Start local Firestore emulator (does not touch production / study data).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Prefer Homebrew OpenJDK if present (gcloud/firebase emulator needs a real JDK).
if [[ -d /opt/homebrew/opt/openjdk@21 ]]; then
  export JAVA_HOME="/opt/homebrew/opt/openjdk@21"
  export PATH="$JAVA_HOME/bin:$PATH"
elif [[ -d /usr/local/opt/openjdk@21 ]]; then
  export JAVA_HOME="/usr/local/opt/openjdk@21"
  export PATH="$JAVA_HOME/bin:$PATH"
fi

if ! command -v java >/dev/null 2>&1; then
  echo "ERROR: Java is required for the Firestore emulator."
  echo "Install with: brew install openjdk@21"
  exit 1
fi

if ! command -v firebase >/dev/null 2>&1; then
  echo "ERROR: firebase CLI not found."
  echo "Install with: npm install -g firebase-tools"
  exit 1
fi

echo "Starting Firestore emulator on localhost:8080"
echo "Emulator UI: http://localhost:4000"
echo "Point backend at it with: FIRESTORE_EMULATOR_HOST=localhost:8080"
echo ""

exec firebase emulators:start --only firestore --project robert-kraut-1234
