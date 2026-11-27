# Development checks

The workspace uses Vite+ for builds, tests, linting and formatting. Use the
Node and pnpm versions in the root `package.json` and `.node-version`.

| Command                        | Purpose                                                 |
| ------------------------------ | ------------------------------------------------------- |
| `vp install --frozen-lockfile` | Install the pinned workspace.                           |
| `pnpm run lint`                | Lint packages, apps and scripts with Oxlint.            |
| `pnpm run check-format`        | Check repository formatting with Oxfmt.                 |
| `pnpm run format`              | Apply formatting.                                       |
| `pnpm run check`               | Run the combined Vite+ check.                           |
| `pnpm run test`                | Run workspace test projects.                            |
| `pnpm run build`               | Build packages and demos.                               |
| `pnpm run build:libs`          | Build public libraries and Web Components.              |
| `pnpm run test:release`        | Check release configuration and version planning.       |
| `pnpm run test:packed`         | Test packed Web Components in Chromium.                 |
| `pnpm run fallow`              | Show full code health findings in the terminal.         |
| `pnpm exec fallow dead-code`   | Inspect unused files, exports, types, and dependencies. |
| `pnpm exec fallow dupes`       | Inspect duplicate code groups.                          |
| `pnpm run fallow:report`       | Write a full JSON report to `.fallow/report.json`.      |
| `pnpm run fallow:audit`        | Check findings introduced since the Git base.           |

To run one file, pass its repository-relative path from the workspace root.
For example, this runs the Ant Design editor theme hook tests:

```sh
pnpm exec vp test run packages/jsonforms-react-antd-extended-renderers/test/hooks/editorTheme.test.tsx
```

To typecheck a package’s tests independently, run
`pnpm exec tsc --noEmit -p packages/<package>/test/tsconfig.json`.

Build scripts generate declarations for public packages. Generated
builds, dependencies, coverage, and synchronized shadcn UI copies are excluded
from formatting and lint. Run `pnpm run shadcn:check` for the copied components.
See [the release guide](../.changeset/README.md) for package rehearsal.

Fallow uses the project-local version in the lockfile. Its config excludes only
the copied UI trees in the shadcn demo and web component and the pinned
snapshot under `scripts/shadcn-upstream/`. Other packages’ `components/ui`
folders are analyzed. Workspace-specific dependency exceptions cover the two
demo builds consumed by the examples app and dependencies used by the copied
shadcn components. See the [Fallow configuration](../.fallowrc.json). For a local change,
run `pnpm run fallow:audit --base origin/master` to get the same changed-code
gate used on pull requests. The CI audit writes a summary to the GitHub Actions
job and fails on introduced error-severity findings. The full JSON report is a
local, ignored artifact; generate it with `pnpm run fallow:report` when you want
to inspect or share the complete inventory. The full terminal command can exit
nonzero on existing findings.
