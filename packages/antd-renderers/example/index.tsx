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
import {
  ConfigProvider,
  InputProps,
  Divider,
  Select,
  Form,
  ThemeConfig,
  Radio,
  theme as antTheme,
  Card,
  Space,
} from 'antd';
import { renderExample } from '../../examples-react/src/index';
import { antdRenderers, antdCells } from '../src';
import { extendedRenderers } from '../../extended-renderers/src/index';

const AntdWrapper = ({ children }: React.PropsWithChildren<unknown>) => {
  const [mode, setMode] = React.useState<'dark' | 'light'>('light');

  const [variant, setVariant] =
    React.useState<InputProps['variant']>('outlined');

  const handleVariantChange = (value: 'outlined' | 'borderless' | 'filled') => {
    setVariant(value);
  };

  const theme = React.useMemo<ThemeConfig>(() => {
    return {
      algorithm:
        mode === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
      components: {
        Input: {},
        Select: {},
      },
    };
  }, [mode]);

  const label = 'Input variant';

  const layout = {
    labelCol: { span: 24 }, // Setting label column to take full width
    wrapperCol: { span: 24 }, // Setting wrapper column to take full width
  };

  return (
    <ConfigProvider theme={theme}>
      <Card style={{ width: '100%' }}>
        <Form {...layout} variant={variant}>
          <Space>
            <Form.Item label={label}>
              <Select
                style={{ width: 200 }}
                value={variant}
                onChange={handleVariantChange}
              >
                <Select.Option value='outlined'>Outlined</Select.Option>
                <Select.Option value='borderless'>Borderless</Select.Option>
                <Select.Option value='filled'>Filled</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label={'Mode'}>
              <Radio.Group
                onChange={(e) => {
                  setMode(e.target.value);
                }}
                value={mode}
              >
                <Radio.Button value='dark'>Dark</Radio.Button>
                <Radio.Button value='light'>Light</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Space>
          <Divider />
          {children}
        </Form>
      </Card>
    </ConfigProvider>
  );
};

renderExample(antdRenderers.concat(extendedRenderers), antdCells, AntdWrapper);
