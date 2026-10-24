import { UISchemaElement } from '@jsonforms/core';

// Feature tests inspect all example controls at once. Remove only navigation
// wrappers, preserving the layouts, rules and options inside each category.
export const flattenExampleNavigation = (ui: any): UISchemaElement => ({
  ...ui,
  type: ['Categorization', 'Category'].includes(ui.type)
    ? 'VerticalLayout'
    : ui.type,
  ...(ui.elements
    ? { elements: ui.elements.map(flattenExampleNavigation) }
    : {}),
});
