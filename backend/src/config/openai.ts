// Environment variables are initialized by EnvironmentConfig

export const OPENAI_CONFIG = {
  API_KEY: process.env.OPENAI_API_KEY as string,
  MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
} as const;

/** True when an API key is present; LLM calls should be skipped otherwise (pass / no-alert behavior). */
export function isOpenAILlmEnabled(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return typeof key === 'string' && key.trim().length > 0;
}

/**
 * 定期チェック（isScheduledRun）で LLM を Batch API に寄せるか。
 * `OPENAI_SCHEDULED_LLM_SYNC=true` のとき従来の同期 generate にフォールバック（テスト・デバッグ用）。
 */
export function isOpenAIScheduledLlmBatchMode(): boolean {
  const v = (process.env.OPENAI_SCHEDULED_LLM_SYNC || '').toLowerCase();
  return v !== '1' && v !== 'true' && v !== 'yes';
}

// Validate required environment variables
if (!OPENAI_CONFIG.API_KEY && process.env.NODE_ENV !== 'test') {
  console.warn('Warning: OPENAI_API_KEY is not set. OpenAI features will not work.');
}

export default OPENAI_CONFIG;
