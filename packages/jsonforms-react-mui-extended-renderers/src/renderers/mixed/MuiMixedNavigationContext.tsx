import React from 'react';

export interface MuiMixedNavigationContextValue {
  rootPath: string;
  selectPath: (path: string) => void;
}

export const MuiMixedNavigationContext = React.createContext<
  MuiMixedNavigationContextValue | undefined
>(undefined);
