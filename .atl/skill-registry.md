# Skill Registry — MemorAIA

Generated: 2026-04-01

## Project Conventions

| Source | Path | Description |
|--------|------|-------------|
| CLAUDE.md | `CLAUDE.md` | Project instructions, references AGENTS.md |
| AGENTS.md | `AGENTS.md` | Next.js 16.2.1 breaking changes warning — read docs before writing code |

## User Skills

| Skill | Trigger | Compact Rules |
|-------|---------|---------------|
| branch-pr | Creating PRs | Follow issue-first enforcement |
| issue-creation | Creating GitHub issues | Follow issue-first enforcement |
| judgment-day | Adversarial review | Parallel blind judge protocol |
| go-testing | Go tests, Bubbletea TUI | Go testing patterns (N/A for this project) |
| skill-creator | Creating new AI skills | Agent Skills spec |

## Compact Rules

### Next.js 16.2.1 Convention
- This is NOT standard Next.js — APIs, conventions, and file structure differ from training data
- MUST read relevant guide in `node_modules/next/dist/docs/` before writing any code
- Heed deprecation notices (e.g., `middleware.ts` → `proxy.ts`)
