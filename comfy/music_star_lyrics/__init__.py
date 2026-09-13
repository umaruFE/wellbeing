"""ComfyUI post-processing for Music Star Quest. Uses STT7 results, no service/API key."""
import json
import os
import re
import uuid
import folder_paths
from .timing import make_phrases, stamp


class MSQSplitLyricsAudio:
    CATEGORY = 'audio/Music Star Quest'
    FUNCTION = 'split'
    OUTPUT_NODE = True
    RETURN_TYPES = ('STRING', 'STRING', 'STRING')
    RETURN_NAMES = ('lyrics_and_clips_json', 'lrc', 'manifest_path')

    @classmethod
    def INPUT_TYPES(cls):
        return {'required': {
            'audio': ('AUDIO',), 'result': ('STT7_RESULT',),
            'target_points': ('STRING', {'multiline': True, 'default': ''}),
            'max_words': ('INT', {'default': 8, 'min': 2, 'max': 16}),
            'max_seconds': ('FLOAT', {'default': 6.0, 'min': 1.0, 'max': 15.0, 'step': 0.1}),
            'gap_seconds': ('FLOAT', {'default': 0.65, 'min': 0.1, 'max': 2.0, 'step': 0.05}),
            'padding_seconds': ('FLOAT', {'default': 0.08, 'min': 0.0, 'max': 0.3, 'step': 0.01}),
            'filename_prefix': ('STRING', {'default': 'music-star-quest'}),
        }}

    def split(self, audio, result, target_points='', max_words=8, max_seconds=6.0,
              gap_seconds=0.65, padding_seconds=0.08, filename_prefix='music-star-quest'):
        import soundfile as sf
        waveform = audio['waveform'].detach().cpu()
        if waveform.ndim != 3 or waveform.shape[0] != 1:
            raise ValueError('Use batch_size=1; expected AUDIO shape [1, channels, samples]')
        sr = int(audio['sample_rate'])
        duration = waveform.shape[-1] / sr
        raw = result.get('raw') or result['transcription'].to_dict()
        phrases, warnings = make_phrases(raw, duration, max_words, max_seconds, gap_seconds)
        if not phrases:
            raise ValueError('No valid timed words. Enable word_timestamps in STT7 and check transcription.')
        if not re.fullmatch(r'[A-Za-z0-9_-]{1,64}', filename_prefix):
            raise ValueError('filename_prefix accepts letters, digits, hyphen and underscore only')
        subfolder = filename_prefix + '/' + uuid.uuid4().hex[:12]
        directory = os.path.join(folder_paths.get_output_directory(), subfolder)
        os.makedirs(directory, exist_ok=False)
        files = []
        for index, phrase in enumerate(phrases):
            # Actual sample boundaries, padding clamped to neighbouring recognized phrases.
            left = phrases[index - 1]['end'] if index else 0
            right = phrases[index + 1]['start'] if index + 1 < len(phrases) else duration
            clip_start = max(left, phrase['start'] - padding_seconds)
            clip_end = min(right, phrase['end'] + padding_seconds)
            first, last = round(clip_start * sr), round(clip_end * sr)
            if last <= first:
                raise ValueError('Empty clip; review the recognized timestamps')
            filename = f'line_{index + 1:03d}.flac'
            sf.write(os.path.join(directory, filename), waveform[0, :, first:last].numpy().T, sr, format='FLAC')
            phrase.update({'index': index, 'time': stamp(phrase['start']) + '–' + stamp(phrase['end']),
                           'clipStart': first / sr, 'clipEnd': last / sr,
                           'filename': filename, 'subfolder': subfolder, 'type': 'output'})
            files.append({'filename': filename, 'subfolder': subfolder, 'type': 'output'})
        lrc = '\n'.join('[' + stamp(p['start']) + ']' + p['text'] for p in phrases)
        text = '\n'.join(p['text'] for p in phrases)
        # Exact lexical coverage only, not a grammar/semantic assessment. No ASR prompt hints.
        points = [p.strip() for p in re.split(r'[,，;；\n]+', target_points) if p.strip()]
        coverage = {p: bool(re.search(r'(?<!\w)' + re.escape(p) + r'(?!\w)', text, re.I)) for p in points}
        manifest = {'actualDuration': duration, 'sampleRate': sr, 'lyrics': phrases,
                    'targetPointCoverage': coverage, 'missingTargetPoints': [p for p, found in coverage.items() if not found],
                    'warnings': warnings, 'alignmentStatus': 'needs_review',
                    'timingSource': 'whisper_word_timestamps_not_verified_forced_alignment',
                    'transcribedText': raw.get('text', ''), 'recognizedWords': raw.get('segments', [])}
        data = json.dumps(manifest, ensure_ascii=False, indent=2)
        for filename, content in [('lyrics.json', data), ('lyrics.lrc', lrc), ('lyrics.txt', text)]:
            with open(os.path.join(directory, filename), 'x', encoding='utf-8') as output:
                output.write(content)
            files.append({'filename': filename, 'subfolder': subfolder, 'type': 'output'})
        return {'ui': {'text': [data], 'audio': files[:-3], 'files': files},
                'result': (data, lrc, os.path.join(directory, 'lyrics.json'))}


NODE_CLASS_MAPPINGS = {'MSQSplitLyricsAudio': MSQSplitLyricsAudio}
NODE_DISPLAY_NAME_MAPPINGS = {'MSQSplitLyricsAudio': 'Music Star · 实际歌词与短句音频切割'}
