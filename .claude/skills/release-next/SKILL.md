---
name: release-next
description: Release the current branch to the NEXT environment by dispatching the "Release to NEXT" GitHub Actions workflow (.github/workflows/release-next.yml) against that branch. Use when the user asks to release/deploy to NEXT, ship the branch to NEXT, or says "/release-next".
allowed-tools: Bash(git rev-parse:*), mcp__github__actions_run_trigger
---

# Release current branch to NEXT

1. Dispatch the workflow against the current branch. Nothing else — no pre-checks, no watching the run.
   Print these lines before dispatching the workflow:

- `Releasing to NEXT...`

```
mcp__github__actions_run_trigger
  method: run_workflow
  owner: bosancz
  repo: interni-sekce
  workflow_id: release-next.yml
  ref: <output of `git rev-parse --abbrev-ref HEAD`>
```

2. Get the workflow run URL and print these lines:

- `Workflow: <LINK TO WORKFLOW RUN>`

3. Wait for the workflow to finish and after it finishes, print these lines:

On workflow fail:

- `Failed. `

On workflow success:

- `Released to NEXT.`
- `Expected tag: NEXT-<git sha>` (use current commit's short SHA - `git rev-parse --short=7 HEAD`)
- `Open: https://next.interni.bosan.cz`

4. Stop.
