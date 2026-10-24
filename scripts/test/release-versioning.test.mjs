import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = fileURLToPath(new URL('../../', import.meta.url));
const cli = path.join(root, 'node_modules/.bin/changeset');

test('versioning keeps pre-1.0 workspace peer updates below 1.0 and updates exact peer ranges', () => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'renderer-release-policy-'));
  const write = (file, content) => {
    const target = path.join(cwd, file);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(
      target,
      typeof content === 'string' ? content : JSON.stringify(content),
    );
  };
  try {
    write('package.json', { name: 'release-fixture', private: true });
    write('pnpm-workspace.yaml', "packages:\n  - 'packages/*'\n");
    write('.changeset/config.json', {
      changelog: false,
      commit: false,
      fixed: [],
      linked: [],
      access: 'public',
      baseBranch: 'master',
      updateInternalDependencies: 'patch',
      ignore: [],
      format: false,
    });
    write('packages/core/package.json', {
      name: '@fixture/core',
      version: '0.0.1',
    });
    write('packages/renderer/package.json', {
      name: '@fixture/renderer',
      version: '0.0.1',
      peerDependencies: { '@fixture/core': 'workspace:*' },
    });
    write(
      '.changeset/feature.md',
      '---\n"@fixture/core": minor\n"@fixture/renderer": minor\n---\n\nInitial API.\n',
    );
    execFileSync(cli, ['version'], { cwd, stdio: 'pipe' });
    const core = JSON.parse(
      readFileSync(path.join(cwd, 'packages/core/package.json')),
    );
    const renderer = JSON.parse(
      readFileSync(path.join(cwd, 'packages/renderer/package.json')),
    );
    assert.equal(core.version, '0.1.0');
    assert.equal(renderer.version, '0.1.0');
    assert.equal(renderer.peerDependencies['@fixture/core'], 'workspace:*');
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
