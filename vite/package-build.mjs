import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Shared package boundaries for the workspace's library builds. */
export const packageBuild = (
  metaUrl,
  { excludeIds = [], extraExternalPrefixes = [] } = {},
) => {
  const packageJson = JSON.parse(
    readFileSync(new URL('./package.json', metaUrl), 'utf8'),
  );
  const packageDir = dirname(fileURLToPath(metaUrl));
  const externalPackages = [
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.peerDependencies ?? {}),
  ];
  const isExternal = (id) =>
    !excludeIds.includes(id) &&
    (extraExternalPrefixes.some((prefix) => id.startsWith(prefix)) ||
      externalPackages.some(
        (name) => id === name || id.startsWith(`${name}/`),
      ));

  return { packageDir, isExternal };
};
