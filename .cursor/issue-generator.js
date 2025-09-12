#!/usr/bin/env node

/**
 * Issue Generator Script for Health Checker Project
 * Generates structured issue proposals based on summary input
 */

const fs = require('fs');
const path = require('path');

class IssueGenerator {
  constructor() {
    this.projectContext = this.loadProjectContext();
  }

  loadProjectContext() {
    // Load project-specific context from memory or config files
    const memoryPath = path.join(__dirname, '..', 'memory', 'constitution.md');
    let context = '';
    
    try {
      if (fs.existsSync(memoryPath)) {
        context = fs.readFileSync(memoryPath, 'utf8');
      }
    } catch (error) {
      console.warn('Could not load project context:', error.message);
    }

    return {
      projectName: 'Health Checker',
      techStack: ['Node.js', 'TypeScript', 'Nuxt.js', 'PostgreSQL', 'Jest'],
      conventions: {
        commitTypes: ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'],
        spValues: [1, 2, 3, 5, 8, 13],
        labels: ['bug', 'enhancement', 'documentation', 'refactoring', 'testing']
      },
      context
    };
  }

  generateIssueProposal(summary) {
    const title = this.generateTitle(summary);
    const body = this.generateBody(summary);
    const storyPoints = this.estimateStoryPoints(summary);

    return {
      title,
      body,
      storyPoints: {
        value: storyPoints.value,
        reasoning: storyPoints.reasoning
      },
      labels: this.suggestLabels(summary)
    };
  }

  generateTitle(summary) {
    // Extract key action and subject from summary
    const actionWords = ['add', 'implement', 'create', 'fix', 'update', 'refactor', 'remove', 'improve', 'optimize'];
    const typeWords = ['feature', 'bug', 'enhancement', 'documentation', 'test'];
    
    let commitType = 'feat';
    let title = summary.trim();

    // Determine commit type based on keywords
    if (summary.toLowerCase().includes('fix') || summary.toLowerCase().includes('bug')) {
      commitType = 'fix';
    } else if (summary.toLowerCase().includes('doc') || summary.toLowerCase().includes('readme')) {
      commitType = 'docs';
    } else if (summary.toLowerCase().includes('test')) {
      commitType = 'test';
    } else if (summary.toLowerCase().includes('refactor')) {
      commitType = 'refactor';
    }

    // Convert Japanese summary to English title
    const englishTitle = this.translateToEnglish(summary);

    // Ensure title follows conventional commit format
    if (!englishTitle.toLowerCase().startsWith(commitType + ':')) {
      title = `${commitType}: ${englishTitle}`;
    } else {
      title = englishTitle;
    }

    // Capitalize first letter after colon
    const colonIndex = title.indexOf(':');
    if (colonIndex !== -1 && colonIndex + 2 < title.length) {
      title = title.substring(0, colonIndex + 2) + 
              title.charAt(colonIndex + 2).toUpperCase() + 
              title.substring(colonIndex + 3);
    }

    return title;
  }

  translateToEnglish(summary) {
    // Enhanced pattern-based translations for common issue descriptions (most specific first)
    const patterns = [
      {
        pattern: /authorページのlast detected列で「Today」と表示されているが、他のページと同様に具体的な日時（YYYY-MM-DD HH:mm:ss）を表示するように修正/,
        translation: 'Fix author page last detected column to show specific datetime like other pages'
      },
      {
        pattern: /Authorページのlast detected列で「Today」と表示されているが、他のページと同様に具体的な日時を表示/,
        translation: 'Fix author page last detected column to show specific datetime like other pages'
      },
      {
        pattern: /authorページ.*last detected.*Today.*表示.*修正/,
        translation: 'Fix author page last detected column display'
      },
      {
        pattern: /Authorページ.*last detected.*Today.*表示/,
        translation: 'Fix author page last detected column display'
      },
      {
        pattern: /ユーザー認証機能.*追加/,
        translation: 'Add user authentication feature'
      },
      {
        pattern: /バグ.*修正/,
        translation: 'Fix bug'
      },
      {
        pattern: /エラー.*修正/,
        translation: 'Fix error'
      },
      {
        pattern: /機能.*追加/,
        translation: 'Add feature'
      },
      {
        pattern: /API.*実装/,
        translation: 'Implement API'
      },
      {
        pattern: /データベース.*更新/,
        translation: 'Update database'
      },
      {
        pattern: /フロントエンド.*改善/,
        translation: 'Improve frontend'
      },
      {
        pattern: /バックエンド.*改善/,
        translation: 'Improve backend'
      },
      {
        pattern: /認証.*実装/,
        translation: 'Implement authentication'
      },
      {
        pattern: /ログイン.*機能/,
        translation: 'Login feature'
      },
      {
        pattern: /表示.*統一/,
        translation: 'Unify display'
      },
      {
        pattern: /フォーマット.*統一/,
        translation: 'Unify format'
      },
      {
        pattern: /一貫性.*改善/,
        translation: 'Improve consistency'
      },
      {
        pattern: /ページ.*表示.*修正/,
        translation: 'Fix page display'
      },
      {
        pattern: /実装/,
        translation: 'Implement'
      },
      {
        pattern: /更新/,
        translation: 'Update'
      },
      {
        pattern: /削除/,
        translation: 'Remove'
      },
      {
        pattern: /リファクタ/,
        translation: 'Refactor'
      },
      {
        pattern: /テスト/,
        translation: 'Test'
      },
      {
        pattern: /ドキュメント/,
        translation: 'Document'
      },
      {
        pattern: /追加/,
        translation: 'Add'
      }
    ];

    // Try to match patterns first (most specific first)
    for (const { pattern, translation } of patterns) {
      if (pattern.test(summary)) {
        return translation;
      }
    }

    // Enhanced word-by-word translation with better context handling
    const translations = {
      'Authorページ': 'author page',
      'authorページ': 'author page',
      'last detected列': 'last detected column',
      'Todayと表示': 'showing "Today"',
      '具体的な日時': 'specific datetime',
      '修正': 'fix',
      '改善': 'improve',
      '追加': 'add',
      '実装': 'implement',
      '更新': 'update',
      '削除': 'remove',
      'リファクタ': 'refactor',
      'テスト': 'test',
      'ドキュメント': 'documentation',
      'バグ': 'bug',
      'エラー': 'error',
      '機能': 'feature',
      'ページ': 'page',
      'コンポーネント': 'component',
      'API': 'API',
      'データベース': 'database',
      'フロントエンド': 'frontend',
      'バックエンド': 'backend',
      'ユーザー': 'user',
      '認証': 'authentication',
      'ログイン': 'login',
      '表示': 'display',
      'フォーマット': 'format',
      '一貫性': 'consistency',
      '統一': 'unify',
      '標準化': 'standardize',
      '同様に': 'like',
      'ように': 'to',
      'されている': 'is',
      'する': 'do',
      'が': 'but',
      'の': 'of',
      'を': '',
      'に': 'to',
      'で': 'in',
      'と': 'and',
      '他の': 'other',
      '他のページ': 'other pages'
    };

    let englishTitle = summary;
    
    // Replace Japanese terms with English equivalents
    for (const [japanese, english] of Object.entries(translations)) {
      englishTitle = englishTitle.replace(new RegExp(japanese, 'g'), english);
    }

    // Clean up and format the title
    englishTitle = englishTitle
      .replace(/[「」『』]/g, '"') // Replace Japanese quotes with English quotes
      .replace(/[（）]/g, '()') // Replace Japanese parentheses with English parentheses
      .replace(/[、。]/g, '') // Remove Japanese punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\s+and\s+/g, ' ') // Remove unnecessary "and"
      .replace(/\s+to\s+/g, ' ') // Remove unnecessary "to"
      .replace(/\s+is\s+/g, ' ') // Remove unnecessary "is"
      .replace(/\s+do\s+/g, ' ') // Remove unnecessary "do"
      .replace(/\s+but\s+/g, ' ') // Remove unnecessary "but"
      .replace(/\s+of\s+/g, ' ') // Remove unnecessary "of"
      .replace(/\s+in\s+/g, ' ') // Remove unnecessary "in"
      .replace(/\s+/g, ' ') // Normalize whitespace again
      .trim();

    // Capitalize first letter
    if (englishTitle.length > 0) {
      englishTitle = englishTitle.charAt(0).toUpperCase() + englishTitle.slice(1);
    }

    return englishTitle;
  }

  // New method to translate any Japanese text to English
  translateJapaneseToEnglish(text) {
    if (!text || typeof text !== 'string') return text;
    
    // Check if text contains Japanese characters
    const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
    if (!hasJapanese) return text;
    
    // Use the same translation logic as translateToEnglish
    return this.translateToEnglish(text);
  }

  generateBody(summary) {
    const sections = [
      this.generatePurpose(summary),
      this.generateSpecification(summary),
      this.generateRelatedLinks(summary),
      this.generateChecklist(summary)
    ].filter(section => section.trim().length > 0);

    return sections.join('\n\n');
  }

  generatePurpose(summary) {
    const currentIssue = this.generateCurrentIssue(summary);
    const englishSummary = this.translateToEnglish(summary);
    
    return `## Purpose (Goal)

${englishSummary}

This issue aims to improve the Health Checker system's functionality and user experience by addressing the specified requirements.

${currentIssue}`;
  }

  generateCurrentIssue(summary) {
    const summaryLower = summary.toLowerCase();
    
    if (summaryLower.includes('author') && summaryLower.includes('last detected')) {
      return `**Current Issue**: Author page displays "Today" for last detected column while other pages show specific datetime format (YYYY-MM-DD HH:mm:ss), creating inconsistent user experience.`;
    }
    
    if (summaryLower.includes('認証') || summaryLower.includes('authentication')) {
      return `**Current Issue**: The system currently lacks user authentication functionality, limiting access control and user management capabilities.`;
    }
    
    if (summaryLower.includes('api') || summaryLower.includes('バックエンド')) {
      return `**Current Issue**: Backend API functionality needs to be implemented or improved to support the required features.`;
    }
    
    if (summaryLower.includes('フロントエンド') || summaryLower.includes('frontend')) {
      return `**Current Issue**: Frontend components or user interface elements need to be updated or improved.`;
    }
    
    if (summaryLower.includes('データベース') || summaryLower.includes('database')) {
      return `**Current Issue**: Database structure or functionality needs to be modified to support the required features.`;
    }
    
    return `**Current Issue**: The system requires improvements to enhance functionality and user experience.`;
  }

  generateSpecification(summary) {
    const technicalDetails = this.generateTechnicalDetails(summary);
    const englishSummary = this.translateToEnglish(summary);
    
    return `## Specification (Spec)

Based on the requirements, the implementation should include:

- **Core Functionality**: ${englishSummary}
- **Technical Approach**: Follow project conventions and best practices
- **Integration**: Ensure compatibility with existing system components
- **Performance**: Maintain or improve system performance
- **Security**: Implement appropriate security measures
- **Documentation**: Update relevant documentation as needed

${technicalDetails}`;
  }

  generateTechnicalDetails(summary) {
    const summaryLower = summary.toLowerCase();
    
    if (summaryLower.includes('author') && summaryLower.includes('last detected')) {
      return `**Technical Details**:
- File to modify: \`frontend/src/pages/authors/[author].vue\`
- Current implementation: Custom formatDate function (lines 285-303) shows "Today" for same-day dates
- Target implementation: Use \`useAlerts\` composable's formatDate function like other pages
- Expected format: \`YYYY-MM-DD HH:mm:ss\` (e.g., "2024-01-15 14:30:25")`;
    }
    
    if (summaryLower.includes('認証') || summaryLower.includes('authentication')) {
      return `**Technical Details**:
- Implement user authentication system
- Add login/logout functionality
- Secure API endpoints with authentication middleware
- Update frontend components for authenticated state
- Add user session management`;
    }
    
    if (summaryLower.includes('api') || summaryLower.includes('バックエンド')) {
      return `**Technical Details**:
- Backend API implementation
- Database schema updates if needed
- Error handling and validation
- API documentation updates`;
    }
    
    if (summaryLower.includes('フロントエンド') || summaryLower.includes('frontend')) {
      return `**Technical Details**:
- Frontend component updates
- UI/UX improvements
- State management updates
- Component testing`;
    }
    
    if (summaryLower.includes('データベース') || summaryLower.includes('database')) {
      return `**Technical Details**:
- Database schema modifications
- Migration scripts
- Data validation
- Performance optimization`;
    }
    
    return `**Technical Details**:
- Analyze current implementation
- Design optimal solution approach
- Implement changes following project conventions
- Ensure proper testing and documentation`;
  }

  generateRelatedLinks(summary) {
    // Generate relevant links based on the summary content
    const relevantFiles = this.getRelevantFiles(summary);
    const externalLinks = this.getExternalLinks(summary);
    
    let links = '## Related Links and Resources\n\n';
    
    // Add relevant repository files
    if (relevantFiles.length > 0) {
      links += '**Repository Files:**\n';
      relevantFiles.forEach(file => {
        links += `- ${file}\n`;
      });
      links += '\n';
    }
    
    // Add external links
    if (externalLinks.length > 0) {
      links += '**External Resources:**\n';
      externalLinks.forEach(link => {
        links += `- ${link}\n`;
      });
    }
    
    return links.trim();
  }

  getRelevantFiles(summary) {
    const files = [];
    const summaryLower = summary.toLowerCase();
    
    // Frontend related files
    if (summaryLower.includes('author') || summaryLower.includes('ページ')) {
      files.push('frontend/src/pages/authors/[author].vue');
    }
    if (summaryLower.includes('alert') || summaryLower.includes('テーブル')) {
      files.push('frontend/src/components/Molecules/AlertTable.vue');
    }
    if (summaryLower.includes('composable') || summaryLower.includes('usealerts')) {
      files.push('frontend/src/composables/useAlerts.ts');
    }
    if (summaryLower.includes('api') || summaryLower.includes('バックエンド')) {
      files.push('backend/src/app.ts');
      files.push('backend/src/router.ts');
    }
    if (summaryLower.includes('database') || summaryLower.includes('データベース')) {
      files.push('backend/src/config/database.ts');
    }
    if (summaryLower.includes('test') || summaryLower.includes('テスト')) {
      files.push('frontend/tests/');
      files.push('backend/tests/');
    }
    if (summaryLower.includes('config') || summaryLower.includes('設定')) {
      files.push('frontend/nuxt.config.ts');
      files.push('backend/jest.config.ts');
    }
    
    // Always include common project files
    files.push('README.md');
    files.push('package.json');
    
    return [...new Set(files)]; // Remove duplicates
  }

  getExternalLinks(summary) {
    const links = [];
    const summaryLower = summary.toLowerCase();
    
    // Add relevant external links based on content
    if (summaryLower.includes('conventional') || summaryLower.includes('commit')) {
      links.push('[Conventional Commits](https://www.conventionalcommits.org/)');
    }
    if (summaryLower.includes('vue') || summaryLower.includes('nuxt')) {
      links.push('[Vue.js Documentation](https://vuejs.org/)');
      links.push('[Nuxt.js Documentation](https://nuxt.com/)');
    }
    if (summaryLower.includes('typescript') || summaryLower.includes('ts')) {
      links.push('[TypeScript Documentation](https://www.typescriptlang.org/)');
    }
    if (summaryLower.includes('jest') || summaryLower.includes('test')) {
      links.push('[Jest Documentation](https://jestjs.io/)');
    }
    if (summaryLower.includes('primevue') || summaryLower.includes('ui')) {
      links.push('[PrimeVue Documentation](https://primevue.org/)');
    }
    if (summaryLower.includes('moment') || summaryLower.includes('date')) {
      links.push('[Moment.js Documentation](https://momentjs.com/)');
    }
    
    return links;
  }

  generateChecklist(summary) {
    const specificTasks = this.generateSpecificTasks(summary);
    
    return `## Checklist (if necessary)

${specificTasks}

- [ ] Code review completed
- [ ] Performance impact assessed
- [ ] Security considerations addressed`;
  }

  generateSpecificTasks(summary) {
    const summaryLower = summary.toLowerCase();
    
    if (summaryLower.includes('author') && summaryLower.includes('last detected')) {
      return `- [ ] Analyze current formatDate implementation in author page
- [ ] Import useAlerts composable in author page
- [ ] Replace custom formatDate function with useAlerts.formatDate
- [ ] Remove custom formatDate function (lines 285-303)
- [ ] Test date formatting consistency across all pages
- [ ] Verify no breaking changes to existing functionality
- [ ] Update any related tests if necessary`;
    }
    
    if (summaryLower.includes('認証') || summaryLower.includes('authentication')) {
      return `- [ ] Design authentication system architecture
- [ ] Implement backend authentication middleware
- [ ] Create user login/logout API endpoints
- [ ] Implement frontend authentication components
- [ ] Add user session management
- [ ] Implement password hashing and security measures
- [ ] Add authentication tests
- [ ] Update API documentation`;
    }
    
    if (summaryLower.includes('api') || summaryLower.includes('バックエンド')) {
      return `- [ ] Design API endpoints
- [ ] Implement backend logic
- [ ] Add input validation and error handling
- [ ] Create API tests
- [ ] Update API documentation
- [ ] Verify API performance`;
    }
    
    if (summaryLower.includes('フロントエンド') || summaryLower.includes('frontend')) {
      return `- [ ] Design UI/UX components
- [ ] Implement frontend components
- [ ] Add component tests
- [ ] Update styling and responsive design
- [ ] Verify cross-browser compatibility`;
    }
    
    if (summaryLower.includes('データベース') || summaryLower.includes('database')) {
      return `- [ ] Design database schema changes
- [ ] Create migration scripts
- [ ] Update data models
- [ ] Add database tests
- [ ] Verify data integrity
- [ ] Optimize database performance`;
    }
    
    return `- [ ] Analyze requirements
- [ ] Design implementation approach
- [ ] Implement changes following project conventions
- [ ] Add appropriate tests
- [ ] Update documentation if necessary
- [ ] Verify no breaking changes`;
  }

  estimateStoryPoints(summary) {
    const complexity = this.analyzeComplexity(summary);
    
    let spValue;
    let reasoning;

    if (complexity === 'low') {
      spValue = 1;
      reasoning = 'Simple change with minimal impact';
    } else if (complexity === 'medium-low') {
      spValue = 2;
      reasoning = 'Straightforward implementation with some complexity';
    } else if (complexity === 'medium') {
      spValue = 3;
      reasoning = 'Moderate complexity requiring careful implementation';
    } else if (complexity === 'medium-high') {
      spValue = 5;
      reasoning = 'Significant changes affecting multiple components';
    } else if (complexity === 'high') {
      spValue = 8;
      reasoning = 'Complex implementation with architectural considerations';
    } else {
      spValue = 13;
      reasoning = 'Major feature requiring extensive planning and implementation';
    }

    return { value: spValue, reasoning };
  }

  analyzeComplexity(summary) {
    const lowComplexityKeywords = ['update', 'fix', 'small', 'minor', 'typo', 'style'];
    const highComplexityKeywords = ['implement', 'create', 'add', 'new feature', 'architecture', 'refactor', 'migration'];
    
    const summaryLower = summary.toLowerCase();
    
    const lowCount = lowComplexityKeywords.filter(keyword => summaryLower.includes(keyword)).length;
    const highCount = highComplexityKeywords.filter(keyword => summaryLower.includes(keyword)).length;
    
    if (lowCount > highCount) return 'low';
    if (highCount > lowCount) return 'high';
    if (summary.length < 50) return 'low';
    if (summary.length > 200) return 'high';
    return 'medium';
  }

  suggestLabels(summary) {
    const labels = [];
    const summaryLower = summary.toLowerCase();
    
    if (summaryLower.includes('bug') || summaryLower.includes('fix')) {
      labels.push('bug');
    }
    if (summaryLower.includes('feature') || summaryLower.includes('add') || summaryLower.includes('implement')) {
      labels.push('enhancement');
    }
    if (summaryLower.includes('doc') || summaryLower.includes('readme')) {
      labels.push('documentation');
    }
    if (summaryLower.includes('refactor')) {
      labels.push('refactoring');
    }
    if (summaryLower.includes('test')) {
      labels.push('testing');
    }
    
    return labels.length > 0 ? labels : ['enhancement'];
  }

  formatOutput(proposal) {
    return `**Generated Issue Proposal:**

**Title:** ${proposal.title}

**Body:**
${proposal.body}

**Story Points:** ${proposal.storyPoints.value} - ${proposal.storyPoints.reasoning}

**Suggested Labels:** ${proposal.labels.join(', ')}`;
  }
}

// CLI usage
if (require.main === module) {
  const summary = process.argv[2];
  
  if (!summary) {
    console.error('Usage: node issue-generator.js "summary text"');
    process.exit(1);
  }
  
  const generator = new IssueGenerator();
  const proposal = generator.generateIssueProposal(summary);
  console.log(generator.formatOutput(proposal));
}

module.exports = IssueGenerator;
