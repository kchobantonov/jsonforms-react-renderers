import React from 'react';
import {
  shadcnCells,
  shadcnRenderers,
  Button,
  Input,
} from '@chobantonov/jsonforms-react-shadcn-renderers';
import '@chobantonov/jsonforms-react-shadcn-renderers/src/styles.css';
import { renderExample } from '@chobantonov/jsonforms-react-demo-common';
import {
  ShadcnRendererSettings,
  createShadcnRendererStyle,
  defaultShadcnRendererSettings,
  createShadcnExtendedRenderers,
} from '@chobantonov/jsonforms-react-shadcn-extended-renderers';
import {
  JSON_FORMS_SHADCN_TAG,
  registerJsonFormsShadcn,
} from '@chobantonov/jsonforms-react-shadcn-webcomponent';
import {
  DemoWrapperProps,
  DemoShellProps,
  ProviderSettingsProps,
} from '@chobantonov/jsonforms-react-demo-common';
import './styles/globals.css';
import { shadcnDemoUi } from './DemoUi';
import {
  Box,
  Menu,
  PanelsTopLeft,
  Palette,
  Search,
  Settings2,
  X,
} from 'lucide-react';
import { GithubIcon } from './components/GithubIcon';
import { ShadcnIcon } from './components/ShadcnIcon';

const SHADCN_LOGO = new URL('./assets/shadcn.svg', import.meta.url).href;

const ShadcnDemoShell = ({
  dark,
  rtl,
  isHome,
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
  <div
    className={
      dark
        ? 'app-shell app-dark shadcn-jsonforms-root'
        : 'app-shell shadcn-jsonforms-root'
    }
    dir={rtl ? 'rtl' : 'ltr'}
  >
    <header className='shadcn-demo-header'>
      <div className='shadcn-demo-header-inner'>
        <div className='shadcn-demo-brand-group'>
          <Button
            variant='ghost'
            size='icon'
            type='button'
            aria-label={sidebarOpen ? 'Hide example menu' : 'Show example menu'}
            aria-expanded={sidebarOpen}
            title={sidebarOpen ? 'Hide example menu' : 'Show example menu'}
            onClick={onToggleSidebar}
          >
            <Menu />
          </Button>
          <button
            className='shadcn-demo-brand'
            type='button'
            onClick={onHome}
          >
            <span className='shadcn-demo-brand-icon'>
              <ShadcnIcon className='shadcn-logo' />
            </span>
            <strong>JSON Forms Shadcn React</strong>
          </button>
        </div>
        <nav className='shadcn-demo-toolbar' aria-label='Demo tools'>
          <Button
            variant={formOnly ? 'secondary' : 'ghost'}
            size='icon'
            aria-label={formOnly ? 'Show full UI' : 'Show form only'}
            aria-pressed={formOnly}
            title={formOnly ? 'Show full UI' : 'Show form only'}
            onClick={onToggleFormOnly}
          >
            <PanelsTopLeft />
          </Button>
          {webComponentAvailable && (
            <Button
              variant={useWebComponent ? 'secondary' : 'ghost'}
              size='icon'
              aria-label={
                useWebComponent
                  ? 'Switch to React renderer'
                  : 'Switch to Web Component renderer'
              }
              aria-pressed={useWebComponent}
              title={
                useWebComponent
                  ? 'Switch to React renderer'
                  : 'Switch to Web Component renderer'
              }
              onClick={onToggleWebComponent}
            >
              <Box />
            </Button>
          )}
          <Button
            variant='ghost'
            size='icon'
            aria-label='GitHub'
            title='GitHub'
            onClick={() =>
              window.open(
                'https://github.com/kchobantonov/jsonforms-react-renderers',
                '_blank',
                'noopener,noreferrer'
              )
            }
          >
            <GithubIcon />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            aria-label='Customize theme'
            title='Customize theme'
            onClick={onOpenSettings}
          >
            <Palette />
          </Button>
          <Button
            variant={settingsOpen ? 'secondary' : 'ghost'}
            size='icon'
            aria-label={settingsOpen ? 'Close settings' : 'Open settings'}
            aria-expanded={settingsOpen}
            title={settingsOpen ? 'Close settings' : 'Open settings'}
            onClick={settingsOpen ? onCloseSettings : onOpenSettings}
          >
            <Settings2 />
          </Button>
        </nav>
      </div>
    </header>

    {!formOnly && sidebarOpen && (
      <>
        <button
          className='shadcn-demo-sidebar-backdrop'
          type='button'
          aria-label='Close examples menu'
          onClick={onToggleSidebar}
        />
        <aside className='shadcn-demo-sidebar'>
          <div className='shadcn-demo-search'>
            <Search aria-hidden='true' />
            <Input
              value={search}
              placeholder='Search examples...'
              onChange={(event) => onSearch(event.target.value)}
            />
          </div>
          <nav className='shadcn-demo-nav' aria-label='Examples'>
            {examples.length === 0 ? (
              <p>No examples found.</p>
            ) : (
              examples.map(({ name, label }) => (
                <Button
                  key={name}
                  variant={name === currentExampleName ? 'default' : 'outline'}
                  type='button'
                  onClick={() => onSelectExample(name)}
                >
                  {label}
                </Button>
              ))
            )}
          </nav>
        </aside>
      </>
    )}

    <main
      className={`shadcn-demo-main${
        sidebarOpen && !formOnly ? ' with-sidebar' : ''
      }${isHome ? ' home' : ''}`}
    >
      {children}
    </main>

    {settingsOpen && (
      <div className='shadcn-demo-settings-layer'>
        <button
          className='shadcn-demo-settings-backdrop'
          type='button'
          aria-label='Close settings'
          onClick={onCloseSettings}
        />
        <aside className='shadcn-demo-settings' role='dialog' aria-modal='true'>
          <div className='shadcn-demo-settings-heading'>
            <div>
              <h2>Settings</h2>
              <p>Configure the renderer demo and JSON Forms behavior.</p>
            </div>
            <Button
              variant='ghost'
              size='icon'
              type='button'
              aria-label='Close settings'
              onClick={onCloseSettings}
            >
              <X />
            </Button>
          </div>
          <div className='shadcn-demo-settings-content'>{settings}</div>
        </aside>
      </div>
    )}
  </div>
);

const ShadcnWrapper = ({
  children,
  rendererSettings,
  dark,
  rtl,
}: DemoWrapperProps) => {
  const style = React.useMemo(
    () =>
      createShadcnRendererStyle(
        rendererSettings as ShadcnRendererSettings,
        dark
      ),
    [dark, rendererSettings]
  );

  return (
    <div
      className='shadcn-jsonforms-root'
      dir={rtl ? 'rtl' : undefined}
      style={{
        ...style,
        backgroundColor: 'transparent',
        border: 0,
        borderRadius: (style as any)['--shadcn-jsonforms-radius'],
        color: dark ? '#e2e8f0' : '#111827',
        padding: 0,
        width: '100%',
      }}
    >
      {children}
    </div>
  );
};

const setProviderValue =
  (setSettings: ProviderSettingsProps['setSettings'], key: string) =>
  (value: unknown) => {
    setSettings((oldSettings) => ({
      ...oldSettings,
      [key]: value,
    }));
  };

const ShadcnSettings = ({ settings, setSettings }: ProviderSettingsProps) => {
  const typedSettings = settings as ShadcnRendererSettings;
  const setValue = (key: string) => setProviderValue(setSettings, key);

  return (
    <>
      <h3>Shadcn UI</h3>
      <label className='demo-ui-field'>
        Accent color
        <input
          className='shadcn-jsonforms-input'
          type='color'
          value={typedSettings.accentColor ?? '#0f172a'}
          onChange={(event) => setValue('accentColor')(event.target.value)}
        />
      </label>
      <label className='demo-ui-field'>
        Border radius
        <input
          className='shadcn-jsonforms-input'
          type='number'
          min='0'
          max='24'
          value={typedSettings.borderRadius ?? 6}
          onChange={(event) =>
            setValue('borderRadius')(Number(event.target.value))
          }
        />
      </label>
      <label className='demo-ui-field'>
        Density
        <select
          className='shadcn-jsonforms-input'
          value={typedSettings.density ?? 'comfortable'}
          onChange={(event) => setValue('density')(event.target.value)}
        >
          <option value='comfortable'>Comfortable</option>
          <option value='compact'>Compact</option>
        </select>
      </label>
    </>
  );
};

registerJsonFormsShadcn();

const shadcnDemoExtendedRenderers = createShadcnExtendedRenderers();

renderExample(
  shadcnRenderers.concat(shadcnDemoExtendedRenderers),
  shadcnCells,
  ShadcnWrapper,
  {
    brand: 'Shadcn UI',
    rendererName: 'Shadcn UI',
    logoSrc: SHADCN_LOGO,
    webComponentTag: JSON_FORMS_SHADCN_TAG,
    ProviderSettings: ShadcnSettings,
    initialProviderSettings: defaultShadcnRendererSettings,
    initialLayout: 'demo-and-data',
    Shell: ShadcnDemoShell,
    Ui: shadcnDemoUi,
  }
);
