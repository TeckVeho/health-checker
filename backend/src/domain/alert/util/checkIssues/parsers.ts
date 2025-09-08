/**
 * Text parsing utilities for extracting structured data from issue content
 */

/**
 * Extract Story Point from issue content
 */
export function extractStoryPoints(body: string): number | null {
  // Search for common patterns for Story Point
  const patterns = [
    /SP[:\s]*(\d+)/i,
    /Story Point[:\s]*(\d+)/i,
    /Story Points[:\s]*(\d+)/i,
    /Points[:\s]*(\d+)/i,
    /Estimate[:\s]*(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return null;
}

/**
 * Extract End Date from issue content
 */
export function extractEndDate(body: string): Date | null {
  // Search for common patterns for End Date
  const patterns = [
    /End Date[:\s]*(\d{4}-\d{2}-\d{2})/i,
    /Due Date[:\s]*(\d{4}-\d{2}-\d{2})/i,
    /Deadline[:\s]*(\d{4}-\d{2}-\d{2})/i,
    /Target Date[:\s]*(\d{4}-\d{2}-\d{2})/i,
    /(\d{4}-\d{2}-\d{2})/g, // Find all date format YYYY-MM-DD
  ];

  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match) {
      const date = new Date(match[1]);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  return null;
}

/**
 * Fallback heuristic for template-only detection.
 * Returns true if template-only; false if has content.
 */
export function fallbackTemplateDetection(body: string): boolean {
  const normalized = body.trim().toLowerCase();

  if (normalized.length === 0) return true;

  const templatePhrases = [
    'please describe the issue here',
    'describe the problem',
    'what did you expect to happen',
    'what actually happened',
    'please provide',
    'fill in the details',
    'add your description here',
    'template content',
    'placeholder text',
    'rewrite the summary of the tasks',
    'record the notes and requirements related to the order of merging',
  ];

  return templatePhrases.some((p) => normalized.includes(p));
}

/**
 * Fallback heuristic for unclear instructions detection.
 * Returns true if unclear; false if clear.
 */
export function fallbackUnclearInstructionsDetection(body: string): boolean {
  const normalized = body.trim().toLowerCase();

  if (normalized.length === 0) return false; // Empty body handled by template detection

  // Signals of clarity (any makes it clear)
  const hasList = /^[-*]\s+/m.test(body); // bullet points
  const hasLink = /\bhttps?:\/\//i.test(body);
  const hasFileRef = /\b\w+\.(ts|js|tsx|jsx|md|yml|yaml|json)\b/i.test(body) || /#\d+/.test(body);
  const hasSection = /##\s*(purpose|spec|概要|詳細|タスク|task|steps|チェック|参考|memo|メモ|description)/i.test(body);
  const actionVerbs = [
    'fix','relax','update','add','remove','refactor','rewrite','implement',
    'enable','disable','set','change','migrate','bump','link','document'
  ];
  const hasActionVerb = actionVerbs.some((v) => normalized.includes(v));

  if (hasList || hasLink || hasFileRef || hasSection || hasActionVerb) {
    // Considered clear enough even if short
    return false;
  }

  // Vague vs technical signal
  const vaguePhrases = [
    'fix this',
    'something is wrong',
    "it doesn't work",
    "there's an issue",
    'problem with',
    'needs to be fixed',
    'broken',
    'not working',
    'help needed',
  ];
  const technicalTerms = [
    'error',
    'exception',
    'stack trace',
    'log',
    'console',
    'api',
    'endpoint',
    'database',
    'query',
    'function',
    'method',
    'class',
    'component',
    'file',
    'line',
    'code',
    'unit test',
    'jest',
  ];

  const vagueCount = vaguePhrases.filter((phrase) => normalized.includes(phrase)).length;
  const technicalCount = technicalTerms.filter((term) => normalized.includes(term)).length;

  // Extremely short with no clarity signals → unclear
  if (normalized.length < 80) return true;

  // Vague language + lack of technical/context → unclear (more lenient threshold)
  if (vagueCount > 0 && technicalCount < 2 && normalized.length < 200) return true;

  // Default: assume clear enough
  return false;
}