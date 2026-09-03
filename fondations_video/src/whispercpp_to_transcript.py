"""
Convertit la sortie JSON de whisper.cpp (générée avec -ml 1, un "mot" par
segment) au format output/transcript.json attendu par 02_scene_prompts.py.

Usage:
    python3 src/whispercpp_to_transcript.py chemin_vers_audio.json output/transcript.json
"""
import json
import sys


def main():
    if len(sys.argv) != 3:
        print("Usage: whispercpp_to_transcript.py <input.json> <output/transcript.json>")
        sys.exit(1)

    src_path, dest_path = sys.argv[1], sys.argv[2]

    with open(src_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    entries = data.get("transcription", [])
    segments = []
    full_text_parts = []

    for entry in entries:
        text = entry.get("text", "")
        if not text.strip():
            continue
        start = entry["offsets"]["from"] / 1000.0
        end = entry["offsets"]["to"] / 1000.0
        segments.append({
            "start": start,
            "end": end,
            "text": text.strip(),
            "words": [{"word": text, "start": start, "end": end}],
        })
        full_text_parts.append(text)

    transcript = {
        "language": None,
        "text": "".join(full_text_parts).strip(),
        "segments": segments,
    }

    with open(dest_path, "w", encoding="utf-8") as f:
        json.dump(transcript, f, ensure_ascii=False, indent=2)

    print(f"{len(segments)} mots convertis -> {dest_path}")


if __name__ == "__main__":
    main()
