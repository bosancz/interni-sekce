---
name: release-next
description: Release the current branch to the NEXT environment by dispatching the "Release to NEXT" GitHub Actions workflow (.github/workflows/release-next.yml) against that branch, then following the run to completion. Use when the user asks to release/deploy to NEXT, ship the branch to NEXT, or says "/release-next".
allowed-tools: Bash(git status:*), Bash(git rev-parse:*), Bash(git branch:*), Bash(git log:*), Bash(git push:*), Bash(gh workflow run:*), Bash(gh run list:*), Bash(gh run view:*), Bash(gh run watch:*)
---

# Release current branch to NEXT

`.github/workflows/release-next.yml` is `workflow_dispatch`-only and takes no inputs — the branch it is dispatched against is what gets built, deployed and tagged `NEXT`. The version the app reports is `NEXT-<short sha>` of that ref.

## 1. Establish what is being released

```bash
git rev-parse --abbrev-ref HEAD
git status --porcelain
git log --oneline -1
```

The workflow builds the **remote** ref, so the local working tree is irrelevant to the build but tells you whether the user's latest work is actually included:

- **Uncommitted changes** — say which files are dirty and that they will *not* be part of the release. Ask whether to proceed or commit first.
- **Unpushed commits** — push them before dispatching, otherwise you release stale code:
  ```bash
  git push -u origin "$(git rev-parse --abbrev-ref HEAD)"
  ```
- **Branch not on the remote at all** — `gh workflow run` fails with "no ref found"; push it first.

## 2. Dispatch

```bash
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
gh workflow run release-next.yml --ref "$BRANCH"
```

`concurrency: cancel-in-progress: true` is set on the workflow, so dispatching cancels any NEXT release already running. If the user might be stepping on someone else's release, check first with `gh run list --workflow=release-next.yml --status in_progress`.

## 3. Follow the run

The dispatch returns no run ID, and the run takes a few seconds to appear. Poll for it rather than assuming the newest run is yours:

```bash
gh run list --workflow=release-next.yml --branch "$BRANCH" --limit 1 \
  --json databaseId,status,headSha,createdAt
```

Then watch it, and report the outcome:

```bash
gh run watch <databaseId> --exit-status
```

`gh run watch` blocks until the run finishes — for a long build prefer a single `gh run view <databaseId>` check, tell the user the run URL (`gh run view <databaseId> --web --json url`), and let them follow it themselves rather than holding the session open.

On failure, pull the failing job's log before reporting:

```bash
gh run view <databaseId> --log-failed
```

## Jobs, so you can say what failed

`version` (short SHA) → `build` (generates the changelog section for `NEXT-<sha>`, builds and pushes `ghcr.io/bosancz/interni-sekce:next`) → `deploy` → `tag` (moves the `NEXT` tag). The NEXT changelog section lives only inside the image — nothing is committed to `master`, unlike the PROD release.

## Out of scope

This releases to NEXT only. A production release is `release-prod.yml`, which takes a `semver` bump input and pushes a changelog commit to `master` — do not dispatch it from here; point the user at it instead.
