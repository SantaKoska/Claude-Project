#!/usr/bin/env python3
"""Generate soft music + sound effects in code, duck music under the voice,
and master the mix to ~-10 LUFS (true peak -1 dBTP).

Inputs : build/voice_cut.wav, build/sfx.json (written by render.js)
Output : build/mix.wav
"""
import json, os, re, subprocess
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = lambda *p: os.path.join(ROOT, "build", *p)
SR = 48000
rng = np.random.default_rng(7)


def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def write(path, st):
    st.astype(np.float32).T.copy().tofile(B("tmp.f32"))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", B("tmp.f32"),
                    "-c:a", "pcm_f32le", path], check=True)
    os.remove(B("tmp.f32"))


def tt(d): return np.arange(int(d * SR)) / SR


def midi(n): return 440.0 * 2 ** ((n - 69) / 12)


NOTE = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6,
        "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}


def chord(name):
    m = re.match(r"([A-G][#b]?)(m?)", name)
    root = NOTE[m.group(1)]
    third = 3 if m.group(2) else 4
    return root, [root, root + third, root + 7]


def add(buf, sig, t0, pan=0.0, gain=1.0):
    i = int(t0 * SR)
    if i >= buf.shape[1] or i + len(sig) <= 0: return
    s = sig[max(0, -i): buf.shape[1] - i] * gain
    i = max(i, 0)
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[0, i:i + len(s)] += s * l * 1.414
    buf[1, i:i + len(s)] += s * r * 1.414


def onepole_lp(x, cut):
    """time-varying one-pole lowpass; cut may be an array (Hz)."""
    cut = np.broadcast_to(cut, x.shape)
    a = np.exp(-2 * np.pi * cut / SR)
    y = np.empty_like(x); z = 0.0
    for i in range(len(x)):
        z = (1 - a[i]) * x[i] + a[i] * z
        y[i] = z
    return y


# --------------------------------------------------------------- music
def music(dur, cfg):
    bpm = cfg.get("bpm", 96); beat = 60 / bpm; bar = beat * 4
    chords = cfg.get("chords", ["D", "A", "Bm", "G"])
    N = int(dur * SR); dry = np.zeros((2, N)); drums = np.zeros((2, N))
    nbars = int(np.ceil(dur / bar)) + 1
    for b in range(nbars):
        t0 = b * bar
        root, tri = chord(chords[b % len(chords)])
        # warm pad
        for k, n in enumerate(tri):
            note = 60 + n if 60 + n <= 69 else 48 + n
            f = midi(note); t = tt(bar + 1.2)
            env = np.minimum(t / 0.5, 1) * np.where(t > bar, np.exp(-(t - bar) / 0.45), 1)
            for det, pan in ((-4, -0.6), (4, 0.6)):
                ff = f * 2 ** (det / 1200)
                sig = (np.sin(2 * np.pi * ff * t) + 0.18 * np.sin(4 * np.pi * ff * t) + 0.06 * np.sin(6 * np.pi * ff * t))
                add(dry, sig * env, t0, pan, 0.035)
        # bass on beats 1 and 3
        bf = midi(38 + root if 38 + root <= 45 else 26 + root)
        for bt in (0, 2):
            t = tt(beat * 2)
            env = np.minimum(t / 0.01, 1) * np.exp(-t / 0.55)
            add(dry, (np.sin(2 * np.pi * bf * t) + 0.25 * np.sin(4 * np.pi * bf * t)) * env, t0 + bt * beat, 0, 0.16)
        # plucked arpeggio (8ths)
        pat = [0, 1, 2, 1, 0, 2, 1, 2]
        for k in range(8):
            n = 72 + tri[pat[k]] - (12 if 72 + tri[pat[k]] > 81 else 0) + (12 if k == 5 else 0)
            f = midi(n); t = tt(0.9)
            sig = (np.sin(2 * np.pi * f * t) * np.exp(-t * 5) + 0.35 * np.sin(4 * np.pi * f * t) * np.exp(-t * 9)
                   + 0.1 * np.sin(6 * np.pi * f * t) * np.exp(-t * 14))
            sig *= np.minimum(t / 0.004, 1)
            add(dry, sig, t0 + k * beat / 2, -0.35 if k % 2 else 0.35, 0.05 if k % 4 else 0.065)
        # soft kick + shaker
        for k in range(4):
            tk = t0 + k * beat
            if tk < 0.5: continue
            t = tt(0.35)
            f = 45 + 70 * np.exp(-t * 30)
            kick = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
            add(drums, kick, tk, 0, 0.30)
            t = tt(0.06)
            hat = np.diff(rng.standard_normal(len(t) + 1)) * np.exp(-t * 70)
            add(drums, hat, tk + beat / 2, 0.25 if k % 2 else -0.25, 0.022)
    # reverb on pad/arp
    ir_t = tt(2.2)
    wet = np.zeros_like(dry)
    for c in range(2):
        ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t / 0.55); ir[:int(0.012 * SR)] = 0
        ir /= np.sqrt((ir ** 2).sum())
        L = 1 << int(np.ceil(np.log2(N + len(ir))))
        wet[c] = np.fft.irfft(np.fft.rfft(dry[c], L) * np.fft.rfft(ir, L), L)[:N]
    m = dry + 0.45 * wet + drums
    fade = np.ones(N); fi = int(0.25 * SR); fo = int(1.6 * SR)
    fade[:fi] = np.linspace(0, 1, fi); fade[-fo:] = np.linspace(1, 0, fo) ** 1.5
    return m * fade


# --------------------------------------------------------------- sfx
def sfx_sig(kind):
    if kind == "whoosh":
        d = 0.6; t = tt(d); u = t / d
        cut = 300 + 3800 * np.sin(np.pi * u) ** 2
        n = onepole_lp(onepole_lp(rng.standard_normal(len(t)), cut), cut)
        return n * np.sin(np.pi * u) ** 2 * 3.0, "sweep"
    if kind == "pop":
        t = tt(0.16); f = 260 + 900 * np.exp(-t * 28)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 26) * np.minimum(t / .002, 1), 0
    if kind == "tick":
        t = tt(0.04)
        return (np.sin(2 * np.pi * 2600 * t) * np.exp(-t * 220) + 0.3 * rng.standard_normal(len(t)) * np.exp(-t * 500)), 0.15
    if kind == "thud":
        t = tt(0.4); f = 48 + 110 * np.exp(-t * 18)
        body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8)
        click = onepole_lp(rng.standard_normal(len(t)), 1800) * np.exp(-t * 60) * 2
        return body + click, 0
    if kind == "chime":
        t = tt(1.8); out = np.zeros(len(t))
        for k, (f, dl) in enumerate(((880.0, 0), (1174.66, 0.07), (1760.0, 0.14))):
            tt_ = np.clip(t - dl, 0, None); on = (t >= dl)
            for ratio, amp, dec in ((1, 1, 1.6), (2.0, .35, 3), (3.01, .18, 5), (4.2, .08, 8)):
                out += on * amp * np.sin(2 * np.pi * f * ratio * tt_) * np.exp(-tt_ * dec) * (0.8 ** k)
        return out * np.minimum(t / .003, 1) * 0.6, 0
    if kind == "shimmer":
        t = tt(1.0); out = np.zeros(len(t))
        for f in rng.uniform(2200, 5200, 7):
            out += np.sin(2 * np.pi * f * t) * (0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(6, 12) * t + rng.uniform(0, 6)))
        return out * np.minimum(t / .12, 1) * np.exp(-t * 3) / 7 * 1.6, 0
    if kind == "fire":
        t = tt(1.3); n = onepole_lp(rng.standard_normal(len(t)), 900) * 1.4
        cr = (rng.random(len(t)) > 0.9993) * rng.standard_normal(len(t)) * 3
        cr = onepole_lp(cr, 3000)
        return (n + cr) * np.minimum(t / .2, 1) * np.exp(-t * 1.2), 0
    raise ValueError(kind)


SFX_GAIN = {"whoosh": .30, "pop": .42, "tick": .20, "thud": .55, "chime": .30, "shimmer": .22, "fire": .30}


def loudness(path):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", out)[-1])
    tp = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", out)[-1])
    return I, tp


def main():
    meta = json.load(open(B("sfx.json")))
    dur = meta["duration"]; N = int(dur * SR)
    v = decode(B("voice_cut.wav"))[:N]
    v = np.pad(v, (0, N - len(v)))
    v = v / (np.abs(v).max() + 1e-9) * 0.7
    voice = np.vstack([v, v])

    m = music(dur, meta.get("music", {}))
    # level: music ~13 dB under the voice (RMS of speech parts)
    vr = np.sqrt(np.mean(v[np.abs(v) > 0.02] ** 2)); mr = np.sqrt(np.mean(m ** 2))
    m *= (vr / mr) * 10 ** (-13 / 20) * meta.get("music", {}).get("level", 1.0)
    # ducking: smooth envelope of the voice -> gain
    win = int(0.03 * SR)
    env = np.sqrt(np.convolve(v ** 2, np.ones(win) / win, "same"))
    mask = np.clip(env / (vr * 0.5), 0, 1)
    att, rel = np.exp(-1 / (0.03 * SR)), np.exp(-1 / (0.35 * SR))
    sm = np.empty_like(mask); z = 0.0
    for i in range(len(mask)):
        a = att if mask[i] > z else rel
        z = a * z + (1 - a) * mask[i]; sm[i] = z
    duck = 1 - 0.6 * sm                     # about -8 dB while speaking
    m *= duck

    fx = np.zeros((2, N)); cache = {}
    for e in meta["sfx"]:
        k = e["type"]
        if k not in cache: cache[k] = sfx_sig(k)
        sig, pan = cache[k]
        g = SFX_GAIN[k] * e.get("gain", 1) * vr / 0.12
        if pan == "sweep":
            i = int(e["t"] * SR); n = len(sig)
            seg = slice(max(i, 0), min(i + n, N)); s = sig[seg.start - i: seg.stop - i] * g
            p = np.linspace(-0.7, 0.7, n)[seg.start - i: seg.stop - i]
            fx[0, seg] += s * np.cos((p + 1) * np.pi / 4) * 1.414; fx[1, seg] += s * np.sin((p + 1) * np.pi / 4) * 1.414
        else:
            add(fx, sig, e["t"], pan, g)

    mix = voice + m + fx
    mix /= np.abs(mix).max() + 1e-9
    write(B("premaster.wav"), mix * 0.5)

    # master: gentle bus compression, then gain + true-peak limiter to hit -10 LUFS
    gain = 0.0
    for it in range(5):
        chain = (f"acompressor=threshold=-22dB:ratio=2.5:attack=8:release=160:makeup=1,"
                 f"volume={gain:.2f}dB,alimiter=limit=0.70:attack=2:release=80:level=false,"
                 f"aresample=48000")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", B("premaster.wav"), "-af", chain,
                        "-c:a", "pcm_s24le", B("mix.wav")], check=True)
        I, tp = loudness(B("mix.wav"))
        print(f"  master pass {it}: gain {gain:+.1f} dB -> {I:.1f} LUFS, peak {tp:.1f} dBFS")
        if abs(I + 10) < 0.3: break
        gain += (-10 - I) * 1.1
    print("mix -> build/mix.wav")


if __name__ == "__main__":
    main()
