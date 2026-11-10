import type { UISchemaElement } from '@jsonforms/core';
import type { DynamicUiResult } from './dynamicUi';

// These are occurrence-specific presentation views, not new authored schemas.
// Dispatch must preserve a parent's filtering and must not apply the overlay twice.
const authors = new WeakMap<UISchemaElement, UISchemaElement>();
export const dynamicTreeAuthor = (element: UISchemaElement) =>
  authors.get(element) ?? element;
const presentations = new WeakMap<UISchemaElement, DynamicUiResult>();
export const dynamicPresentation = (element: UISchemaElement) =>
  presentations.get(element);

/** Keep parent transformations when handing a projected element to dispatch. */
export function retainDynamicPresentation<T extends UISchemaElement>(
  source: UISchemaElement,
  transformed: T,
): T {
  const resolution = presentations.get(source);
  if (resolution) {
    presentations.set(transformed, { ...resolution, element: transformed });
    authors.set(transformed, dynamicTreeAuthor(source));
  }
  return transformed;
}

const dynamicBranches = new WeakMap<UISchemaElement, boolean>();
export const hasDynamicTree = (
  element: UISchemaElement,
  active?: Set<UISchemaElement>,
  depth = 0,
): boolean => {
  if (
    !element ||
    typeof element !== 'object' ||
    active?.has(element) ||
    depth > 100
  )
    return false;
  const cached = dynamicBranches.get(element);
  if (cached !== undefined) return cached;
  active ??= new Set<UISchemaElement>();
  active.add(element);
  const children = (
    element as UISchemaElement & { elements?: UISchemaElement[] }
  ).elements;
  const found =
    Object.prototype.hasOwnProperty.call(element, '$dynamic') ||
    (Array.isArray(children) &&
      children.some((child) => hasDynamicTree(child, active, depth + 1)));
  active.delete(element);
  dynamicBranches.set(element, found);
  return found;
};

/** Resolve structural children in one dispatch context. Never enter options.detail:
 * its context belongs to the object/array renderer that instantiates it. */
export function createDynamicTreeResolver() {
  const copies = new WeakMap<
    UISchemaElement,
    { children: UISchemaElement[]; result: UISchemaElement }
  >();
  return (
    element: UISchemaElement,
    resolve: (element: UISchemaElement) => DynamicUiResult,
  ): UISchemaElement => {
    if (!dynamicPresentation(element) && !hasDynamicTree(element))
      return element;
    const active = new Set<UISchemaElement>();
    const visit = (
      authored: UISchemaElement,
      depth: number,
    ): UISchemaElement => {
      if (
        !authored ||
        typeof authored !== 'object' ||
        active.has(authored) ||
        depth > 100
      )
        return authored;
      if (!dynamicPresentation(authored) && !hasDynamicTree(authored))
        return authored;
      active.add(authored);
      const resolution = dynamicPresentation(authored) ?? resolve(authored);
      let effective = resolution.element;
      const children = (
        effective as UISchemaElement & { elements?: UISchemaElement[] }
      ).elements;
      if (Array.isArray(children)) {
        const next = children.map((child) => visit(child, depth + 1));
        if (next.some((child, index) => child !== children[index])) {
          const previous = copies.get(effective);
          if (
            previous &&
            previous.children.length === next.length &&
            next.every((child, index) => child === previous.children[index])
          )
            effective = previous.result;
          else {
            const result = { ...effective, elements: next };
            copies.set(effective, { children: next, result });
            effective = result;
          }
        }
      }
      active.delete(authored);
      if (effective !== authored) {
        presentations.set(effective, { ...resolution, element: effective });
        authors.set(effective, dynamicTreeAuthor(authored));
      }
      return effective;
    };
    return visit(element, 0);
  };
}

/** A bounded, pure memo for the structural child list. */
export function createDynamicChildrenMemo() {
  let previous: UISchemaElement[] = [];
  return (next: UISchemaElement[]) => {
    if (
      next.length === previous.length &&
      next.every((item, index) => item === previous[index])
    )
      return previous;
    previous = next;
    return next;
  };
}
