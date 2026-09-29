import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { releaseManifest } from './release-manifest.mjs';

// Like jsonforms-svelte: build first, then rehearse pending versions in temporary
// copies. No version changes, Git writes, npm publishing, or lifecycle scripts.
const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.resolve(
  process.argv[2] ?? path.join(tmpdir(), 'jsonforms-react-release-packs')
);
const staging = mkdtempSync(path.join(tmpdir(), 'jsonforms-react-release-'));
const run = (command, args, cwd = root) =>
  execFileSync(command, args, { cwd, stdio: 'inherit' });
mkdirSync(output, { recursive: true });
try {
  const planPath = path.join(staging, 'plan.json');
  const hasPendingChangesets = readdirSync(path.join(root, '.changeset')).some(
    (file) => file.endsWith('.md') && file !== 'README.md'
  );
  // Release PRs have already consumed their changesets. Comparing to HEAD
  // avoids demanding another changeset for the version/changelog commit.
  run('pnpm', [
    'exec',
    'changeset',
    'status',
    ...(hasPendingChangesets ? [] : ['--since=HEAD']),
    '--output',
    planPath,
  ]);
  const plan = JSON.parse(readFileSync(planPath, 'utf8'));
  const versions = new Map(
    plan.releases.map((release) => [release.name, release.newVersion])
  );
  const overrides = {};
  for (const directory of readdirSync(path.join(root, 'packages')).sort()) {
    const packageRoot = path.join(root, 'packages', directory);
    const original = JSON.parse(
      readFileSync(path.join(packageRoot, 'package.json'), 'utf8')
    );
    if (original.private) continue;
    const unpack = path.join(staging, directory);
    mkdirSync(unpack);
    const raw = path.join(unpack, 'original.tgz');
    run(
      'pnpm',
      ['--config.ignore-scripts=true', 'pack', '--out', raw],
      packageRoot
    );
    run('tar', ['-xzf', raw, '-C', unpack]);
    const packedRoot = path.join(unpack, 'package');
    const manifestPath = path.join(packedRoot, 'package.json');
    const manifest = releaseManifest(
      original,
      JSON.parse(readFileSync(manifestPath, 'utf8')),
      versions
    );
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    run('pnpm', ['exec', 'publint', packedRoot, '--pack', 'false']);
    const tarball = path.join(output, `${directory}-${manifest.version}.tgz`);
    run(
      'pnpm',
      ['--config.ignore-scripts=true', 'pack', '--out', tarball],
      packedRoot
    );
    overrides[manifest.name] = `file:${tarball}`;
  }
  writeFileSync(
    path.join(output, 'overrides.json'),
    JSON.stringify(overrides, null, 2) + '\n'
  );
  console.log(`Validated release tarballs and overrides: ${output}`);
} finally {
  rmSync(staging, { recursive: true, force: true });
}
