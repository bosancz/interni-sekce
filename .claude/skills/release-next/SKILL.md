---
name: release-next
description: Release the current branch to the NEXT environment by dispatching the "Release to NEXT" GitHub Actions workflow (.github/workflows/release-next.yml) against that branch. Use when the user asks to release/deploy to NEXT, ship the branch to NEXT, or says "/release-next".
allowed-tools: Bash(git rev-parse:*), mcp__github__actions_run_trigger
---

# Release current branch to NEXT

1. Dispatch the workflow against the current branch. Nothing else — no pre-checks, no watching the run.

```
mcp__github__actions_run_trigger
  method: run_workflow
  owner: bosancz
  repo: interni-sekce
  workflow_id: release-next.yml
  ref: <output of `git rev-parse --abbrev-ref HEAD`>
```

2. Print following three lines:
* `Expected tag: NEXT-<git sha>` (use current commit's short SHA - `git rev-parse --short=7 HEAD`)
* `Workflow: https://github.com/bosancz/interni-sekce/actions/workflows/release-next.yml`
* `NEXT deployment: https://next.interni.bosan.cz`

3. Stop.
