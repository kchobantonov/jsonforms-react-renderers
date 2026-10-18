# Vite+ preparation

- [x] Retire the MUI extended renderers, Web Component and demo, including workspace dependencies, navigation, release scripts and pending release entries. Ant Design, PrimeReact and shadcn remain supported.
- [x] Upgrade Vite to 7.3.7, Vitest and V8 coverage to 4.1.12, and the React plugin to 5.2.0. Require Node 22.12+ within Node 22.
- [x] Preserve library ESM/CommonJS output names, declarations, externals and existing browser targets. Verify all three development demos and packed Web Components in Chromium.
- [ ] Adopt Vite+ after recording a benchmark baseline for cold builds, unchanged builds, one-renderer edits and focused tests.
- [ ] Configure and verify task caching, including invalidation when the linked specification or shared packages change.
- [ ] Evaluate formatter/linter migration separately; retain existing checks until their replacements preserve coverage.

The migration requires explicit Node types and ES2022 libraries in test configs;
these do not change production compilation targets. Console spies in URL-policy
tests are restored between cases to preserve test isolation with Vitest 4.

Two existing mixed private/public changesets are split into separate files,
preserving their version entries and descriptions so release planning succeeds.

References: [Vite+ migration](https://viteplus.dev/guide/migrate),
[Vite 7 migration](https://v7.vite.dev/guide/migration),
[Vitest migration](https://vitest.dev/guide/migration/).

## Verification

All 3,115 Vitest tests pass across 371 files in the retained packages. All 43
release-tooling tests pass. Workspace builds, declaration checks, release tarball
validation, three packed Web Component browser checks, and three development
demo browser checks pass. The shared package also passes with V8 coverage enabled.
Frozen-lockfile installation succeeds.

Lint reports no errors and 88 existing warnings. Formatting passes for every
changed file; the full repository check still reports 24 unchanged changeset and
documentation files. Existing jsdom CSS parsing and deliberate error-boundary
test diagnostics remain visible in test output.
