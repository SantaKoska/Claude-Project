#!/usr/bin/env python3
"""Voice sync: detect phrases in the voiceover, tighten pauses, time every word,
and write the timings into index.html (<script id="timings">).

Usage: python3 tools/sync.py [index.html]
Reads CONFIG (<script id="config">) for the voice file, tempo and phrase list.
Writes build/voice_cut.wav and updates the timings block in index.html.
"""
import json, re, subprocess, sys, unicodedata, os
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "index.html")
SR = 48000
WIN = int(0.01 * SR)           # 10 ms analysis windows


def read_config(html):
    m = re.search(r'<script id="config" type="application/json">(.*?)</script>', html, re.S)
    return json.loads(m.group(1))


def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR),
                          "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def islands(x, thr_db, min_gap, min_len=0.05):
    """Voiced intervals (seconds): window peak above threshold, gaps < min_gap merged."""
    n = len(x) // WIN
    peak = np.abs(x[: n * WIN]).reshape(n, WIN).max(axis=1)
    voiced = peak > 10 ** (thr_db / 20)
    segs, start = [], None
    for i, v in enumerate(voiced):
        if v and start is None:
            start = i
        elif not v and start is not None:
            segs.append([start * 0.01, i * 0.01]); start = None
    if start is not None:
        segs.append([start * 0.01, n * 0.01])
    merged = []
    for s in segs:
        if merged and s[0] - merged[-1][1] < min_gap:
            merged[-1][1] = s[1]
        else:
            merged.append(s)
    return [s for s in merged if s[1] - s[0] >= min_len]


def fit_count(segs, want):
    """Merge across the smallest gaps until we have `want` segments."""
    segs = [list(s) for s in segs]
    while len(segs) > want:
        gaps = [segs[i + 1][0] - segs[i][1] for i in range(len(segs) - 1)]
        i = int(np.argmin(gaps))
        segs[i][1] = segs[i + 1][1]
        del segs[i + 1]
    return segs


def word_weight(w):
    wt = 0.0
    for ch in w:
        cat = unicodedata.category(ch)
        if ch.isdigit():
            wt += 2.5                      # digits are spoken as long words
        elif "A" <= ch.upper() <= "Z":
            wt += 1.6                      # Latin letters (H, B) spoken as syllables
        elif cat.startswith("L"):
            wt += 1.0
        elif cat.startswith("M"):
            wt += 0.35                     # vowel signs / virama
    return max(wt, 0.8)


def main():
    html = open(HTML, encoding="utf-8").read()
    cfg = read_config(html)
    phrases, sent_end = [], []
    for si, s in enumerate(cfg["sentences"]):
        for pi, p in enumerate(s["phrases"]):
            phrases.append({"text": p, "sentence": si})
            sent_end.append(pi == len(s["phrases"]) - 1)

    x = decode(os.path.join(ROOT, cfg["voice"]))
    want = len(phrases)
    segs = None
    for thr in (-40, -38, -42, -36, -45, -34, -48):
        for gap in (0.25, 0.22, 0.3, 0.18):
            cand = islands(x, thr, gap)
            if len(cand) >= want:
                segs = fit_count(cand, want)
                break
        if segs:
            break
    if not segs:
        sys.exit(f"Could not find {want} phrases in the voice (got {len(cand)}). "
                 "Check the script matches the MP3.")
    print(f"Found {len(segs)} phrases (want {want})")

    # --- tighten pauses -----------------------------------------------------
    t = cfg.get("timing", {})
    g_in, g_out = t.get("phraseGap", 0.24), t.get("sentenceGap", 0.40)
    head, tail = t.get("head", 0.10), t.get("tail", 0.35)
    pad = 0.04
    pieces, new_segs, cursor = [], [], 0.0
    pieces.append(np.zeros(int(head * SR), np.float32)); cursor = head
    for i, (a, b) in enumerate(segs):
        a0, b0 = max(0, a - pad), min(len(x) / SR, b + pad)
        clip = x[int(a0 * SR): int(b0 * SR)].copy()
        f = int(0.008 * SR)                       # tiny fades: no clicks at cuts
        clip[:f] *= np.linspace(0, 1, f); clip[-f:] *= np.linspace(1, 0, f)
        new_segs.append([cursor + (a - a0), cursor + (a - a0) + (b - a)])
        pieces.append(clip); cursor += len(clip) / SR
        if i < len(segs) - 1:
            orig_gap = segs[i + 1][0] - b
            gap = min(orig_gap, g_out if sent_end[i] else g_in)
            gap = max(gap - 2 * pad, 0.02)
            pieces.append(np.zeros(int(gap * SR), np.float32)); cursor += gap
    pieces.append(np.zeros(int(tail * SR), np.float32))
    y = np.concatenate(pieces)

    # micro pauses inside each phrase (for word timing) on the edited signal
    micro = islands(y, -50, 0.10, 0.03)

    tempo = float(cfg.get("voiceTempo", 1.0))
    os.makedirs(os.path.join(ROOT, "build"), exist_ok=True)
    tmp = os.path.join(ROOT, "build", "voice_edit.f32")
    y.astype(np.float32).tofile(tmp)
    out = os.path.join(ROOT, "build", "voice_cut.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1",
                    "-i", tmp, "-af", f"atempo={tempo}", "-c:a", "pcm_s16le", out], check=True)
    os.remove(tmp)
    dur = len(y) / SR / tempo

    # --- word timings ---------------------------------------------------------
    out_phr = []
    for (a, b), ph in zip(new_segs, phrases):
        sub = [[max(s0, a), min(s1, b)] for s0, s1 in micro if s1 > a and s0 < b]
        sub = [s for s in sub if s[1] - s[0] > 0.02] or [[a, b]]
        voiced = sum(s1 - s0 for s0, s1 in sub)
        words = ph["text"].split()
        w = np.array([word_weight(k) for k in words]); cum = np.concatenate([[0], np.cumsum(w)]) / w.sum()

        def at(frac):                              # fraction of voiced time -> real time
            target, acc = frac * voiced, 0.0
            for s0, s1 in sub:
                if acc + (s1 - s0) >= target - 1e-9:
                    return s0 + (target - acc)
                acc += s1 - s0
            return sub[-1][1]
        wl = [{"w": k, "t": round(at(cum[j]) / tempo, 3)} for j, k in enumerate(words)]
        out_phr.append({"text": ph["text"], "sentence": ph["sentence"],
                        "start": round(a / tempo, 3), "end": round(b / tempo, 3), "words": wl})

    timings = {"duration": round(dur, 3), "audio": "build/voice_cut.wav", "phrases": out_phr}
    block = json.dumps(timings, ensure_ascii=False, indent=1)
    html = re.sub(r'(<script id="timings" type="application/json">)(.*?)(</script>)',
                  lambda m: m.group(1) + "\n" + block + "\n" + m.group(3), html, flags=re.S)
    open(HTML, "w", encoding="utf-8").write(html)
    print(f"Voice: {len(x)/SR:.2f}s -> {dur:.2f}s (pauses tightened, tempo x{tempo})")
    for p in out_phr:
        print(f"  {p['start']:6.2f}-{p['end']:6.2f}  {p['text']}")


if __name__ == "__main__":
    main()
