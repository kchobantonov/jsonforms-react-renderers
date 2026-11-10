const pointerSegments = (pointer: string): string[] => {
  const path = pointer.startsWith('#') ? pointer.slice(1) : pointer;
  if (path === '') return [];
  return (path.startsWith('/') ? path.slice(1) : path)
    .split('/')
    .map((segment) => segment.replaceAll('~1', '/').replaceAll('~0', '~'));
};

/** JSON Forms scope semantics, preserving every literal JSON Pointer member. */
export const scopeDataSegments = (scope: string): string[] => {
  const tokens = pointerSegments(scope);
  const result: string[] = [];
  for (let index = 0; index < tokens.length;) {
    const keyword = tokens[index++];
    if (keyword === 'then' || keyword === 'else') continue;
    const member = tokens[index++];
    if (keyword === 'oneOf' || keyword === 'anyOf' || keyword === 'allOf')
      continue;
    if (member !== undefined) result.push(member);
  }
  return result;
};
