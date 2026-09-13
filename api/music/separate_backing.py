"""Extract the instrumental of the supplied master without changing its timeline."""
import argparse
import json
import os

import julius
import numpy as np
import soundfile as sf
import torch
from demucs.apply import apply_model
from demucs.pretrained import get_model

parser = argparse.ArgumentParser()
parser.add_argument('source')
parser.add_argument('output')
args = parser.parse_args()
torch.set_num_threads(min(4, os.cpu_count() or 1))
data, rate = sf.read(args.source, dtype='float32', always_2d=True)
if not 0 < len(data) / rate <= 121 or data.shape[1] not in (1, 2):
    raise ValueError('Expected a mono/stereo song of at most 120 seconds')
model = get_model('htdemucs')
model.eval()
# CPU also works on Linux and avoids unsupported MPS operators in the model.
wave = torch.from_numpy(data.T.copy())
if wave.shape[0] == 1:
    wave = wave.repeat(2, 1)
wave = julius.resample_frac(wave, rate, model.samplerate)
reference = wave.mean(0)
mean, std = reference.mean(), reference.std().clamp_min(1e-8)
with torch.inference_mode():
    stems = apply_model(model, ((wave - mean) / std)[None], device='cpu',
                        shifts=0, split=True, overlap=0.25, progress=True)[0]
    stems = stems * std + mean
    # Sum the non-vocal stems, as in Demucs' two-stems/add mode.
    indices = [i for i, name in enumerate(model.sources) if name != 'vocals']
    backing = stems[indices].sum(0)
    backing = julius.resample_frac(backing, model.samplerate, rate)
backing = backing[:, :len(data)]
if backing.shape[1] < len(data):
    backing = torch.nn.functional.pad(backing, (0, len(data) - backing.shape[1]))
peak = backing.abs().max().item()
if peak > 0.99:
    backing = backing * (0.99 / peak)
out = backing.T.numpy()
if not np.isfinite(out).all() or np.sqrt(np.mean(out ** 2)) < 1e-7:
    raise ValueError('Separated instrumental is invalid or silent')
sf.write(args.output, out, rate, format='FLAC', subtype='PCM_24')
print(json.dumps({'actualDuration': len(data) / rate, 'sampleRate': rate,
                  'sampleCount': len(data), 'channels': 2,
                  'method': 'demucs_htdemucs_non_vocal_stems'}))
