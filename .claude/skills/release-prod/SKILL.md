---
name: release-prod
description: Release master to PRODUCTION by dispatching the "Release to PRODUCTION" GitHub Actions workflow (.github/workflows/release-production.yml) with a semver bump. Use when the user asks to release/deploy to production/PROD, ship to production, or says "/release-prod".
allowed-tools: Bash(git fetch:*), Bash(git log:*), Bash(git describe:*), Bash(git rev-parse:*), Bash(date:*), mcp__github__actions_run_trigger, mcp__github__actions_get, mcp__github__actions_list, AskUserQuestion
---

# Release master to PRODUCTION

PRODUCTION is always released from `master` — never from a feature branch.

1. **The user MUST provide the semver bump** (`patch`, `minor`, `major` or `none`). If they did not, ask — never guess or default.
   Before asking, run `git fetch origin master --tags` and list the commits since the last release:

```
git log --no-merges --format='%s' $(git describe --tags --abbrev=0 --match 'v*' origin/master)..origin/master
```

   Ask with `AskUserQuestion` (options `patch`, `minor`, `major`, `none`) and put into the question a **very short** summary: the last version, the number of commits, and whether they contain any `feat` (→ suggest `minor`) or only `patch`/`fix`/other (→ suggest `patch`), e.g. `v4.12.3 → 14 commits, 2× feat (Fotka dne, Kontrola obličejů), rest patch/fix.` Mark the suggested option "(Recommended)".

2. Dispatch the workflow. Print `Releasing to PRODUCTION (<semver>)...` first.

```
mcp__github__actions_run_trigger
  method: run_workflow
  owner: bosancz
  repo: interni-sekce
  workflow_id: release-production.yml
  ref: master
  inputs: { semver: <bump> }
```

3. Get the workflow run URL and print `Workflow: <LINK TO WORKFLOW RUN>`.

4. Wait for the workflow to finish: poll `mcp__github__actions_get` (`get_workflow_run`) until `status` is `completed`, then read `conclusion`.

   **Measure the waiting by the wall clock, never by how many sleeps you have issued** — in a sandbox `sleep` often returns without real time passing. Wait between polls with an until-loop against `date` and compare `date -u` with the run's `run_started_at`:

```
T=$(( $(date +%s) + 60 )); until [ "$(date +%s)" -ge "$T" ]; do sleep 5; done
```

   **Never cancel the run and never dispatch a second one** — the workflow has `cancel-in-progress`, so a second dispatch kills the first. If it is still running after 30 minutes **on the wall clock**, print the run URL, say it is still going, and stop.

5. After it finishes, print:

On workflow fail:

- `Failed. `

On workflow success:

- `Released to PRODUCTION.`
- `Version: <new tag>` (from the "Resolve version" job, or `git fetch origin --tags` and the newest `v*` tag)
- `Open: https://interni.bosan.cz`

6. Stop.
