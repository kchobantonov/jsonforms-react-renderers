import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  assertPublishableManifest,
  releaseManifest,
} from '../release-manifest.mjs';

for (const field of [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
]) {
  for (const [range, expected] of [
    ['*', '0.2.0'],
    ['^', '^0.2.0'],
    ['~', '~0.2.0'],
  ]) {
    test(`rehearses ${field} workspace:${range} at the pending version`, () => {
      const original = {
        name: 'renderer',
        version: '0.0.1',
        [field]: { common: `workspace:${range}`, react: '^18.0.0' },
      };
      const packed = {
        ...original,
        [field]: { common: '0.0.1', react: '^18.0.0' },
      };
      const before = JSON.stringify([original, packed]);
      const result = releaseManifest(
        original,
        packed,
        new Map([
          ['renderer', '0.1.0'],
          ['common', '0.2.0'],
        ])
      );
      assert.equal(result.version, '0.1.0');
      assert.equal(result[field].common, expected);
      assert.equal(result[field].react, '^18.0.0');
      assert.equal(JSON.stringify([original, packed]), before);
    });
  }
  for (const protocol of ['workspace', 'catalog', 'file', 'link']) {
    test(`rejects unresolved ${protocol}: in ${field}`, () => {
      assert.throws(
        () =>
          assertPublishableManifest({
            name: 'renderer',
            [field]: { common: `${protocol}:*` },
          }),
        /unresolved local dependency/
      );
    });
  }
}
test('retains current versions when changesets were already consumed', () => {
  const original = {
    name: 'renderer',
    version: '0.1.0',
    dependencies: { common: 'workspace:*' },
  };
  const packed = { ...original, dependencies: { common: '0.2.0' } };
  assert.deepEqual(releaseManifest(original, packed, new Map()), packed);
});
test('rejects private packages', () =>
  assert.throws(
    () => assertPublishableManifest({ name: 'demo', private: true }),
    /private package/
  ));
test('fails clearly for unsupported workspace aliases', () =>
  assert.throws(
    () =>
      releaseManifest(
        {
          name: 'renderer',
          version: '1.0.0',
          dependencies: { common: 'workspace:another@*' },
        },
        {},
        new Map([['common', '2.0.0']])
      ),
    /unsupported workspace range/
  ));
