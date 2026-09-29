import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../../', import.meta.url);
const readJson = (file) =>
  JSON.parse(readFileSync(new URL(file, root), 'utf8'));
const config = readJson('.changeset/config.json');
const workspace = readJson('package.json');
const packages = ['apps', 'packages'].flatMap((parent) =>
  readdirSync(new URL(`${parent}/`, root)).map((name) =>
    readJson(`${parent}/${name}/package.json`)
  )
);
const names = new Set(packages.map((pkg) => pkg.name));

test('release configuration excludes every private host and includes every public package', () => {
  assert.equal(workspace.private, true);
  assert.deepEqual(
    [...config.ignore].sort(),
    packages
      .filter((pkg) => pkg.private)
      .map((pkg) => pkg.name)
      .sort()
  );
  assert.equal(config.access, 'public');
});
for (const pkg of packages.filter((pkg) => !pkg.private)) {
  test(`${pkg.name} is public and tracks workspace peers through version changes`, () => {
    assert.equal(pkg.publishConfig.access, 'public');
    for (const field of [
      'dependencies',
      'peerDependencies',
      'optionalDependencies',
    ]) {
      for (const [name, range] of Object.entries(pkg[field] ?? {})) {
        if (names.has(name)) {
          assert.ok(
            range.startsWith('workspace:'),
            `${field}.${name} must follow workspace versions`
          );
          assert.equal(
            Boolean(
              packages.find((dependency) => dependency.name === name).private
            ),
            false,
            `${pkg.name} cannot publish a dependency on a private package`
          );
        }
      }
    }
  });
}
