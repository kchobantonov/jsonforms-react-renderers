# Development checks

The workspace uses Vite+ for builds, tests, linting and formatting. Use the
Node and pnpm versions in the root `package.json` and `.node-version`.

| Command                        | Purpose                                                    |
| ------------------------------ | ---------------------------------------------------------- |
| `vp install --frozen-lockfile` | Install the pinned workspace.                              |
| `pnpm run lint`                | Lint packages, apps and scripts with Oxlint.               |
| `pnpm run check-format`        | Check repository formatting with Oxfmt.                    |
| `pnpm run format`              | Apply formatting.                                          |
| `pnpm run check`               | Run the combined Vite+ check.                              |
| `pnpm run test-cov`            | Run all eight public package test suites with V8 coverage. |
| `pnpm run merge-report`        | Merge package LCOV reports into `coverage/lcov.info`.      |
| `pnpm run test`                | Run workspace test projects.                               |
| `pnpm run build`               | Build packages and demos.                                  |
| `pnpm run build:libs`          | Build public libraries and Web Components.                 |
| `pnpm run test:release`        | Check release configuration and version planning.          |
| `pnpm run test:packed`         | Test packed Web Components in Chromium.                    |
| `pnpm run fallow`              | Show full code health findings in the terminal.            |
| `pnpm exec fallow dead-code`   | Inspect unused files, exports, types, and dependencies.    |
| `pnpm exec fallow dupes`       | Inspect duplicate code groups.                             |
| `pnpm run fallow:report`       | Write a full JSON report to `.fallow/report.json`.         |
| `pnpm run fallow:audit`        | Check findings introduced since the Git base.              |

To run one file, pass its repository-relative path from the workspace root.
For example, this runs the Ant Design editor theme hook tests:

```sh
pnpm exec vp test run packages/jsonforms-react-antd-extended-renderers/test/hooks/editorTheme.test.tsx
```

Coverage reports are written to each package's `coverage/` folder. Open
`packages/<package>/coverage/index.html` for the HTML report, or use
`packages/<package>/coverage/lcov.info` with coverage services. Run
`pnpm run merge-report` after coverage completes to combine the LCOV reports.

To collect coverage for one package, use
`pnpm --filter @chobantonov/jsonforms-react-renderer-common run test-cov`.
All source TypeScript and TSX files are included, including files without tests.
The shadcn web component's copied `src/components/ui/` files are excluded.
Coverage includes the eight public packages.
Vite+ is installed once at the workspace root so package runners and
`vite-plus/test` imports share the same Vitest runtime.

CI runs these coverage suites on pushes and pull requests targeting `master`,
then merges their LCOV reports and uploads `coverage/lcov.info` to
[Coveralls](https://coveralls.io/github/kchobantonov/jsonforms-react-renderers?branch=master).
The README badge displays coverage for `master`; the Coveralls report provides
file-level coverage and comparisons between builds. This is aggregate coverage
for the public packages, not the renderer-common package's individual percentage.
The private demo support tests also run in CI, separately from public-package coverage.

The upload uses the automatically supplied `GITHUB_TOKEN`; no manually created
repository secret is required. The first successful upload creates the Coveralls
repository entry. Sign in to Coveralls with GitHub to manage its settings and PR
notifications. Coverage reports are also available as the `coverage-reports`
artifact on the GitHub Actions run for 14 days. The badge needs a successful
coverage upload from `master` before it can show that branch's percentage.

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
