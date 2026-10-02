import React from 'react';
import {
  useAntdLocale,
  antdRenderers,
  antdCells,
} from '@chobantonov/jsonforms-react-antd-renderers';
import {
  GithubOutlined,
  FullscreenOutlined,
  MenuOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  Button,
  ConfigProvider,
  Drawer,
  Empty,
  Form,
  Grid,
  Input,
  InputProps,
  Layout,
  Menu,
  Select,
  Space,
  ThemeConfig,
  Tooltip,
  theme as antTheme,
} from 'antd';
import {
  renderExample,
  DemoShellProps,
  DemoWrapperProps,
  ProviderSettingsProps,
  WebComponentIcon,
} from '@chobantonov/jsonforms-react-demo-common';
import {
  antdExtendedCells,
  antdExtendedRenderers,
} from '@chobantonov/jsonforms-react-antd-extended-renderers';
import {
  JSON_FORMS_ANTD_TAG,
  registerJsonFormsAntd,
} from '@chobantonov/jsonforms-react-antd-webcomponent';
import { antdDemoUi } from './DemoUi';

const ANTD_LOGO = new URL('./antd-logo.svg', import.meta.url).href;

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
  exampleFilter,
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
}: DemoShellProps) => {
  const screens = Grid.useBreakpoint();
  const desktop = Boolean(screens.md);
  const navigation = (
    <>
      {exampleFilter}
      <Input.Search
        allowClear
        placeholder='Search examples'
        value={search}
        onChange={(event) => onSearch(event.target.value)}
      />
      {examples.length ? (
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
      ) : (
        <Empty
          description='No examples found'
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </>
  );

  return (
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
          <Space
            className='renderer-demo-actions'
            align='center'
            styles={{ item: { display: 'flex', alignItems: 'center' } }}
          >
            <Tooltip title={formOnly ? 'Show full UI' : 'Show form only'}>
              <Button
                aria-label={formOnly ? 'Show full UI' : 'Show form only'}
                aria-pressed={formOnly}
                icon={<FullscreenOutlined />}
                type={formOnly ? 'primary' : 'text'}
                onClick={onToggleFormOnly}
              />
            </Tooltip>
            {webComponentAvailable && (
              <Tooltip
                title={
                  useWebComponent
                    ? 'Switch to React renderer'
                    : 'Switch to Web Component renderer'
                }
              >
                <Button
                  aria-label={
                    useWebComponent
                      ? 'Switch to React renderer'
                      : 'Switch to Web Component renderer'
                  }
                  aria-pressed={useWebComponent}
                  icon={
                    <WebComponentIcon active={useWebComponent} dark={dark} />
                  }
                  type={useWebComponent ? 'primary' : 'text'}
                  onClick={onToggleWebComponent}
                />
              </Tooltip>
            )}
            <Tooltip title='GitHub repository'>
              <Button
                aria-label='Open GitHub repository'
                icon={<GithubOutlined />}
                onClick={() =>
                  window.open(
                    'https://github.com/kchobantonov/jsonforms-react-renderers',
                    '_blank',
                    'noopener,noreferrer'
                  )
                }
                type='text'
              />
            </Tooltip>
            <Tooltip title='Settings'>
              <Button
                aria-label='Open settings'
                icon={<SettingOutlined />}
                onClick={onOpenSettings}
                type='text'
              />
            </Tooltip>
          </Space>
        </Layout.Header>

        <Layout
          className='renderer-demo-body'
          hasSider={!formOnly && sidebarOpen && desktop}
        >
          {!formOnly && sidebarOpen && desktop && (
            <Layout.Sider
              className='renderer-demo-sidebar'
              theme={dark ? 'dark' : 'light'}
              width={272}
            >
              {navigation}
            </Layout.Sider>
          )}

          <Layout.Content
            className={`renderer-demo-main${
              !sidebarOpen || formOnly || !desktop ? ' no-sidebar' : ''
            }`}
          >
            {children}
          </Layout.Content>
        </Layout>

        <Drawer
          title='Settings'
          placement={rtl ? 'left' : 'right'}
          open={settingsOpen}
          onClose={onCloseSettings}
        >
          {settings}
        </Drawer>
        <Drawer
          onClose={onToggleSidebar}
          open={!formOnly && sidebarOpen && !desktop}
          placement={rtl ? 'right' : 'left'}
          title='Examples'
          size={300}
        >
          {navigation}
        </Drawer>
      </Layout>
    </ConfigProvider>
  );
};

/*
  Where the demo's language reaches antd.

  JSON Forms translates the strings the renderers own; antd owns a second set -
  month and weekday names, "Today", a select's empty text - that stay English
  unless its locale is set. The chunk for a language is fetched the first time
  it is chosen, so switching language in the sidebar loads ~5 KB.
*/
const AntdWrapper = ({
  children,
  rendererSettings,
  dark,
  rtl,
  locale,
}: DemoWrapperProps) => (
  <ConfigProvider
    direction={rtl ? 'rtl' : 'ltr'}
    theme={createTheme(dark)}
    locale={useAntdLocale(locale)}
  >
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
  // Extended cells too, or the AG Grid and table examples show their colour
  // and duration columns as plain text - those controls are only in the
  // renderer registry, and a column dispatches through the cells registry.
  antdCells.concat(antdExtendedCells),
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
