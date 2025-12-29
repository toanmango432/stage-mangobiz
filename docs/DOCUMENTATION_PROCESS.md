# Documentation Process Guide

**Version:** 1.0
**Last Updated:** December 28, 2025
**Status:** Active

---

## Overview

This guide defines how documentation is maintained throughout the Mango POS development lifecycle. The core principle is **Docs as Code** - documentation is updated in the same PR as code changes to prevent drift.

---

## The Golden Rule

```
1 Pull Request = Code Changes + Documentation Updates
```

**Never merge code without updating relevant documentation.**

---

## Document Types & Ownership

| Document Type | Location | When to Update | Owner |
|---------------|----------|----------------|-------|
| **PRD** | `docs/product/` | Before/during feature development | PM / Lead Dev |
| **Design Spec** | `docs/design/` | Before/during UI implementation | Designer / Lead Dev |
| **API Spec** | `docs/api/` | When endpoints change | Backend Dev |
| **Technical Docs** | `docs/architecture/` | When architecture changes | Tech Lead |
| **CLAUDE.md** | Root | When project config changes | Any Dev |

---

## When to Update Each Document

### PRD (Product Requirements Document)

**Update when:**
- New feature is being planned
- Requirements change during development
- Acceptance criteria need clarification
- Business rules are modified
- User flows are updated

**Required sections to check:**
- [ ] Feature Requirements table
- [ ] Acceptance Criteria
- [ ] Business Rules
- [ ] Success Metrics

### Design Spec

**Update when:**
- New UI component is created
- Existing component visual changes
- Interaction patterns change
- Responsive behavior changes
- Accessibility requirements change

**Required sections to check:**
- [ ] Component specifications
- [ ] States (default, hover, active, disabled, loading)
- [ ] Responsive behavior
- [ ] Color/typography if changed

### API Spec

**Update when:**
- New endpoint is added
- Request/response format changes
- Error codes change
- Authentication changes

---

## Development Workflow

### Starting a New Feature

```
┌─────────────────────────────────────────┐
│ 1. Check if PRD exists                  │
│    ├─ No → Create using template        │
│    └─ Yes → Review for completeness     │
├─────────────────────────────────────────┤
│ 2. Check if Design Spec exists          │
│    ├─ No → Create using template        │
│    └─ Yes → Review for completeness     │
├─────────────────────────────────────────┤
│ 3. Implement feature                    │
│    └─ Update docs as you code           │
├─────────────────────────────────────────┤
│ 4. Create PR with code + docs           │
│    └─ Use PR template checklist         │
├─────────────────────────────────────────┤
│ 5. Review includes doc check            │
│    └─ Verify docs match implementation  │
├─────────────────────────────────────────┤
│ 6. Merge when approved                  │
└─────────────────────────────────────────┘
```

### Modifying Existing Feature

```
1. Find relevant PRD and Design Spec
2. Read current documentation
3. Make code changes
4. Update affected documentation sections
5. Update version number and changelog
6. Include all changes in same PR
```

---

## Definition of Done

A feature is **not done** until:

### Code
- [ ] Code compiles without errors
- [ ] Code reviewed and approved
- [ ] Tests pass

### Documentation
- [ ] PRD updated (if requirements changed)
- [ ] Design Spec updated (if UI changed)
- [ ] API Spec updated (if endpoints changed)
- [ ] Acceptance criteria verified
- [ ] Version/changelog updated

---

## PR Documentation Checklist

Every PR must include documentation updates. Use this checklist:

```markdown
### Documentation (Required for Feature PRs)

- [ ] **PRD Updated** (if requirements changed)
  - [ ] Acceptance criteria updated
  - [ ] Business rules updated
  - [ ] Feature requirements updated

- [ ] **Design Spec Updated** (if UI changed)
  - [ ] Component specifications updated
  - [ ] States documented
  - [ ] Responsive behavior documented

- [ ] **API Spec Updated** (if endpoints changed)
  - [ ] Request/response formats documented
  - [ ] Error codes documented

- [ ] **No documentation changes needed** (explain why)
```

---

## Document Templates

### Creating a New PRD

1. Copy template from `docs/templates/PRD_TEMPLATE.md`
2. Rename to `PRD-[Module-Name]-Module.md`
3. Save to `docs/product/`
4. Fill in all 11 sections
5. Ensure all requirements have acceptance criteria

### Creating a New Design Spec

1. Copy template from `docs/templates/DESIGN_SPEC_TEMPLATE.md`
2. Rename to `[MODULE]_DESIGN_SPEC.md`
3. Save to `docs/design/`
4. Fill in all sections
5. Ensure all components have states documented

---

## Document Quality Standards

### PRD Quality Checklist

| Criteria | Description |
|----------|-------------|
| **Complete** | All 11 sections filled |
| **Testable** | All requirements have acceptance criteria |
| **Prioritized** | Requirements have P0/P1/P2 priority |
| **ID'd** | Requirements have IDs (MOD-P0-001) |
| **Current** | Matches implemented behavior |

### Design Spec Quality Checklist

| Criteria | Description |
|----------|-------------|
| **Complete** | All components defined |
| **Specified** | Dimensions, colors in hex, typography |
| **Stateful** | All states documented (default, hover, etc.) |
| **Responsive** | All breakpoints covered |
| **Accessible** | WCAG requirements included |

---

## Monthly Documentation Health Check

Run this check monthly to catch documentation drift:

```markdown
## Monthly Doc Health Check - [Month Year]

### Random PRD Audit (Pick 3)
- [ ] PRD 1: _________ - Matches code? Y/N
- [ ] PRD 2: _________ - Matches code? Y/N
- [ ] PRD 3: _________ - Matches code? Y/N

### Random Design Spec Audit (Pick 3)
- [ ] Spec 1: _________ - Matches UI? Y/N
- [ ] Spec 2: _________ - Matches UI? Y/N
- [ ] Spec 3: _________ - Matches UI? Y/N

### Issues Found
1. [Issue and fix needed]
2. [Issue and fix needed]

### Actions Taken
1. [Fix applied]
2. [Fix applied]

### Audited By: [Name]
### Date: [Date]
```

---

## V1 Launch Documentation Audit

### 2 Weeks Before Launch

Run complete documentation audit:

```markdown
## V1 Launch Documentation Audit

### PRD Completeness (19 modules)
- [ ] All 19 modules have PRD
- [ ] All PRDs have 11 sections complete
- [ ] All requirements have acceptance criteria
- [ ] All requirements have IDs
- [ ] All PRDs reviewed and approved

### Design Spec Completeness (19 modules)
- [ ] All 19 modules have Design Spec
- [ ] All specs have component definitions
- [ ] All specs have interaction patterns
- [ ] All specs have responsive behavior
- [ ] All specs have accessibility requirements

### Technical Documentation
- [ ] API spec covers all endpoints
- [ ] Data models documented
- [ ] State management documented
- [ ] Offline behavior documented

### Quality Checks
- [ ] All docs match current code
- [ ] All links work
- [ ] Version numbers reflect V1.0
- [ ] Last updated dates are current

### Sign-off
- [ ] Product Manager: ___________
- [ ] Tech Lead: ___________
- [ ] Designer: ___________

Date: ___________
```

---

## Document Versioning

### Version Number Format

`Major.Minor` (e.g., 1.0, 2.1, 3.0)

| Change Type | Version Bump |
|-------------|--------------|
| Initial creation | 1.0 |
| Minor updates (typos, clarifications) | +0.1 |
| Major updates (new features, requirements) | +1.0 |
| V1 launch baseline | Set to final version |

### Changelog Format

```markdown
## Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 2.0 | 2025-12-28 | @username | Added Phase 2-4 requirements |
| 1.1 | 2025-12-15 | @username | Updated acceptance criteria |
| 1.0 | 2025-11-01 | @username | Initial version |
```

---

## Quick Reference

### Document Locations

```
docs/
├── product/               # PRDs
│   ├── PRD-[Module]-Module.md
│   └── ...
├── design/               # Design Specs
│   ├── [MODULE]_DESIGN_SPEC.md
│   └── ...
├── api/                  # API Specs
│   └── API_SPEC.md
├── architecture/         # Technical Docs
│   └── TECHNICAL_DOCUMENTATION.md
├── templates/            # Templates
│   ├── PRD_TEMPLATE.md
│   └── DESIGN_SPEC_TEMPLATE.md
└── DOCUMENTATION_PROCESS.md  # This file
```

### Common Tasks

| Task | Steps |
|------|-------|
| Create new PRD | Copy template → Rename → Fill sections |
| Create new Design Spec | Copy template → Rename → Fill sections |
| Update existing doc | Edit → Update version → Update changelog |
| Review PR docs | Check PR template checklist → Verify accuracy |

---

## FAQ

### Q: Do I need to update docs for bug fixes?

**A:** Only if the bug fix changes behavior documented in the PRD or UI documented in the Design Spec. Small fixes don't require doc updates.

### Q: What if I find outdated documentation?

**A:** Create a PR to fix it immediately. Small fixes can be separate PRs. Large updates should follow the normal process.

### Q: Who reviews documentation?

**A:** The same reviewers who review code. Documentation is part of the PR and should be checked for accuracy.

### Q: How detailed should Design Specs be?

**A:** Detailed enough that a developer can implement the UI without asking questions. Include exact colors, sizes, states, and responsive behavior.

### Q: Can I skip documentation for prototypes?

**A:** For true throw-away prototypes, yes. But if it might become production code, document it from the start.

---

*Documentation Process Guide v1.0 - Mango Biz*
