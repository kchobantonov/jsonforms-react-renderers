# Changesets

This repository uses the same Changesets release process as jsonforms-svelte.

1. Run `pnpm changeset` and select the public packages and version bump.
2. Commit the generated Markdown file and merge it into `master`.
3. GitHub Actions opens or updates the `task: release` pull request.
4. Merge that PR to publish the versioned packages to npm and create GitHub
   Releases and tags.

Demos and demo-common are private and excluded. Public packages have independent
versions. Internal workspace dependencies, including peers, follow the release
plan. Do not use Lerna or manually created GitHub releases to publish.

## Version policy

Public package versions are independent of JSON Forms. Keep unpublished packages
on the existing `0.0.1` baseline and let Changesets calculate release versions;
do not manually synchronize them with upstream versions or each other. Move to
`1.0.0` deliberately when the public API is ready for a compatibility commitment.
Check npm versions and dist-tags before changing an already published baseline.

Use Changesets 3 or newer: peer dependency updates no longer automatically force
major releases. The initial pending release plan targets `0.1.0` for all eight
public packages. Future releases remain independent; add explicit changesets for
breaking changes rather than relying on automatic peer bumps.

Declare JSON Forms compatibility through peer dependencies. While targeting an
upstream alpha, use the exact tested version (currently `3.9.0-alpha.1`). Private
demo applications and demo-common use `0.0.0`, remain `private: true`, and are
excluded from releases.

## Rehearse a release

```sh
pnpm test:release
pnpm release:pack /tmp/jsonforms-react-release-packs
```

This builds libraries, packs each public package, applies pending Changesets
versions to temporary manifests, rejects unresolved local dependency references,
and runs publint on the package contents. It writes validated tarballs and an
`overrides.json` map for isolated consumer testing. It does not publish or change
versions in your checkout. With no pending changesets it validates current
versions, as it does on a release PR.

Use `pnpm changeset:version` only when intentionally applying the release plan
locally; normally the release workflow does that in its PR.

Run `pnpm exec playwright install chromium` once, then `pnpm test:packed` (or pass
an artifact directory) to install the tarballs into a temporary consuming app,
build it with Vite, and test all four Web Components in Chromium. The checks
cover rendering, data edits, change events, and readonly state. CI runs these
checks after validating the tarballs. The fixture installs npm dependencies and
uses no workspace package links.
