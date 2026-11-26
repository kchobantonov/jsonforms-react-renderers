# Development checks

The workspace uses Vite+ for builds, tests, linting and formatting. Use the
Node and pnpm versions in the root `package.json` and `.node-version`.

| Command                        | Purpose                                            |
| ------------------------------ | -------------------------------------------------- |
| `vp install --frozen-lockfile` | Install the pinned workspace.                      |
| `pnpm run lint`                | Lint packages, apps and scripts with Oxlint.       |
| `pnpm run check-format`        | Check repository formatting with Oxfmt.            |
| `pnpm run format`              | Apply formatting.                                  |
| `pnpm run check`               | Run the combined Vite+ check.                      |
| `pnpm run test`                | Run workspace test projects.                       |
| `pnpm run build`               | Build packages and demos.                          |
| `pnpm run build:libs`          | Build public libraries and Web Components.         |
| `pnpm run test:release`        | Check release configuration and version planning.  |
| `pnpm run test:packed`         | Test packed Web Components in Chromium.            |
| `pnpm run fallow`              | Show full code health findings in the terminal.    |
| `pnpm run fallow:report`       | Write a full JSON report to `.fallow/report.json`. |
| `pnpm run fallow:audit`        | Check findings introduced since the Git base.      |

Build scripts still run TypeScript declaration and test checks. Generated
builds, dependencies, coverage, and synchronized shadcn UI copies are excluded
from formatting and lint. Run `pnpm run shadcn:check` for the copied components.
See [the release guide](../.changeset/README.md) for package rehearsal.

Fallow uses the project-local version in the lockfile. Its config excludes only
the copied shadcn UI trees and pinned upstream snapshot. For a local change,
run `pnpm run fallow:audit --base origin/master` to get the same changed-code
gate used on pull requests. The CI audit writes a summary to the GitHub Actions
job and fails on introduced error-severity findings. The full JSON report is a
local, ignored artifact; generate it with `pnpm run fallow:report` when you want
to inspect or share the complete inventory. The full terminal command can exit
nonzero on existing findings.
