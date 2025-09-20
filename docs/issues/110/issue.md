# Issue #110: feat: Fix author page last detected column to show specific datetime like other pages

## Issue Information

- **Issue Number**: 110
- **Title**: feat: Fix author page last detected column to show specific datetime like other pages
- **URL**: https://github.com/TeckVeho/health-checker/issues/110
- **State**: OPEN
- **Created**: 2025-09-12T01:42:54Z
- **Updated**: 2025-09-12T01:42:54Z
- **Labels**: frontend
- **Assignees**: None

## Purpose (Goal)

Fix author page last detected column to show specific datetime like other pages

This issue aims to improve the Health Checker system's functionality and user experience by addressing the specified requirements.

**Current Issue**: Author page displays "Today" for last detected column while other pages show specific datetime format (YYYY-MM-DD HH:mm:ss), creating inconsistent user experience.

## Specification (Spec)

Based on the requirements, the implementation should include:

- **Core Functionality**: Fix author page last detected column to show specific datetime like other pages
- **Technical Approach**: Follow project conventions and best practices
- **Integration**: Ensure compatibility with existing system components
- **Performance**: Maintain or improve system performance
- **Security**: Implement appropriate security measures
- **Documentation**: Update relevant documentation as needed

**Technical Details**:
- File to modify: `frontend/src/pages/authors/[author].vue`
- Current implementation: Custom formatDate function (lines 285-303) shows "Today" for same-day dates
- Target implementation: Use `useAlerts` composable's formatDate function like other pages
- Expected format: `YYYY-MM-DD HH:mm:ss` (e.g., "2024-01-15 14:30:25")

## Related Links and Resources

**Repository Files:**
- frontend/src/pages/authors/[author].vue
- README.md
- package.json

## Implementation Status

### Checklist

- [ ] Analyze current formatDate implementation in author page
- [ ] Import useAlerts composable in author page
- [ ] Replace custom formatDate function with useAlerts.formatDate
- [ ] Remove custom formatDate function (lines 285-303)
- [ ] Test date formatting consistency across all pages
- [ ] Verify no breaking changes to existing functionality
- [ ] Update any related tests if necessary

### Quality Assurance

- [ ] Code review completed
- [ ] Performance impact assessed
- [ ] Security considerations addressed

## Development Notes

*This section will be updated during implementation*

---

**Generated on**: 2025-09-20
**Issue fetched using**: GitHub CLI (`gh issue view 110`)
