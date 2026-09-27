import { createRoot } from 'react-dom/client';
import React from 'react';
import App, { DemoShell, DemoUi, ProviderSettingsProps } from './App';
import { DemoSettingsStorage } from './demoPreferences';
import { RankedTester } from '@jsonforms/core';
import examples from './examples';

export * from './App';
export * from './DemoSplitter';
export * from './editorModels';
export * from './demoPreferences';

export const renderExample = (
  renderers: { tester: RankedTester; renderer: any }[],
  cells: { tester: RankedTester; cell: any }[],
  Wrapper?: React.JSXElementConstructor<any>,
  options: {
    brand?: string;
    rendererName?: string;
    logoSrc?: string;
    webComponentTag?: string;
    Shell?: DemoShell;
    Ui?: DemoUi;
    ProviderSettings?: React.ComponentType<ProviderSettingsProps>;
    initialProviderSettings?: Record<string, any>;
    initialLayout?: 'default' | 'demo-and-data';
    settingsStorage?: DemoSettingsStorage | null;
    settingsStorageKey?: string;
  } = {}
) => {
  const root = createRoot(document.getElementById('root') as HTMLElement);
  root.render(
    <App
      brand={options.brand ?? 'JSON Forms'}
      rendererName={options.rendererName ?? 'React'}
      logoSrc={options.logoSrc}
      examples={examples}
      renderers={renderers}
      cells={cells}
      Wrapper={Wrapper}
      Shell={options.Shell}
      Ui={options.Ui}
      webComponentTag={options.webComponentTag}
      ProviderSettings={options.ProviderSettings}
      initialProviderSettings={options.initialProviderSettings}
      initialLayout={options.initialLayout}
      settingsStorage={options.settingsStorage}
      settingsStorageKey={options.settingsStorageKey}
    />
  );
};
