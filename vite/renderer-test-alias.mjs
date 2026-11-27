import { fileURLToPath } from 'node:url';

export function rendererTestAlias(name) {
  return {
    find: '@chobantonov/' + name,
    replacement: fileURLToPath(
      new URL('../packages/' + name + '/src', import.meta.url),
    ),
  };
}
