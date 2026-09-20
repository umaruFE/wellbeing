import { n8nClient } from './client';

function stripCodeFence(value: string): string {
  return value.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
}

export async function generateWithDeepSeek(
  systemPrompt: string,
  userPrompt: string,
  timeout = 180000,
): Promise<string> {
  const result = await n8nClient.call('ai-deepseek-generation', {
    systemPrompt,
    userPrompt,
  }, { timeout }) as { content?: unknown };

  if (typeof result?.content !== 'string' || !result.content.trim()) {
    throw new Error('DeepSeek 返回为空');
  }
  return result.content.trim();
}

export async function generateJsonWithDeepSeek<T>(
  systemPrompt: string,
  userPrompt: string,
  timeout = 180000,
): Promise<T> {
  const content = stripCodeFence(await generateWithDeepSeek(systemPrompt, userPrompt, timeout));
  const jsonText = content.match(/\{[\s\S]*\}/)?.[0] || content;
  return JSON.parse(jsonText) as T;
}
