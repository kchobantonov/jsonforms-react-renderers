import React from 'react';
import { ShadcnComponentsContext } from './ShadcnComponentsContext';
import type { ShadcnComponentSet } from './types';

export const ShadcnComponentsProvider = ({
  children,
  components,
}: React.PropsWithChildren<{ components: ShadcnComponentSet }>) => (
  <ShadcnComponentsContext.Provider value={components}>
    {children}
  </ShadcnComponentsContext.Provider>
);
