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

import React from 'react';
import { PrimeReactProvider } from 'primereact/api';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Menu } from 'primereact/menu';
import { Sidebar } from 'primereact/sidebar';
import { renderExample } from '@chobantonov/jsonforms-react-demo-common';
import {
  DemoShellProps,
  DemoWrapperProps,
} from '@chobantonov/jsonforms-react-demo-common';
import { primereactExtendedRenderers } from '@chobantonov/jsonforms-react-primereact-extended-renderers';
import {
  JSON_FORMS_PRIMEREACT_TAG,
  registerJsonFormsPrimeReact,
} from '@chobantonov/jsonforms-react-primereact-webcomponent';
import {
  primereactCells,
  primereactRenderers,
} from '@chobantonov/jsonforms-react-primereact-renderers';
import { primereactDemoUi } from './DemoUi';

import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import 'primereact/resources/primereact.min.css';

const PrimeReactDemoShell = ({
  brand,
  rendererName,
  dark,
  rtl,
  formOnly,
  sidebarOpen,
  settingsOpen,
  useWebComponent,
  webComponentAvailable,
  search,
  examples,
  currentExampleName,
  settings,
  onHome,
  onSelectExample,
  onSearch,
  onToggleSidebar,
  onToggleFormOnly,
  onToggleWebComponent,
  onOpenSettings,
  onCloseSettings,
  children,
}: DemoShellProps) => (
  <PrimeReactProvider value={{ inputStyle: 'outlined' }}>
    <div
      className={dark ? 'app-shell app-dark' : 'app-shell'}
      dir={rtl ? 'rtl' : 'ltr'}
    >
      <header className='renderer-demo-header'>
        <Button
          text
          icon='pi pi-bars'
          aria-label='Toggle navigation'
          onClick={onToggleSidebar}
        />
        <Button text className='renderer-demo-brand' onClick={onHome}>
          <span className='brand-mark'>{brand[0]}</span>
          <span>
            <strong>JSON Forms</strong>
            <small>React · {rendererName}</small>
          </span>
        </Button>
        <div className='renderer-demo-actions'>
          <Button
            outlined={!formOnly}
            icon='pi pi-window-maximize'
            label={formOnly ? 'Full App' : 'Form Only'}
            onClick={onToggleFormOnly}
          />
          {webComponentAvailable && (
            <Button
              outlined={!useWebComponent}
              icon='pi pi-box'
              label='Web Component'
              onClick={onToggleWebComponent}
            />
          )}
          <Button
            outlined
            icon='pi pi-cog'
            label='Settings'
            onClick={onOpenSettings}
          />
        </div>
      </header>

      {!formOnly && sidebarOpen && (
        <aside className='renderer-demo-sidebar'>
          <span className='p-input-icon-left' style={{ width: '100%' }}>
            <i className='pi pi-search' />
            <InputText
              value={search}
              placeholder='Search examples'
              onChange={(event) => onSearch(event.target.value)}
              style={{ width: '100%' }}
            />
          </span>
          <Menu
            model={examples.map(({ name, label }) => ({
              label,
              icon:
                name === currentExampleName
                  ? 'pi pi-circle-fill'
                  : 'pi pi-circle',
              command: () => onSelectExample(name),
            }))}
            style={{ width: '100%', marginTop: '0.75rem', border: 0 }}
          />
        </aside>
      )}

      <main
        className={`renderer-demo-main${
          !sidebarOpen || formOnly ? ' no-sidebar' : ''
        }`}
      >
        {children}
      </main>

      <Sidebar
        visible={settingsOpen}
        position={rtl ? 'left' : 'right'}
        header='Settings'
        onHide={onCloseSettings}
        style={{ width: 'min(30rem, 94vw)' }}
      >
        {settings}
      </Sidebar>
    </div>
  </PrimeReactProvider>
);

const PrimeReactWrapper = ({ children }: DemoWrapperProps) => (
  <PrimeReactProvider value={{ inputStyle: 'outlined' }}>
    <Card>{children}</Card>
  </PrimeReactProvider>
);

registerJsonFormsPrimeReact();

renderExample(
  primereactRenderers.concat(primereactExtendedRenderers),
  primereactCells,
  PrimeReactWrapper,
  {
    brand: 'PrimeReact',
    rendererName: 'PrimeReact',
    webComponentTag: JSON_FORMS_PRIMEREACT_TAG,
    Shell: PrimeReactDemoShell,
    Ui: primereactDemoUi,
  }
);
