#!/usr/bin/env bash
# Install the same-song instrumental runtime on the backend host (run as the API user).
set -euo pipefail
export PIP_DEFAULT_TIMEOUT="${PIP_DEFAULT_TIMEOUT:-180}"
export PIP_RETRIES="${PIP_RETRIES:-3}"
music_api_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
music_python="${MUSIC_SEPARATION_PYTHON:-$music_api_dir/.venv-music/bin/python}"
music_runtime="${MUSIC_RUNTIME_DIR:-$music_api_dir/.music-runtime}"
if [ ! -x "$music_python" ] || ! "$music_python" -m pip --version >/dev/null 2>&1; then
  if [ -n "${MUSIC_SEPARATION_PYTHON:-}" ]; then
    echo "MUSIC_SEPARATION_PYTHON 指定的 Python 不存在: $music_python" >&2
    exit 1
  fi
  python3 -m venv "$music_api_dir/.venv-music" || {
    echo '无法创建 Python 环境。Ubuntu/Debian 请先安装对应版本的 python3-venv，再重试。' >&2
    exit 1
  }
fi
if ! "$music_python" -c 'import demucs, torch, torchaudio, soundfile, julius; assert torch.__version__.split("+")[0] == "2.7.1"; assert torchaudio.__version__.split("+")[0] == "2.7.1"' >/dev/null 2>&1; then
  "$music_python" -m pip install --upgrade pip
  if [ "$(uname -s)" = Linux ]; then
    # No CUDA runtime is needed: source separation uses CPU.
    "$music_python" -m pip install 'torch==2.7.1' 'torchaudio==2.7.1' --index-url https://download.pytorch.org/whl/cpu
  else
    "$music_python" -m pip install 'torch==2.7.1' 'torchaudio==2.7.1'
  fi
  "$music_python" -m pip install -r "$music_api_dir/music/requirements.txt"
fi
mkdir -p "$music_runtime/models" "$music_runtime/jobs" "$music_runtime/audio"
TORCH_HOME="$music_runtime/models" "$music_python" - <<'PY'
import torch
from demucs.pretrained import get_model
from demucs.apply import apply_model
model = get_model('htdemucs').eval()
torch.set_num_threads(2)
with torch.inference_mode():
    result = apply_model(model, torch.zeros(1, 2, model.samplerate), device='cpu', shifts=0)
assert result.shape[-1] == model.samplerate
print('伴奏运行环境与模型推理检查通过')
PY
