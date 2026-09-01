/*
  The MIT License

  Copyright (c) 2017-2019 EclipseSource Munich
  https://github.com/eclipsesource/jsonforms

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
*/
import { createRoot } from 'react-dom/client';
import React from 'react';
import App, { DemoShell, DemoUi, ProviderSettingsProps } from './App';
import { RankedTester } from '@jsonforms/core';
import examples from './examples';

export * from './App';
export * from './DemoSplitter';
export * from './editorModels';

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
    />
  );
};
