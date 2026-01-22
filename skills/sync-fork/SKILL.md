---
name: sync-fork
description: Sync fork with upstream, auto-fix issues, bump version, and publish to NPM
# --- Claude Code Specific ---
context: fork
# --- OpenCode Specific ---
subtask: true
---

Sync fork with upstream repository, handle all simple issues automatically, ensure version bump, and publish to NPM. Follow these steps, verifying after each step before proceeding.

**IMPORTANT**: After every upstream merge, a version bump and NPM release is ALWAYS performed - even if upstream had no version changes, we apply a custom minor version bump to the fork.

## Prerequisites

- Must be in a git repository with upstream configured
- GitHub CLI (gh) must be installed and authenticated
- Upstream remote must be named "upstream"

## Step-by-Step Process

### 1. Verify Repository State

- Check: `git remote -v` - Verify upstream remote exists
- Check: `git status` - Ensure working tree is clean (no uncommitted changes)
- If working tree is dirty, STOP and report to user

### 2. Fetch Upstream Changes

- Run: `git fetch upstream`
- Verify: Check if upstream/main has new commits compared to current HEAD
- Run: `git log origin/main..upstream/main --oneline` to see commits behind
- Run: `git log upstream/main..origin/main --oneline` to see commits ahead

### 3. Merge Upstream into Main

- Run: `git merge upstream/main`
- Auto-fix if possible:
  - Simple conflicts (whitespace, trivial merges) - resolve automatically
  - Changeset conflicts - update package name references if known
- For complex conflicts or merge conflicts: STOP and report immediately
- Verify: `git status` shows successful merge

### 4. Handle Common Post-Merge Issues

**Changeset package name mismatch**:

- If error mentions changeset package name not in workspace:
  - Check package.json for actual package name
  - Update .changeset/\*.md files to use correct package name
  - Commit and push fix
  - This is safe to auto-fix

**Dependencies changes**:

- If package.json has dependency conflicts or outdated versions:
  - Run: `pnpm install` to resolve
  - Update lockfile and commit
  - Safe to auto-fix

**Minor renamings**:

- If import paths or exports changed:
  - Find all references and update to match new structure
  - Test with `pnpm type-check` and `pnpm build`
  - Commit fixes
  - Safe to auto-fix for obvious patterns

**Other simple issues**:

- Missing files from merge - attempt to rebase or fix
- Minor conflicts - resolve with obvious strategy

**STOP and report for**:

- Complex merge conflicts requiring code understanding
- Breaking changes that need human decision
- Major API changes requiring migration strategy
- Workflow configuration changes

### 5. Push to Origin

- Run: `git push origin main`
- Verify: Check git status confirms push succeeded
- Verify: Run `git log origin/main -1 --oneline` matches local HEAD

### 6. Verify GitHub Actions Status

- Run: `gh run list --limit 5` to see recent workflow runs
- Wait for the push workflow to complete
- If workflow fails:
  - Fetch logs: `gh run view <run-id> --log`
  - **Auto-fix if simple issues**:
    - Build errors due to minor version updates - update relevant configs
    - Test failures from runtime/dependency changes - fix imports or update tests
    - Simple configuration mismatches - update to match upstream
    - Run `pnpm install` to resolve dependency issues
    - Fix any auto-fixable issues, commit, and push again
  - **STOP for complex failures**:
    - Test failures indicating logic bugs or behavioral changes
    - Build errors requiring architectural understanding
    - TypeScript errors from major API changes
    - Dependency conflicts requiring manual resolution
- Verify: Latest run status is "completed" and "success"

### 7. Verify Automatic PR Creation

- The push workflow should automatically create a release PR (changeset-release/main branch)
- Wait 30-60 seconds and check: `gh pr list --head changeset-release/main`
- **If PR exists and checks are passing**:
  - Merge: `gh pr merge <pr-number> --merge`
  - Verify merge succeeded
  - Continue to step 8
- **If PR exists but has failing checks**:
  - Investigate: `gh pr view <pr-number> --json,statusCheckRollup`
  - Try to auto-fix simple issues (similar to step 6)
  - If fixable: fix, commit, push, wait for PR to re-run checks, then merge
  - If not fixable: STOP and report
- **If PR was NOT created after push** (problem!):
  - Check workflow logs for changeset action: `gh run view <run-id> --log`
  - Research why PR wasn't created:
    - Check if .changeset files exist
    - Check if changeset workflow is configured correctly
    - Check for authentication issues
  - Try to fix:
    - If changesets exist but action failed, investigate and fix workflow configuration
    - If no changesets exist but upstream had changes, create one manually:
      - Run: `pnpm changeset`
      - Choose minor version bump
      - Add description: "Sync fork with upstream - merged upstream changes"
      - Commit and push
      - Wait for PR to be created
  - If unable to fix after investigation: STOP and report with details

**IMPORTANT**: Never manually create PR with `gh pr create`. It must be created automatically by the workflow.

### 8. Verify Release to NPM Action

- Run: `gh run list --limit 5` to check for release workflow
- Wait for the release workflow to complete
- If workflow fails:
  - Fetch logs: `gh run view <run-id> --log`
  - **Auto-fix if simple issues**:
    - NPM token issues - check NPM_TOKEN secret exists
    - Version conflicts - may need to revert and try again
    - Simple configuration issues
  - **STOP for complex failures**:
    - Build errors during release
    - Package.json validation errors
    - Authentication/permission issues
- Verify: Release workflow status is "completed" and "success"

### 9. Ensure Version Bump and Release

**After every upstream merge, we MUST publish a release**:

- Check current version in package.json
- Check latest published version: `npm view <package-name> version`
- **If published version equals package.json version** (no release happened yet):
  - Create a changeset for minor version bump:
    - Run: `pnpm changeset`
    - Select minor version bump
    - Description: "Sync fork with upstream - merged upstream changes"
  - Commit changeset: `git add .changeset/*.md && git commit -m "Add changeset for fork sync release"`
  - Push: `git push origin main`
  - Wait for release PR to be created (step 7 logic again)
  - Merge the PR
  - Wait for release workflow
- **If published version is higher than package.json** (release already happened):
  - Update local package.json to match published version
  - Commit: `git add package.json pnpm-lock.yaml && git commit -m "Update package.json to match published version"`
  - Push: `git push origin main`

### 10. Verify NPM Package Published

- Get current version from package.json
- Run: `npm view <package-name> version` to verify published version
- Verify: Published version equals package.json version
- If package not found or version mismatch:
  - Check release workflow logs
  - Attempt to investigate and fix simple issues
  - If not fixable: STOP and report

## Final Verification

- Confirm fork is now in sync with upstream
- Verify GitHub Actions are green
- Confirm NPM package is updated
- Report status summary to user

## Error Handling Rules

**Auto-fix these simple issues:**

- Changeset package name mismatches (update to match package.json)
- Simple merge conflicts (trivial, whitespace)
- Stale git references (git fetch, rebase)
- Dependency conflicts or outdated versions (run pnpm install)
- Minor renamings and import path changes
- Build errors due to minor version/runtime updates
- Test failures from simple dependency or runtime changes
- Simple configuration mismatches (sync with upstream)
- NPM token or simple authentication issues in release workflow

**STOP and report immediately for:**

- Complex merge conflicts requiring code understanding
- Test failures indicating logic bugs or behavioral changes
- Build errors requiring architectural understanding
- TypeScript errors from major API changes
- NPM publishing failures that aren't simple token issues
- Major dependency conflicts requiring manual resolution
- Workflow configuration changes requiring human review
- Missing or corrupted files
- Complex authentication/permission issues
- PR not created by workflow (after investigation and attempted fixes)
- Any situation requiring human decision or code review

**Report format:**

- Clear description of what stopped
- Steps taken before failure
- Suggested next actions or requirements for human intervention
