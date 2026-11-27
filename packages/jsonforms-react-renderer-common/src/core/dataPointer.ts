export const dataPathToPointer = (path: string) =>
  path
    ? '/' +
      path
        .split('.')
        .map((part) => part.replace(/~/g, '~0').replace(/\//g, '~1'))
        .join('/')
    : '';
