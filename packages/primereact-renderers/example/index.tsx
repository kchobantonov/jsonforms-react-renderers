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

import { PrimeReactProvider } from 'primereact/api';
import { Divider } from 'primereact/divider';
import React, { useState } from 'react';
import { renderExample } from '../../examples-react/src/index';
import { extendedRenderers } from '../../extended-renderers/src/index';
import { primereactCells, primereactRenderers } from '../src';

import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import 'primereact/resources/primereact.min.css';
import { AppContentContextProvider } from './AppContentContext';
import Header from './Header';
import Config from './Config';

const PrimeReactWrapper = ({ children }: React.PropsWithChildren<unknown>) => {
  const [configActive, setConfigActive] = useState(false);

  return (
    <AppContentContextProvider>
      <PrimeReactProvider value={{ inputStyle: 'outlined' }}>
        <Config active={configActive} onHide={() => setConfigActive(false)} />
        <Header onConfigButtonClick={() => setConfigActive(true)} />
        <Divider />
        {children}
      </PrimeReactProvider>
    </AppContentContextProvider>
  );
};

renderExample(
  primereactRenderers.concat(extendedRenderers),
  primereactCells,
  PrimeReactWrapper
);
