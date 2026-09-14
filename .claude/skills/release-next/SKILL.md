---
name: release-next
description: Release the current branch to the NEXT environment by dispatching the "Release to NEXT" GitHub Actions workflow (.github/workflows/release-next.yml) against that branch. Use when the user asks to release/deploy to NEXT, ship the branch to NEXT, or says "/release-next".
allowed-tools: Bash(git rev-parse:*), Bash(date:*), mcp__github__actions_run_trigger, mcp__github__actions_get, mcp__github__actions_list
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

3. Wait for the workflow to finish: poll `mcp__github__actions_get` (`get_workflow_run`) until `status` is `completed`, then read `conclusion`.

   **Measure the waiting by the wall clock, never by how many sleeps you have issued.** In a sandbox `sleep` often returns without any real time passing, so a stack of "5 minute" waits can add up to seconds — and a run that started moments ago then looks hung. Between polls, wait with an until-loop against `date`, and compare `date -u` with the run's `run_started_at` to know how long it has really been running:

```
T=$(( $(date +%s) + 60 )); until [ "$(date +%s)" -ge "$T" ]; do sleep 5; done
```

A run takes about 4 minutes, nearly all of it in "Build and push image". **Never cancel the run and never dispatch a second one** — a slow-looking run is almost always a misread clock, and cancelling throws away a healthy build. If it is still running after 30 minutes **on the wall clock**, print the run URL, say it is still going, and stop; whether to cancel is the user's call.

4. After it finishes, print these lines:

On workflow fail:

- `Failed. `

On workflow success:

- `Released to NEXT.`
- `Expected tag: NEXT-<git sha>` (use current commit's short SHA - `git rev-parse --short=7 HEAD`)
- `Open: https://next.interni.bosan.cz`

5. Stop.
