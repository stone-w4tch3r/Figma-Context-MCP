---
name: sync-pr-branch
description: Sync a PR branch with upstream/main to resolve stale/conflicting PRs
# --- Claude Code Specific ---
context: fork
---

Sync a PR branch with upstream to make it mergeable again.

**Prerequisites**: Upstream must already be fetched. Run `/sync-fork` first if the fork's main branch is also behind.

## Steps

1. **Identify the PR**: `gh pr list --state open --repo <upstream> --author <user>` or check `gh pr view <number>`.
2. **Checkout the branch**: `git checkout <branch>` (fetch from origin if needed).
3. **Merge upstream**: `git merge upstream/main`.
4. **Resolve conflicts**: Version files (package.json, lockfiles) — take upstream and regenerate. Code conflicts — keep both sides where additive, prefer upstream for structural changes.
5. **Fix post-merge issues**: Run `pnpm install`, `pnpm type-check`, `pnpm build`, `pnpm test`. Fix any breakage (e.g. jest→vitest migration, import changes).
6. **Commit and push**: `git add -A && git commit` then `git push origin <branch>`.
7. **Verify**: `gh pr view <number> --repo <upstream> --json mergeable,mergeStateStatus` should show MERGEABLE/CLEAN.
8. **Return to main**: `git checkout main`.

**STOP and report** for complex merge conflicts requiring complex logic understanding and rewriting or breaking API changes.
