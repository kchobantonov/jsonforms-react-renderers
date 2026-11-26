# Development checks

The workspace uses Vite+ for builds, tests, linting and formatting. Use the
Node and pnpm versions in the root `package.json` and `.node-version`.

| Command                        | Purpose                                           |
| ------------------------------ | ------------------------------------------------- |
| `vp install --frozen-lockfile` | Install the pinned workspace.                     |
| `pnpm run lint`                | Lint packages, apps and scripts with Oxlint.      |
| `pnpm run check-format`        | Check repository formatting with Oxfmt.           |
| `pnpm run format`              | Apply formatting.                                 |
| `pnpm run check`               | Run the combined Vite+ check.                     |
| `pnpm run test`                | Run workspace test projects.                      |
| `pnpm run build`               | Build packages and demos.                         |
| `pnpm run build:libs`          | Build public libraries and Web Components.        |
| `pnpm run test:release`        | Check release configuration and version planning. |
| `pnpm run test:packed`         | Test packed Web Components in Chromium.           |

Build scripts still run TypeScript declaration and test checks. Generated
builds, dependencies, coverage, and synchronized shadcn UI copies are excluded
from formatting and lint. Run `pnpm run shadcn:check` for the copied components.
See [the release guide](../.changeset/README.md) for package rehearsal.
