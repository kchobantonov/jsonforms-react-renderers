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
  AppstoreOutlined,
  FullscreenOutlined,
  MenuOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  Button,
  ConfigProvider,
  Drawer,
  Form,
  Input,
  InputProps,
  Layout,
  Menu,
  Select,
  Space,
  ThemeConfig,
  theme as antTheme,
} from 'antd';
import { renderExample } from '../../jsonforms-react-demo-common/src/index';
import {
  DemoShellProps,
  DemoWrapperProps,
  ProviderSettingsProps,
} from '../../jsonforms-react-demo-common/src/App';
import { antdRenderers, antdCells } from '../src';
import { antdExtendedRenderers } from '../../jsonforms-react-antd-extended-renderers/src/index';
import {
  JSON_FORMS_ANTD_TAG,
  registerJsonFormsAntd,
} from '../../jsonforms-react-antd-webcomponent/src/index';
import { antdDemoUi } from './DemoUi';

const ANTD_LOGO =
  'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg';

const createTheme = (dark: boolean): ThemeConfig => ({
  algorithm: dark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
});

const AntdDemoShell = ({
  rendererName,
  logoSrc,
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
  <ConfigProvider direction={rtl ? 'rtl' : 'ltr'} theme={createTheme(dark)}>
    <Layout className={dark ? 'app-shell app-dark' : 'app-shell'}>
      <Layout.Header className='renderer-demo-header'>
        <Button
          type='text'
          icon={<MenuOutlined />}
          aria-label='Toggle navigation'
          onClick={onToggleSidebar}
        />
        <Button type='text' className='renderer-demo-brand' onClick={onHome}>
          <img
            className='renderer-demo-logo'
            src={logoSrc}
            alt='Ant Design logo'
          />
          <span>
            <strong>JSON Forms</strong>
            <small>React · {rendererName}</small>
          </span>
        </Button>
        <Space className='renderer-demo-actions' wrap>
          <Button
            icon={<FullscreenOutlined />}
            type={formOnly ? 'primary' : 'default'}
            onClick={onToggleFormOnly}
          >
            {formOnly ? 'Full App' : 'Form Only'}
          </Button>
          {webComponentAvailable && (
            <Button
              icon={<AppstoreOutlined />}
              type={useWebComponent ? 'primary' : 'default'}
              onClick={onToggleWebComponent}
            >
              Web Component
            </Button>
          )}
          <Button icon={<SettingOutlined />} onClick={onOpenSettings}>
            Settings
          </Button>
        </Space>
      </Layout.Header>

      {!formOnly && sidebarOpen && (
        <Layout.Sider
          className='renderer-demo-sidebar'
          theme={dark ? 'dark' : 'light'}
          width={272}
        >
          <Input.Search
            allowClear
            placeholder='Search examples'
            value={search}
            onChange={(event) => onSearch(event.target.value)}
          />
          <Menu
            mode='inline'
            selectedKeys={currentExampleName ? [currentExampleName] : []}
            items={examples.map(({ name, label }) => ({
              key: name,
              label,
            }))}
            onClick={({ key }) => onSelectExample(key)}
            style={{ marginTop: 12, borderInlineEnd: 0 }}
          />
        </Layout.Sider>
      )}

      <Layout.Content
        className={`renderer-demo-main${
          !sidebarOpen || formOnly ? ' no-sidebar' : ''
        }`}
      >
        {children}
      </Layout.Content>

      <Drawer
        title='Settings'
        placement={rtl ? 'left' : 'right'}
        open={settingsOpen}
        onClose={onCloseSettings}
      >
        {settings}
      </Drawer>
    </Layout>
  </ConfigProvider>
);

const AntdWrapper = ({
  children,
  rendererSettings,
  dark,
  rtl,
}: DemoWrapperProps) => (
  <ConfigProvider direction={rtl ? 'rtl' : 'ltr'} theme={createTheme(dark)}>
    <Form
      layout='vertical'
      variant={
        (rendererSettings.inputVariant ?? 'outlined') as InputProps['variant']
      }
    >
      {children}
    </Form>
  </ConfigProvider>
);

const AntdSettings = ({ settings, setSettings }: ProviderSettingsProps) => (
  <>
    <h3>Ant Design</h3>
    <label>
      Input variant
      <Select
        value={settings.inputVariant ?? 'outlined'}
        options={[
          { value: 'outlined', label: 'Outlined' },
          { value: 'borderless', label: 'Borderless' },
          { value: 'filled', label: 'Filled' },
          { value: 'underlined', label: 'Underlined' },
        ]}
        onChange={(inputVariant) =>
          setSettings((current) => ({ ...current, inputVariant }))
        }
      />
    </label>
  </>
);

registerJsonFormsAntd();

renderExample(
  antdRenderers.concat(antdExtendedRenderers),
  antdCells,
  AntdWrapper,
  {
    brand: 'Ant Design',
    rendererName: 'Ant Design',
    logoSrc: ANTD_LOGO,
    webComponentTag: JSON_FORMS_ANTD_TAG,
    Shell: AntdDemoShell,
    Ui: antdDemoUi,
    ProviderSettings: AntdSettings,
    initialProviderSettings: { inputVariant: 'outlined' },
  }
);
