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
import { renderExample } from '../../examples-react/src/index';
import { primereactRenderers, primereactCells } from '../src';
import { extendedRenderers } from '../../extended-renderers/src/index';
import { APIOptions, PrimeReactProvider } from 'primereact/api';
import { Dropdown } from 'primereact/dropdown';

import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primereact/resources/themes/lara-dark-indigo/theme.css';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primeflex/primeflex.css';

const PrimeReactWrapper = ({ children }: React.PropsWithChildren<unknown>) => {
  //const [mode, setMode] = React.useState<'dark' | 'light'>('light');

  const [value, setValue] = React.useState<Partial<APIOptions>>({
    inputStyle: 'outlined',
  });

  const handleVariantChange = (variant: 'outlined' | 'filled') => {
    setValue({ ...value, inputStyle: variant });
  };

  // const theme = React.useMemo<ThemeConfig>(() => {
  //   return {
  //     algorithm:
  //       mode === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
  //     components: {
  //       Input: {},
  //       Select: {},
  //     },
  //   };
  // }, [mode]);

  return (
    <PrimeReactProvider value={value}>
      <Dropdown
        style={{ width: 200 }}
        value={value.inputStyle}
        onChange={(event) => handleVariantChange(event.value)}
        checkmark={true}
        options={[
          { value: 'outlined', label: 'Outlined' },
          { value: 'filled', label: 'Filled' },
        ]}
      ></Dropdown>
      {children}
    </PrimeReactProvider>
  );

  // return (
  //   <ConfigProvider theme={theme}>
  //     <Card style={{ width: '100%' }}>
  //       <Form {...layout} variant={variant}>
  //         <Space>
  //           <Form.Item label={label}>
  //             <Select
  //               style={{ width: 200 }}
  //               value={variant}
  //               onChange={handleVariantChange}
  //             >
  //               <Select.Option value='outlined'>Outlined</Select.Option>
  //               <Select.Option value='borderless'>Borderless</Select.Option>
  //               <Select.Option value='filled'>Filled</Select.Option>
  //             </Select>
  //           </Form.Item>
  //           <Form.Item label={'Mode'}>
  //             <Radio.Group
  //               onChange={(e) => {
  //                 setMode(e.target.value);
  //               }}
  //               value={mode}
  //             >
  //               <Radio.Button value='dark'>Dark</Radio.Button>
  //               <Radio.Button value='light'>Light</Radio.Button>
  //             </Radio.Group>
  //           </Form.Item>
  //         </Space>
  //         <Divider />
  //         {children}
  //       </Form>
  //     </Card>
  //   </ConfigProvider>
  // );
};

renderExample(
  primereactRenderers.concat(extendedRenderers),
  primereactCells,
  PrimeReactWrapper
);
