// Environment variables are initialized by EnvironmentConfig

export const OPENAI_CONFIG = {
  API_KEY: process.env.OPENAI_API_KEY as string,
  MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
} as const;

/** True when an API key is present; LLM calls should be skipped otherwise (pass / no-alert behavior). * 関連: LLM 応答キャッシュは `LLM_CACHE_ENABLED`（既定 true）で無効化可。テーブル `llm_cache` は `yarn db:migrate` で作成。
 */
export function isOpenAILlmEnabled(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return typeof key === 'string' && key.trim().length > 0;
}

/** LLM 応答キャッシュ（DB `llm_cache`）を使う。`LLM_CACHE_ENABLED=false` で無効化。 */
export function isOpenAILlmCacheEnabled(): boolean {
  const v = (process.env.LLM_CACHE_ENABLED ?? 'true').toLowerCase();
  return v !== '0' && v !== 'false' && v !== 'no';
}

// Validate required environment variables
if (!OPENAI_CONFIG.API_KEY && process.env.NODE_ENV !== 'test') {
  console.warn('Warning: OPENAI_API_KEY is not set. OpenAI features will not work.');
}

export default OPENAI_CONFIG;
