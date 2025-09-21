import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { OPENAI_CONFIG } from '../../../config/openai';
import { GitHubPullRequest } from './github';

export class PRCheck {
  static hasMeaningfulBody(body: string): boolean {
    return !this.isBodyEmpty(body) && !this.isTemplateOnly(body) && this.hasSubstantialContent(body);
  }
  static isBodyEmpty(body: string): boolean {
    return !body || body.trim().length === 0;
  }
  static isTemplateOnly(body: string): boolean {
    const normalized = body.trim().toLowerCase();
    
    // Check for known template placeholder phrases - keep this check
    const knownPlaceholderPhrases = [
      'rewrite the summary of the tasks performed for this issue and its goal', 
      'record the notes and requirements related to the order of merging', 
      'provide the logs of dodoai during the development process', 
      'include screenshots showing changes or fixes'
    ];
    
    // If contains template placeholder phrases, it's template-only
    return knownPlaceholderPhrases.some((phrase) => normalized.includes(phrase.toLowerCase()));
  }
  
  static hasSubstantialContent(body: string): boolean {
    const trimmed = body.trim();
    
    // Simple character count based check - let LLM handle the detailed analysis
    // This threshold should be reasonable for meaningful PR descriptions
    return trimmed.length >= 30;
  }
  static hasTestEvidence(body: string): boolean {
    // Existing test evidence patterns
    const testLogRegex = /\b(yarn|npm|php\s+artisan)\b.*test/i;
    const looseTestKeywordRegex = /\b(yarn|npm|php\s+artisan)\b/i;
    const screenshotRegex = /!\[.*\]\(.*\.(png|jpg|jpeg|gif|mp4)\)/i;
    const githubImageRegex = /https:\/\/github\.com\/user-attachments\/assets\/[^\s)]+/i;
    const githubActionsRegex = /https:\/\/github\.com\/.*\/runs\//i;

    // Newly added: Performance test related patterns
    const performanceTestRegex = /Performance\s+(Test|Benchmark|Comparison)/i;
    const benchmarkRegex = /\b\d+(\.\d+)?\s*(ms|μs|ns|seconds?)\b/i;
    const speedImprovementRegex = /\b\d+x\s+faster\b/i;

    // Newly added: Evidence section related patterns
    const evidenceSectionRegex = /##\s*Evidence/i;
    const testResultsRegex = /##\s*(Test\s*Results?|Testing|Tests?)/i;

    // Check existing patterns
    const hasExistingEvidence = testLogRegex.test(body) || 
                               looseTestKeywordRegex.test(body) || 
                               screenshotRegex.test(body) || 
                               githubImageRegex.test(body) || 
                               githubActionsRegex.test(body);

    // Check new patterns
    const hasPerformanceEvidence = performanceTestRegex.test(body) || 
                                  benchmarkRegex.test(body) || 
                                  speedImprovementRegex.test(body);

    const hasEvidenceSection = evidenceSectionRegex.test(body) || 
                              testResultsRegex.test(body);

    return hasExistingEvidence || hasPerformanceEvidence || hasEvidenceSection;
  }

  static hasAIReviewComment(comments: string[]): boolean {
    return comments.some((comment) => /@dodo-ai|AI review result/i.test(comment));
  }

  static hasExpectedPrompt(comments: string[]): boolean {
    const promptPattern = /Please review the following .* code based on the criteria below/i;
    return comments.some((comment) => promptPattern.test(comment));
  }
  static async runUnifiedLLMReview(
    pr: GitHubPullRequest,
    diffs: string
  ): Promise<{
    type: 'code' | 'document' | 'other';
    prBodyResult: boolean;
    prBodyReason: string;
    diffResult: boolean;
    diffReason: string;
  }> {
    const prompt = `
  Please analyze both the PR description and the code changes.
  Respond in the following JSON format:
  Use the following criteria:
   - "prBodyResult": true if the PR description clearly explains what the PR is doing, including the purpose and the nature of the changes.
   - "diffResult": true if the code changes are consistent with the described content in the PR body.
  {
    "type": "code", // "code", "document", or "other"
    "prBodyResult": true,
    "prBodyReason": "short explanation",
    "diffResult": true,
    "diffReason": "short explanation"
  }
  
  **Pull Request Title**: ${pr.title}
  **Pull Request Description**:
  ${pr.body || 'No description provided'}
  **Code Changes**:
  ${diffs}
    `.trim();

    try {
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

      if ((parsed.type === 'code' || parsed.type === 'document' || parsed.type === 'other') && typeof parsed.prBodyResult === 'boolean' && typeof parsed.prBodyReason === 'string' && typeof parsed.diffResult === 'boolean' && typeof parsed.diffReason === 'string') {
        return parsed;
      } else {
        throw new Error('Missing or invalid fields in LLM response');
      }
    } catch (e) {
      console.error(`[LLM Review Error]`, e);
      return {
        type: 'other',
        prBodyResult: false,
        prBodyReason: 'LLM failed to analyze PR body',
        diffResult: false,
        diffReason: 'LLM failed to analyze code diff',
      };
    }
  }
}
