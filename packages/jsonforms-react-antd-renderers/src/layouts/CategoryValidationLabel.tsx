import { Category } from '@jsonforms/core';
import React from 'react';
import { CategoryHeader } from './CategoryHeader';

export interface CategoryValidationLabelProps {
  category: Category;
  label: string;
  path: string;
  config?: Record<string, unknown>;
}

/**
 * Kept as the published name for a category's label with its error marker.
 *
 * The header now carries the data-presence indicator as well, so the two
 * container markers behave the same on a category as they do on a Group; see
 * {@link CategoryHeader}, which is where the behaviour lives.
 */
export const CategoryValidationLabel = (
  props: CategoryValidationLabelProps
) => <CategoryHeader {...props} />;
