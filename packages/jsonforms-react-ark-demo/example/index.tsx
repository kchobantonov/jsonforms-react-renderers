import React from 'react';
import { Dialog } from '@ark-ui/react';
import { ark } from '@ark-ui/react/factory';
import {
  arkCells,
  arkRenderers,
} from '../../jsonforms-react-ark-renderers/src/index';
import '../../jsonforms-react-ark-renderers/src/styles.css';
import { renderExample } from '../../jsonforms-react-demo-common/src/index';
import {
  ArkRendererSettings,
  createArkRendererStyle,
  defaultArkRendererSettings,
  arkExtendedRenderers,
} from '../../jsonforms-react-ark-extended-renderers/src/index';
import {
  JSON_FORMS_ARK_TAG,
  registerJsonFormsArk,
} from '../../jsonforms-react-ark-webcomponent/src/index';
import {
  DemoWrapperProps,
  DemoShellProps,
  ProviderSettingsProps,
} from '../../jsonforms-react-demo-common/src/App';
import { arkDemoUi } from './DemoUi';

const ArkDemoShell = ({
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
        ? 'app-shell app-dark ark-jsonforms-root'
        : 'app-shell ark-jsonforms-root'
    }
    dir={rtl ? 'rtl' : 'ltr'}
    style={{ '--demo-accent': '#2563eb' } as React.CSSProperties}
  >
    <header className='renderer-demo-header'>
      <ark.button
        className='ark-jsonforms-button'
        type='button'
        aria-label='Toggle navigation'
        onClick={onToggleSidebar}
      >
        Menu
      </ark.button>
      <ark.button
        className='renderer-demo-brand'
        type='button'
        onClick={onHome}
      >
        <ark.span className='brand-mark'>{brand[0]}</ark.span>
        <ark.span>
          <strong>JSON Forms</strong>
          <small>React · {rendererName}</small>
        </ark.span>
      </ark.button>
      <div className='renderer-demo-actions'>
        <ark.button
          className='ark-jsonforms-button'
          type='button'
          onClick={onToggleFormOnly}
        >
          {formOnly ? 'Full App' : 'Form Only'}
        </ark.button>
        {webComponentAvailable && (
          <ark.button
            className='ark-jsonforms-button'
            type='button'
            aria-pressed={useWebComponent}
            onClick={onToggleWebComponent}
          >
            Web Component
          </ark.button>
        )}
        <ark.button
          className='ark-jsonforms-button'
          type='button'
          onClick={onOpenSettings}
        >
          Settings
        </ark.button>
      </div>
    </header>

    {!formOnly && sidebarOpen && (
      <aside className='renderer-demo-sidebar'>
        <ark.input
          className='ark-jsonforms-input'
          value={search}
          placeholder='Search examples'
          onChange={(event) => onSearch(event.target.value)}
          style={{ boxSizing: 'border-box', width: '100%' }}
        />
        <nav className='renderer-demo-nav' aria-label='Examples'>
          {examples.map(({ name, label }) => (
            <ark.button
              key={name}
              className={`renderer-demo-nav-button${
                name === currentExampleName ? ' active' : ''
              }`}
              type='button'
              onClick={() => onSelectExample(name)}
            >
              {label}
            </ark.button>
          ))}
        </nav>
      </aside>
    )}

    <main
      className={`renderer-demo-main${
        !sidebarOpen || formOnly ? ' no-sidebar' : ''
      }`}
    >
      {children}
    </main>

    <Dialog.Root
      open={settingsOpen}
      onOpenChange={(details) => {
        if (!details.open) onCloseSettings();
      }}
    >
      <Dialog.Backdrop className='renderer-demo-dialog-backdrop' />
      <Dialog.Positioner className='renderer-demo-dialog-positioner'>
        <Dialog.Content className='renderer-demo-dialog-content'>
          <div className='settings-heading'>
            <Dialog.Title>Settings</Dialog.Title>
            <Dialog.CloseTrigger asChild>
              <ark.button className='ark-jsonforms-button' type='button'>
                Close
              </ark.button>
            </Dialog.CloseTrigger>
          </div>
          {settings}
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  </div>
);

const ArkWrapper = ({
  children,
  rendererSettings,
  dark,
  rtl,
}: DemoWrapperProps) => {
  const style = React.useMemo(
    () => createArkRendererStyle(rendererSettings as ArkRendererSettings, dark),
    [dark, rendererSettings]
  );

  return (
    <div
      className='ark-jsonforms-root'
      dir={rtl ? 'rtl' : undefined}
      style={{
        ...style,
        background: dark ? '#0f172a' : '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: (style as any)['--ark-jsonforms-radius'],
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

const ArkSettings = ({ settings, setSettings }: ProviderSettingsProps) => {
  const typedSettings = settings as ArkRendererSettings;
  const setValue = (key: string) => setProviderValue(setSettings, key);

  return (
    <>
      <ark.h3>Ark UI</ark.h3>
      <ark.label className='demo-ui-field'>
        Accent color
        <ark.input
          className='ark-jsonforms-input'
          type='color'
          value={typedSettings.accentColor ?? '#2563eb'}
          onChange={(event) =>
            setValue('accentColor')(event.currentTarget.value)
          }
        />
      </ark.label>
      <ark.label className='demo-ui-field'>
        Border radius
        <ark.input
          className='ark-jsonforms-input'
          type='number'
          min='0'
          max='24'
          value={typedSettings.borderRadius ?? 6}
          onChange={(event) =>
            setValue('borderRadius')(Number(event.currentTarget.value))
          }
        />
      </ark.label>
      <ark.label className='demo-ui-field'>
        Density
        <ark.select
          className='ark-jsonforms-input'
          value={typedSettings.density ?? 'comfortable'}
          onChange={(event) => setValue('density')(event.currentTarget.value)}
        >
          <option value='comfortable'>Comfortable</option>
          <option value='compact'>Compact</option>
        </ark.select>
      </ark.label>
    </>
  );
};

registerJsonFormsArk();

renderExample(arkRenderers.concat(arkExtendedRenderers), arkCells, ArkWrapper, {
  brand: 'Ark UI',
  rendererName: 'Ark UI',
  webComponentTag: JSON_FORMS_ARK_TAG,
  ProviderSettings: ArkSettings,
  initialProviderSettings: defaultArkRendererSettings,
  Shell: ArkDemoShell,
  Ui: arkDemoUi,
});
