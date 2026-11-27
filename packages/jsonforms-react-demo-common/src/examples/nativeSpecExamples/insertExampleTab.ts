import type { UISchemaElement } from '@jsonforms/core';

type Layout = UISchemaElement & { elements: UISchemaElement[] };

export function insertExampleTab(
  root: UISchemaElement,
  tab: UISchemaElement,
  missingCategoryMessage: string,
  before?: string,
): UISchemaElement {
  const layout = root as Layout;
  const elements = layout.elements ?? [];
  const index = elements.findIndex(
    (element) => element.type === 'Categorization',
  );
  if (index < 0) throw new Error(missingCategoryMessage);
  const categorization = elements[index] as Layout;
  const categories = categorization.elements.slice();
  const position =
    before === undefined
      ? -1
      : categories.findIndex(
          (category) => (category as { name?: string }).name === before,
        );
  categories.splice(position < 0 ? categories.length : position, 0, tab);
  return {
    ...layout,
    elements: elements.map((element, i) =>
      i === index ? { ...categorization, elements: categories } : element,
    ),
  } as Layout;
}
