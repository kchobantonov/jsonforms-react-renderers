import { useMemo } from 'react';
import {
  deriveLabelForUISchemaElement,
  type Category,
  type Translator,
} from '@jsonforms/core';
export const useCategoryLabels = (categories: Category[], t: Translator) =>
  useMemo(
    () =>
      categories.map((category) => deriveLabelForUISchemaElement(category, t)),
    [categories, t],
  );
// Compatibility export; implementation is shared by all renderer families.
export {
  categoryKey,
  useCategorySelection,
} from '@chobantonov/jsonforms-react-renderer-common/layout/categoryState';
