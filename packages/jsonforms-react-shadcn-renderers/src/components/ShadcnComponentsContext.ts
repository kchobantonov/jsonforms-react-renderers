import React from 'react';
import type { ShadcnComponentSet } from './types';

export const ShadcnComponentsContext = React.createContext<
  ShadcnComponentSet | undefined
>(undefined);
