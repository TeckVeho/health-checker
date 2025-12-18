/**
 * LLM analysis functionality for pull request quality assessment
 */
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { OPENAI_CONFIG } from '../../../../config/openai';
import { GitHubPullRequest, LLMAnalysisResult } from './types';

/**
 * Analyze PR content with LLM to detect quality issues
 */
export async function analyzePRWithLLM(pr: GitHubPullRequest): Promise<LLMAnalysisResult> {
  const prBody = pr.body || '';
  const prTitle = pr.title;

  const prompt = `
Please analyze the following pull request for quality issues. Respond in JSON format:

{
  "unclearChanges": boolean,
  "missingEvidence": boolean,
  "unclearReason": "explanation if unclearChanges is true",
  "missingEvidenceReason": "explanation if missingEvidence is true"
}

Criteria:
1. unclearChanges
- Set to true only if the PR description is almost empty or provides no meaningful explanation at all.
- If there is any explanation of what was changed (even high-level, short, or informal), set this to false.
-Detailed implementation steps are not required.


2. missingEvidence
- Set to true only if there is nothing that looks like evidence.
- Set to false if any of the following are present:
- Screenshot(s)
- Log output
- Test result text
- URL (PR, issue, deploy link, staging link, etc.)

Important Notes
- Be generous and practical in judgment.
- If the author made any reasonable effort to explain or show validation, treat it as OK.
- Do not expect perfect documentation.
- Description stating that something was tested or verified (even without proof)


**Pull Request Title**: ${prTitle}
**Pull Request Description**:
${prBody}
  `.trim();

  try {
    const result = await generateText({
      model: openai(OPENAI_CONFIG.MODEL),
      prompt,
      temperature: 1, // Default temperature for this model
    });

    const content = result.text?.trim();
    if (!content) {
      throw new Error('Empty LLM response');
    }

    // Parse JSON response
    const jsonMatch = content.match(/```(?:json)?([\s\S]*?)```/);
    const raw = jsonMatch?.[1]?.trim() || content;

    const parsed = JSON.parse(raw);

    // Validate response structure
    if (
      typeof parsed.unclearChanges === 'boolean' &&
      typeof parsed.missingEvidence === 'boolean'
    ) {
      return {
        unclearChanges: parsed.unclearChanges,
        missingEvidence: parsed.missingEvidence,
        unclearReason: parsed.unclearReason,
        missingEvidenceReason: parsed.missingEvidenceReason,
      };
    } else {
      throw new Error('Invalid LLM response structure');
    }
  } catch (error) {
    console.error(`[LLM Analysis Error] Failed to analyze PR #${pr.number}:`, error);
    
    // Return conservative analysis on error
    return {
      unclearChanges: false,
      missingEvidence: false,
      unclearReason: 'LLM analysis failed',
      missingEvidenceReason: 'LLM analysis failed',
    };
  }
}
