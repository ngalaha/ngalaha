"""
Alignement approximatif texte/audio par répartition proportionnelle du
nombre de caractères sur les segments de parole détectés (entre les
silences), sans passer par une vraie transcription automatique.
"""
import json
import re

TOTAL_DURATION = 228.937125

# --- 1. Parse silence intervals ---
starts, ends = [], []
with open("/tmp/silence_raw.txt") as f:
    for line in f:
        line = line.strip()
        m = re.search(r"silence_start:\s*([\d.]+)", line)
        if m:
            starts.append(float(m.group(1)))
        m = re.search(r"silence_end:\s*([\d.]+)", line)
        if m:
            ends.append(float(m.group(1)))

assert len(starts) == len(ends), (len(starts), len(ends))
silences = list(zip(starts, ends))

# --- 2. Build speech spans (complement of silences) ---
spans = []
cursor = 0.0
for s, e in silences:
    if s > cursor:
        spans.append((cursor, s))
    cursor = max(cursor, e)
if cursor < TOTAL_DURATION:
    spans.append((cursor, TOTAL_DURATION))

span_durations = [e - s for s, e in spans]
total_speech_time = sum(span_durations)
cum_span_time = [0.0]
for d in span_durations:
    cum_span_time.append(cum_span_time[-1] + d)


def speech_time_to_real_time(t):
    """t = position sur la timeline de parole concaténée (silences retirées)."""
    for i, (s, e) in enumerate(spans):
        if cum_span_time[i] <= t <= cum_span_time[i + 1]:
            return s + (t - cum_span_time[i])
    return spans[-1][1]


# --- 3. Load script, split into sentences ---
with open("script.txt", encoding="utf-8") as f:
    raw = f.read()

raw = re.sub(r"\s+", " ", raw).strip()
# découpe en phrases sur . ! ? … (en gardant le délimiteur)
parts = re.split(r"(?<=[.!?])\s+", raw)
sentences = [p.strip() for p in parts if p.strip()]

total_chars = sum(len(s) + 1 for s in sentences)  # +1 pour l'espace entre phrases

# --- 4. Assign timestamps proportionally to character count ---
cum_chars = 0.0
result = []
for s in sentences:
    start_frac = cum_chars / total_chars
    cum_chars += len(s) + 1
    end_frac = cum_chars / total_chars
    start_t = speech_time_to_real_time(start_frac * total_speech_time)
    end_t = speech_time_to_real_time(end_frac * total_speech_time)
    result.append({"text": s, "start": round(start_t, 3), "end": round(end_t, 3)})

# chaîne : la fin d'une phrase = début de la suivante (aucun silence "perdu")
result[0]["start"] = 0.0
for i in range(len(result) - 1):
    result[i]["end"] = result[i + 1]["start"]
result[-1]["end"] = TOTAL_DURATION

with open("aligned_sentences.json", "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"{len(sentences)} phrases alignées sur {len(spans)} segments de parole "
      f"({total_speech_time:.1f}s de parole / {TOTAL_DURATION:.1f}s total)")
for r in result:
    print(f"  [{r['start']:6.2f} -> {r['end']:6.2f}] {r['text'][:70]}")
