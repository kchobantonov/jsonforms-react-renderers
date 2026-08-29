import React from 'react';
import {
  ShadcnComponentsProvider,
  shadcnCells,
  shadcnRenderers,
} from '../../jsonforms-react-shadcn-renderers/src/index';
import '../../jsonforms-react-shadcn-renderers/src/styles.css';
import { renderExample } from '../../jsonforms-react-demo-common/src/index';
import {
  ShadcnRendererSettings,
  createShadcnRendererStyle,
  defaultShadcnRendererSettings,
  createShadcnExtendedRenderers,
} from '../../jsonforms-react-shadcn-extended-renderers/src/index';
import {
  JSON_FORMS_SHADCN_TAG,
  registerJsonFormsShadcn,
} from '../../jsonforms-react-shadcn-webcomponent/src/index';
import {
  DemoWrapperProps,
  DemoShellProps,
  ProviderSettingsProps,
} from '../../jsonforms-react-demo-common/src/App';
import './styles/globals.css';
import { shadcnDemoUi } from './DemoUi';
import { shadcnComponents } from './components/jsonforms';
import './components/jsonforms/styles.css';

const ShadcnDemoShell = ({
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
  <div
    className={
      dark
        ? 'app-shell app-dark shadcn-jsonforms-root'
        : 'app-shell shadcn-jsonforms-root'
    }
    dir={rtl ? 'rtl' : 'ltr'}
    style={{ '--demo-accent': '#0f172a' } as React.CSSProperties}
  >
    <header className='renderer-demo-header'>
      <button
        className='shadcn-jsonforms-button'
        type='button'
        aria-label='Toggle navigation'
        onClick={onToggleSidebar}
      >
        Menu
      </button>
      <button className='renderer-demo-brand' type='button' onClick={onHome}>
        <span className='brand-mark'>{brand[0]}</span>
        <span>
          <strong>JSON Forms</strong>
          <small>React · {rendererName}</small>
        </span>
      </button>
      <div className='renderer-demo-actions'>
        <button
          className='shadcn-jsonforms-button'
          type='button'
          onClick={onToggleFormOnly}
        >
          {formOnly ? 'Full App' : 'Form Only'}
        </button>
        {webComponentAvailable && (
          <button
            className='shadcn-jsonforms-button'
            type='button'
            aria-pressed={useWebComponent}
            onClick={onToggleWebComponent}
          >
            Web Component
          </button>
        )}
        <button
          className='shadcn-jsonforms-button'
          type='button'
          onClick={onOpenSettings}
        >
          Settings
        </button>
      </div>
    </header>

    {!formOnly && sidebarOpen && (
      <aside className='renderer-demo-sidebar'>
        <input
          className='shadcn-jsonforms-input'
          value={search}
          placeholder='Search examples'
          onChange={(event) => onSearch(event.target.value)}
          style={{ boxSizing: 'border-box', width: '100%' }}
        />
        <nav className='renderer-demo-nav' aria-label='Examples'>
          {examples.map(({ name, label }) => (
            <button
              key={name}
              className={`renderer-demo-nav-button${
                name === currentExampleName ? ' active' : ''
              }`}
              type='button'
              onClick={() => onSelectExample(name)}
            >
              {label}
            </button>
          ))}
        </nav>
      </aside>
    )}

    <main
      className={`renderer-demo-main${
        !sidebarOpen || formOnly ? ' no-sidebar' : ''
      }`}
    >
      <ShadcnComponentsProvider components={shadcnComponents}>
        {children}
      </ShadcnComponentsProvider>
    </main>

    {settingsOpen && (
      <div className='settings-backdrop' onClick={onCloseSettings}>
        <aside
          className='settings-panel'
          role='dialog'
          aria-modal='true'
          aria-label='Settings'
          onClick={(event) => event.stopPropagation()}
        >
          <div className='settings-heading'>
            <h2>Settings</h2>
            <button
              className='shadcn-jsonforms-button'
              type='button'
              onClick={onCloseSettings}
            >
              Close
            </button>
          </div>
          {settings}
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
        background: dark ? '#0f172a' : '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: (style as any)['--shadcn-jsonforms-radius'],
        color: dark ? '#e2e8f0' : '#111827',
        padding: 16,
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
          value={typedSettings.accentColor ?? '#2563eb'}
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

const shadcnDemoExtendedRenderers = createShadcnExtendedRenderers({
  components: shadcnComponents,
});

renderExample(
  shadcnRenderers.concat(shadcnDemoExtendedRenderers),
  shadcnCells,
  ShadcnWrapper,
  {
    brand: 'Shadcn UI',
    rendererName: 'Shadcn UI',
    webComponentTag: JSON_FORMS_SHADCN_TAG,
    ProviderSettings: ShadcnSettings,
    initialProviderSettings: defaultShadcnRendererSettings,
    Shell: ShadcnDemoShell,
    Ui: shadcnDemoUi,
  }
);
