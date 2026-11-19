#!/usr/bin/env bash
# Full build: voice sync -> frames -> music/sfx mix -> final MP4
# Usage: tools/build.sh [page.html] [out.mp4]
set -euo pipefail
cd "$(dirname "$0")/.."
HTML=${1:-index.html}
STEM=$(basename "$HTML" .html)
OUT=${2:-out/$STEM.mp4}
python3 tools/sync.py "$HTML"
node tools/render.js "$HTML" 30 ${WORKERS:-4}
python3 tools/audio.py "$STEM"
mkdir -p "$(dirname "$OUT")"
ffmpeg -v error -y -i "build/$STEM/video.mp4" -i "build/$STEM/mix.wav" -map 0:v -map 1:a -c:v copy \
  -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "$OUT"
echo "done -> $OUT"
