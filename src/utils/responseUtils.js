export async function parseJsonSafely(response) {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function responseErrorMessage(response, data, fallback) {
  if (data?.error) return data.error;
  if (!response.ok) return `${fallback}（HTTP ${response.status}）`;
  return fallback;
}
