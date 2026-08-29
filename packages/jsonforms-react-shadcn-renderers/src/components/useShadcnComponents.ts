import React from 'react';
import { ShadcnComponentsContext } from './ShadcnComponentsContext';
import type { ShadcnComponentSet } from './types';

export const useShadcnComponents = (): ShadcnComponentSet => {
  const components = React.useContext(ShadcnComponentsContext);
  if (!components) {
    throw new Error(
      'No Shadcn component set was provided. Wrap JsonForms with ShadcnComponentsProvider.'
    );
  }
  return components;
};
