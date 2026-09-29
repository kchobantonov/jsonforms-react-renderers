const dependencyFields = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];

/** Apply the Changesets plan to an already packed manifest, never the checkout. */
export const releaseManifest = (original, packed, versions) => {
  const manifest = structuredClone(packed);
  manifest.version = versions.get(original.name) ?? original.version;
  for (const field of dependencyFields) {
    for (const [name, range] of Object.entries(original[field] ?? {})) {
      if (!range.startsWith('workspace:') || !versions.has(name)) continue;
      const prefix = range.slice('workspace:'.length);
      if (!['*', '^', '~'].includes(prefix)) {
        throw new Error(
          `${original.name}: unsupported workspace range ${range}`
        );
      }
      manifest[field] ??= {};
      manifest[field][name] =
        (prefix === '*' ? '' : prefix) + versions.get(name);
    }
  }
  assertPublishableManifest(manifest);
  return manifest;
};

export const assertPublishableManifest = (manifest) => {
  if (manifest.private) throw new Error(`${manifest.name}: private package`);
  for (const field of dependencyFields) {
    for (const [name, range] of Object.entries(manifest[field] ?? {})) {
      if (/^(workspace|catalog|link|file):/.test(range)) {
        throw new Error(
          `${manifest.name}: unresolved local dependency ${field}.${name}: ${range}`
        );
      }
    }
  }
};
