# AI Signal

default:
    @just --list

# Run the scorer smoke test
test:
    node test/run.js

# Build the zip the Chrome Web Store takes: dist/ai-signal-<version>.zip
package:
    #!/usr/bin/env bash
    set -euo pipefail
    v=$(node -p "require('./manifest.json').version")
    mkdir -p dist
    rm -f "dist/ai-signal-$v.zip"
    zip -qr "dist/ai-signal-$v.zip" manifest.json src popup icons LICENSE -x '*.DS_Store'
    unzip -l "dist/ai-signal-$v.zip" | tail -1
    echo "dist/ai-signal-$v.zip"
