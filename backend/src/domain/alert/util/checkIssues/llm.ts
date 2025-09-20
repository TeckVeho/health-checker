/**
 * AI-powered content analysis for issues using LLM with fallback heuristics
 */
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { OPENAI_CONFIG } from '../../../../config/openai';
import { LLMAnalysisResult } from './types';
import { fallbackTemplateDetection, fallbackUnclearInstructionsDetection } from './parsers';

/**
 * Detects template-only issues using LLM with fallback to heuristics
 */
export async function detectTemplateOnlyIssue(title: string, body: string): Promise<LLMAnalysisResult> {
  if (!body || body.trim().length === 0) {
    return {
      result: true,
      reason: 'The issue body is empty, which indicates template-only content.',
    };
  }

  try {
    const prompt = `
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

    const result = await generateText({
      model: openai(OPENAI_CONFIG.MODEL),
      prompt,
      temperature: 1,
    });

    const content = result.text?.trim();

    if (!content) {
      throw new Error('Empty LLM response');
    }

    const jsonMatch = content.match(/```(?:json)?([\s\S]*?)```/);
    const raw = jsonMatch?.[1]?.trim() || content;

    const parsed = JSON.parse(raw);

    if (typeof parsed.result === 'boolean' && typeof parsed.reason === 'string') {
      return parsed;
    } else {
      throw new Error('Missing or invalid fields in LLM response');
    }
  } catch (error) {
    console.error('Error in LLM template detection:', error);
    // Fallback to heuristic-based detection
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
export async function detectUnclearInstructions(title: string, body: string): Promise<LLMAnalysisResult> {
  if (!body || body.trim().length === 0) {
    return {
      result: false, // Empty body is handled by template detection
      reason: 'Empty body is handled by template detection.',
    };
  }

  try {
    const prompt = `
You are analyzing a GitHub Issue body to determine if it lacks clear, actionable instructions.

Issue Title: ${title}
Issue Body: ${body}

Mark it as UNCLEAR (result=true) if:
- Lacks specific, actionable steps or clear next actions
- Vague or ambiguous description where expected outcome is unclear
- Not enough context to understand what needs to be done
- Very generic requests without specifics

Mark it as CLEAR (result=false) if:
- Contains concrete directives or specific tasks
- References specific files, code areas, links, or resources
- Has clear steps or requirements outlined
- Provides sufficient context for someone to take action

Respond ONLY in this JSON format:
{
  "result": false,
  "reason": "Short explanation of why the instructions are clear or unclear."
}
`.trim();

    const result = await generateText({
      model: openai(OPENAI_CONFIG.MODEL),
      prompt,
      temperature: 1,
    });

    const content = result.text?.trim();

    if (!content) {
      throw new Error('Empty LLM response');
    }

    const jsonMatch = content.match(/```(?:json)?([\s\S]*?)```/);
    const raw = jsonMatch?.[1]?.trim() || content;

    const parsed = JSON.parse(raw);

    if (typeof parsed.result === 'boolean' && typeof parsed.reason === 'string') {
      return parsed;
    } else {
      throw new Error('Missing or invalid fields in LLM response');
    }
  } catch (error) {
    console.error('Error in LLM unclear instructions detection:', error);
    // Fallback to heuristic-based detection
    const fallbackResult = fallbackUnclearInstructionsDetection(body);
    return {
      result: fallbackResult,
      reason: fallbackResult
        ? 'Heuristic: Body lacks minimum actionable clarity.'
        : 'Heuristic: Body shows minimum actionable clarity.',
    };
  }
}