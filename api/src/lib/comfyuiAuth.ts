import { readFileSync } from 'node:fs';

const COMFYUI_AUTH_ORIGIN = process.env.COMFYUI_AUTH_ORIGIN || 'http://117.50.171.219:8188';

/** Add the private ComfyUI token only for the configured GPU origin. */
export function comfyuiAuthHeaders(url: string): Record<string, string> {
  try {
    if (new URL(url).origin !== new URL(COMFYUI_AUTH_ORIGIN).origin) return {};
  } catch {
    return {};
  }

  const tokenFile = process.env.COMFYUI_BEARER_TOKEN_FILE;
  const token = process.env.COMFYUI_BEARER_TOKEN
    || (tokenFile ? readFileSync(tokenFile, 'utf8').split(/\r?\n/, 1)[0].trim() : '');
  if (!token) throw new Error('ComfyUI Bearer token is not configured');
  return { Authorization: `Bearer ${token}` };
}
