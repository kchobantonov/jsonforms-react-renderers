/** Traverse authored layout children without assuming how feature tabs wrap them. */
export const exampleElements = (ui: any): any[] => [
  ui,
  ...(ui?.elements ?? []).flatMap(exampleElements),
];
