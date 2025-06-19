import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { GitHubPullRequest } from './github';

export class PRCheck {
  static hasMeaningfulBody(body: string): boolean {
    return !this.isBodyEmpty(body) && !this.isTemplateOnly(body);
  }
  static isBodyEmpty(body: string): boolean {
    return !body || body.trim().length === 0;
  }
  static hasAILogUrl(body: string): boolean {
    const aiServiceDomains = ['chatgpt.com', 'openai.com', 'claude.ai', 'bard.google.com', 'gemini.google.com', 'huggingface.co', 'poe.com', 'perplexity.ai', 'deepseek.com', '58llm', 'dodoai', 'llm.dev', 'chatanywhere.com', 'openrouter.ai'];
    return aiServiceDomains.some((domain) => {
      const regex = new RegExp(`https://[^\\s)]*${domain}[^\\s)]*`, 'i');
      return regex.test(body);
    });
  }
  static isTemplateOnly(body: string): boolean {
    const normalized = body.trim().toLowerCase();
    const section = '## description';
    const regex = new RegExp(`${section}\s*[-\n]*\s*$`, 'i');
    const isDescriptionUntouched = regex.test(normalized);
    const knownPlaceholderPhrases = ['rewrite the summary of the tasks performed for this issue and its goal', 'record the notes and requirements related to the order of merging', 'provide the logs of dodoai during the development process', 'include screenshots showing changes or fixes'];
    const containsPlaceholder = knownPlaceholderPhrases.some((phrase) => normalized.includes(phrase.toLowerCase()));
    return isDescriptionUntouched || containsPlaceholder;
  }
  static hasTestEvidence(body: string): boolean {
    const testLogRegex = /\b(yarn|npm|php\s+artisan)\b.*test/i;
    const looseTestKeywordRegex = /\b(yarn|npm|php\s+artisan)\b/i;

    const screenshotRegex = /!\[.*\]\(.*\.(png|jpg|jpeg|gif|mp4)\)/i;
    const githubImageRegex = /https:\/\/github\.com\/user-attachments\/assets\/[^\s)]+/i;

    const githubActionsRegex = /https:\/\/github\.com\/.*\/runs\//i;

    return (
      testLogRegex.test(body) ||
      looseTestKeywordRegex.test(body) ||
      screenshotRegex.test(body) ||
      githubImageRegex.test(body) ||
      githubActionsRegex.test(body)
    );
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
        model: openai('gpt-4o-mini'),
        prompt,
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
