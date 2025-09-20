## Description

### 🎯 Purpose
Cursor上で開発を進める際に利用する一連のDev Commandsを実装する。プロジェクトの開発フローを統一し、/issue から /pr までをシームレスに管理できるようにする。

### 📋 Issue Information
- **Issue**: #115 - Implement Cursor Dev Commands
- **Branch**: `115-implement-cursor-dev-commands`
- **Base Branch**: `develop`
- **Status**: OPEN

### ✨ What's Changed
This PR implements a comprehensive set of Cursor Dev Commands to streamline the development workflow:

#### Implemented Commands:
- ✅ `/issue` - GitHub issue information retrieval and documentation
- ✅ `/branch` - Issue-based branch creation with git status handling  
- ✅ `/spec` - Specification document generation from template
- ✅ `/plan` - Implementation plan document generation
- ✅ `/dev` - Flexible development methodology support (TDD/Direct)
- ✅ `/test` - Test execution and evidence collection
- ✅ `/pr` - 3-step Pull Request creation process

#### Key Features:
- **Template-based documentation**: Consistent structure using templates in `.cursor/templates/`
- **Interactive AI Agent collaboration**: Commands leverage AI Agent for intelligent automation
- **Git workflow integration**: Automatic branch creation, status checks, and PR management
- **Flexible development approaches**: Support for both TDD and Direct Implementation
- **Comprehensive documentation**: Auto-generated docs for issues, specs, plans, and PRs

### 📁 Files Changed
- **Modified**: `.cursor/commands.json` - Complete command definitions with prompts and parameters
- **Deleted**: `.cursor/scripts/common.ps1` - Removed in favor of AI Agent approach
- **Deleted**: `.cursor/scripts/common.sh` - Removed in favor of AI Agent approach

### 🔄 Recent Commits
```
38d141d docs: recreate pr.md documentation for issue 115
604409b docs: update PR documentation to match pr-template.md structure
2e50751 docs: add comprehensive PR documentation for issue 115
fcb91c2 feat: modify PR command to create pr.md documentation first
448ed03 feat: enhance PR command with pre-commit validation
e3cfd84 feat: implement cursor dev commands system
```

## Cursor Log

### Development Process
1. **Command Structure Design**: Created comprehensive command definitions in `commands.json`
2. **Template Integration**: Integrated markdown templates for consistent documentation
3. **AI Agent Collaboration**: Implemented interactive prompts for intelligent automation
4. **PR Workflow Enhancement**: Added 3-step PR creation process with validations

### Implementation Highlights
- Each command follows a structured prompt pattern for AI Agent interaction
- Commands support both required and optional parameters
- Interactive confirmation steps ensure user control over critical operations
- Documentation is automatically generated and saved to appropriate paths

## Evidence

### Command Implementation Status
- [x] `/issue` - Fetch and save GitHub issue information
- [x] `/branch` - Create branches with git status handling
- [x] `/spec` - Generate specification documents
- [x] `/plan` - Create implementation plans
- [x] `/dev` - Support flexible development methodologies
- [x] `/test` - Execute tests and collect evidence
- [x] `/pr` - Create Pull Requests with documentation

### Testing
The commands have been designed to work with Cursor's AI Agent system, enabling:
- Automated issue tracking and documentation
- Consistent development workflow across the team
- Template-based documentation generation
- Interactive development process with user confirmations

### Notes
- Removed shell scripts in favor of AI Agent-based approach for better flexibility
- All commands now use structured prompts for consistent behavior
- Documentation paths follow the pattern: `docs/issues/{issue_number}/{document_type}.md`
