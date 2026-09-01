import React from 'react';

export interface AntdMixedNavigation {
  selectPath: (path: string) => void;
}

export const AntdMixedNavigationContext =
  React.createContext<AntdMixedNavigation | null>(null);
