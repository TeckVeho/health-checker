import { createHash } from 'crypto';
import { OPENAI_CONFIG, isOpenAILlmCacheEnabled } from '../../config/openai';
import { LLM_CACHE_KEY_VERSION } from './llmCacheSchema';
import LlmCache from './llmCacheModel';

export function computeLlmCacheInputHash(params: {
  model: string;
  temperature: number;
  prompt: string;
}): string {
  const material = [LLM_CACHE_KEY_VERSION, params.model, String(params.temperature), params.prompt].join('\u001e');
  return createHash('sha256').update(material, 'utf8').digest('hex');
}

export type LlmCachePurpose =
  | 'issue_template'
  | 'issue_clarity'
  | 'pr_quality'
  | 'github_action_unified_review';

type GetOrSetParams = {
  purpose: LlmCachePurpose;
  prompt: string;
  temperature: number;
  /** OPENAI_MODEL 以外を使う場合 */
  modelOverride?: string;
  meta?: Record<string, unknown>;
  invoke: () => Promise<string>;
};

/**
 * 同一プロンプト・モデル・temperature なら DB の生応答を返し、無ければ invoke して保存する。
 * DB 失敗時はキャッシュを無視して invoke のみ（テスト・未マイグレーションでも動作）。
 */
export async function getOrSetLlmRawResponse(params: GetOrSetParams): Promise<string> {
  if (!isOpenAILlmCacheEnabled()) {
    return params.invoke();
  }

  const model = params.modelOverride ?? OPENAI_CONFIG.MODEL;
  const inputHash = computeLlmCacheInputHash({
    model,
    temperature: params.temperature,
    prompt: params.prompt,
  });

  try {
    const row = await LlmCache.findOne({ where: { inputHash } });
    if (row) {
      await row.increment('hitCount', { by: 1 });
      await row.update({ lastHitAt: new Date() });
      return row.responseRaw;
    }
  } catch (e) {
    console.warn('[LlmCache] read/increment failed, calling LLM without cache:', e);
    return params.invoke();
  }

  const raw = await params.invoke();
  if (!raw || !raw.trim()) {
    return raw;
  }

  const metaJson =
    params.meta && Object.keys(params.meta).length > 0 ? JSON.stringify(params.meta) : null;

  try {
    await LlmCache.create({
      inputHash,
      model,
      temperature: params.temperature,
      purpose: params.purpose,
      responseRaw: raw,
      metaJson,
      hitCount: 0,
    });
  } catch (e) {
    // 一意制約競合（他プロセスが先に作成）など
    console.warn('[LlmCache] create failed (using fresh response only):', e);
    try {
      const again = await LlmCache.findOne({ where: { inputHash } });
      if (again) {
        return again.responseRaw;
      }
    } catch {
      // ignore
    }
  }

  return raw;
}
