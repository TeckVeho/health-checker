/**
 * AI-powered content analysis for issues using LLM with fallback heuristics
 */
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { isOpenAILlmEnabled, OPENAI_CONFIG } from '../../../../config/openai';
import { LLMAnalysisResult } from './types';
import { fallbackTemplateDetection, fallbackUnclearInstructionsDetection } from './parsers';

function extractJsonPayload(content: string): string {
  const jsonMatch = content.match(/```(?:json)?([\s\S]*?)```/);
  return (jsonMatch?.[1]?.trim() || content.trim());
}

export function buildIssueTemplatePrompt(title: string, body: string): string {
  return `
You are analyzing a GitHub Issue body to determine if it contains only template content or placeholders.

Issue Title: ${title}
Issue Body: ${body}

Mark it as TEMPLATE-ONLY (result=true) if:
- Only contains placeholder text or template instructions
- Has phrases like "Please describe here", "Describe the issue", "What did you expect to happen"
- Contains only template sections without actual content filled in
- Only has boilerplate text that hasn't been customized for the specific issue

Mark it as HAS CONTENT (result=false) if:
- Contains actual issue description, even if brief
- Has specific technical details, error messages, or implementation notes
- Shows evidence that the template has been filled out with real information

Respond ONLY in this JSON format:
{
  "result": false,
  "reason": "Short explanation of why this is template-only or has content."
}
`.trim();
}

export function buildIssueClarityPrompt(title: string, body: string): string {
  return `
You are analyzing a GitHub Issue body to determine if it lacks clear, actionable instructions.

Issue Title: ${title}
Issue Body: ${body}

Mark UNCLEAR (result=true) if:
- The request is too vague to understand at all

Mark CLEAR (result=false) if:
- The task direction is understandable and gives enough to act on

Respond ONLY in this JSON format:
{
  "result": false,
  "reason": "Short explanation of why the instructions are clear or unclear."
}
`.trim();
}

export function parseTemplateOnlyFromAssistantText(assistantText: string, bodyForFallback: string): LLMAnalysisResult {
  try {
    const raw = extractJsonPayload(assistantText);
    const parsed = JSON.parse(raw);
    if (typeof parsed.result === 'boolean' && typeof parsed.reason === 'string') {
      return parsed;
    }
    throw new Error('Missing or invalid fields in LLM response');
  } catch (error) {
    console.error('Error parsing LLM template detection (batch):', error);
    const fallbackResult = fallbackTemplateDetection(bodyForFallback);
    return {
      result: fallbackResult,
      reason: fallbackResult
        ? 'Heuristic: Body appears to contain only template placeholders.'
        : 'Heuristic: Body contains meaningful content beyond templates.',
    };
  }
}

export function parseUnclearInstructionsFromAssistantText(
  assistantText: string,
  bodyForFallback: string
): LLMAnalysisResult {
  try {
    const raw = extractJsonPayload(assistantText);
    const parsed = JSON.parse(raw);
    if (typeof parsed.result === 'boolean' && typeof parsed.reason === 'string') {
      return parsed;
    }
    throw new Error('Missing or invalid fields in LLM response');
  } catch (error) {
    console.error('Error parsing LLM unclear instructions (batch):', error);
    const fallbackResult = fallbackUnclearInstructionsDetection(bodyForFallback);
    return {
      result: fallbackResult,
      reason: fallbackResult
        ? 'Heuristic: Body lacks minimum actionable clarity.'
        : 'Heuristic: Body shows minimum actionable clarity.',
    };
  }
}

/**
 * Detects template-only issues using LLM with fallback to heuristics
 */
export async function detectTemplateOnlyIssue(
  title: string,
  body: string,
  options?: { prefetchedAssistantText?: string }
): Promise<LLMAnalysisResult> {
  if (!body || body.trim().length === 0) {
    return {
      result: true,
      reason: 'The issue body is empty, which indicates template-only content.',
    };
  }

  if (!isOpenAILlmEnabled()) {
    return {
      result: false,
      reason: 'OPENAI_API_KEY is not set; LLM template check skipped.',
    };
  }

  if (options?.prefetchedAssistantText !== undefined) {
    return parseTemplateOnlyFromAssistantText(options.prefetchedAssistantText, body);
  }

  try {
    const prompt = buildIssueTemplatePrompt(title, body);

    const result = await generateText({
      model: openai(OPENAI_CONFIG.MODEL),
      prompt,
      temperature: 1,
    });

    const content = result.text?.trim();

    if (!content) {
      throw new Error('Empty LLM response');
    }

    return parseTemplateOnlyFromAssistantText(content, body);
  } catch (error) {
    console.error('Error in LLM template detection:', error);
    const fallbackResult = fallbackTemplateDetection(body);
    return {
      result: fallbackResult,
      reason: fallbackResult
        ? 'Heuristic: Body appears to contain only template placeholders.'
        : 'Heuristic: Body contains meaningful content beyond templates.',
    };
  }
}

/**
 * Detects unclear instructions using LLM with fallback to heuristics
 */
export async function detectUnclearInstructions(
  title: string,
  body: string,
  options?: { prefetchedAssistantText?: string }
): Promise<LLMAnalysisResult> {
  if (!body || body.trim().length === 0) {
    return {
      result: false,
      reason: 'Empty body is handled by template detection.',
    };
  }

  if (!isOpenAILlmEnabled()) {
    return {
      result: false,
      reason: 'OPENAI_API_KEY is not set; LLM clarity check skipped.',
    };
  }

  if (options?.prefetchedAssistantText !== undefined) {
    return parseUnclearInstructionsFromAssistantText(options.prefetchedAssistantText, body);
  }

  try {
    const prompt = buildIssueClarityPrompt(title, body);

    const result = await generateText({
      model: openai(OPENAI_CONFIG.MODEL),
      prompt,
      temperature: 1,
    });

    const content = result.text?.trim();

    if (!content) {
      throw new Error('Empty LLM response');
    }

    return parseUnclearInstructionsFromAssistantText(content, body);
  } catch (error) {
    console.error('Error in LLM unclear instructions detection:', error);
    const fallbackResult = fallbackUnclearInstructionsDetection(body);
    return {
      result: fallbackResult,
      reason: fallbackResult
        ? 'Heuristic: Body lacks minimum actionable clarity.'
        : 'Heuristic: Body shows minimum actionable clarity.',
    };
  }
}
