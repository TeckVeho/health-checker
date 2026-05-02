/* eslint-disable @typescript-eslint/naming-convention -- OpenAI Batch / chat completions bodies use snake_case per API */
import OpenAI, { toFile } from 'openai';
import { OPENAI_CONFIG, isOpenAILlmEnabled } from '../../../config/openai';

export type ChatCompletionBatchLine = {
  custom_id: string;
  method: 'POST';
  url: '/v1/chat/completions';
  body: Record<string, unknown>;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * OpenAI Batch API で chat/completions をまとめて実行し、custom_id → アシスタント本文のマップを返す。
 */
export async function runChatCompletionsBatch(lines: ChatCompletionBatchLine[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (lines.length === 0) {
    return out;
  }
  if (!isOpenAILlmEnabled()) {
    throw new Error('OPENAI_API_KEY is required for batch LLM');
  }

  const client = new OpenAI({ apiKey: OPENAI_CONFIG.API_KEY });
  const jsonl = lines.map((l) => JSON.stringify(l)).join('\n');
  const uploaded = await client.files.create({
    file: await toFile(Buffer.from(jsonl, 'utf8'), 'batch.jsonl'),
    purpose: 'batch',
  });

  const batch = await client.batches.create({
    input_file_id: uploaded.id,
    endpoint: '/v1/chat/completions',
    completion_window: '24h',
  });

  const maxWait = Number(process.env.OPENAI_BATCH_MAX_WAIT_MS ?? 3_600_000);
  const pollMs = Number(process.env.OPENAI_BATCH_POLL_INTERVAL_MS ?? 10_000);
  const deadline = Date.now() + maxWait;

  let b = await client.batches.retrieve(batch.id);
  while (!['completed', 'failed', 'cancelled', 'expired'].includes(b.status)) {
    if (Date.now() > deadline) {
      throw new Error(
        `OpenAI batch ${b.id} timed out after ${maxWait}ms (status=${b.status}). Set OPENAI_BATCH_MAX_WAIT_MS to extend.`
      );
    }
    await sleep(pollMs);
    b = await client.batches.retrieve(batch.id);
  }

  if (b.status !== 'completed' || !b.output_file_id) {
    const errDetail = b.errors?.data?.map((e) => e.message).join('; ') ?? '';
    throw new Error(`OpenAI batch ${b.id} ended with status ${b.status}. ${errDetail}`);
  }

  const fileResponse = await client.files.content(b.output_file_id);
  const text = await fileResponse.text();
  for (const line of text.trim().split('\n')) {
    if (!line.trim()) continue;
    const row = JSON.parse(line) as {
      custom_id: string;
      response?: { body?: { choices?: Array<{ message?: { content?: string | null } }> } };
    };
    const content = row.response?.body?.choices?.[0]?.message?.content;
    if (typeof content === 'string' && content.length > 0) {
      out.set(row.custom_id, content);
    }
  }

  return out;
}

export function buildChatCompletionBatchLine(customId: string, userPrompt: string): ChatCompletionBatchLine {
  return {
    custom_id: customId,
    method: 'POST',
    url: '/v1/chat/completions',
    body: {
      model: OPENAI_CONFIG.MODEL,
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 1,
      max_tokens: 1024,
    },
  };
}
