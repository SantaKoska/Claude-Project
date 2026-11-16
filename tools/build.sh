#!/usr/bin/env bash
# Full build: voice sync -> frames -> music/sfx mix -> final MP4
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=${1:-out/reel.mp4}
python3 tools/sync.py
node tools/render.js 30 4
python3 tools/audio.py
mkdir -p "$(dirname "$OUT")"
ffmpeg -v error -y -i build/video.mp4 -i build/mix.wav -map 0:v -map 1:a -c:v copy \
  -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "$OUT"
echo "done -> $OUT"
