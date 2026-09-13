"""Short phrases from recognized words; never invent timestamps or remove repetitions."""
import math
import re


def make_phrases(raw, duration, max_words=8, max_seconds=6.0, gap_seconds=0.65):
    phrases, warnings, current = [], [], []
    previous_end = -1.0

    def flush():
        if current:
            text = ' '.join(w['word'].strip() for w in current)
            text = re.sub(r'\s+([,.!?;:])', r'\1', text)
            phrases.append({'text': text, 'start': current[0]['start'], 'end': current[-1]['end'],
                            'needsReview': any(w.get('probability', 1) < 0.65 for w in current)})
            current.clear()

    for segment in raw.get('segments', []):
        words = segment.get('words') or []
        if not words:
            flush()
            warnings.append('Segment has no word timestamps; not sliced: ' + str(segment.get('text', '')))
            continue
        for item in words:
            start, end = float(item.get('start', -1)), float(item.get('end', -1))
            word = str(item.get('word', '')).strip()
            if not word or not math.isfinite(start) or not math.isfinite(end) or not (0 <= start < end <= duration):
                flush()
                warnings.append('Invalid word timing; not sliced: ' + word)
                continue
            if start < previous_end:
                flush()
                warnings.append('Overlapping/reversed word timing; not sliced: ' + word)
                continue
            if current and (start - current[-1]['end'] > gap_seconds or len(current) >= max_words or end - current[0]['start'] > max_seconds):
                flush()
            current.append({**item, 'word': word, 'start': start, 'end': end})
            previous_end = end
            if re.search(r'[.!?;。！？；]["\u201d\u2019]*$', word):
                flush()
    flush()
    return phrases, warnings


def stamp(seconds):
    ms = round(seconds * 1000)
    return f'{ms // 60000:02d}:{ms // 1000 % 60:02d}.{ms % 1000:03d}'
