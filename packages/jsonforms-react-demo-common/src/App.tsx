import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { JsonForms, JsonFormsInitStateProps } from '@jsonforms/react';
import { ExampleDescription } from '@jsonforms/examples';
import {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  ValidationMode,
} from '@jsonforms/core';
import Editor from '@monaco-editor/react';
import {
  ActionEvent,
  HandleActionContext,
} from '@chobantonov/jsonforms-react-extended-renderers';
import './App.css';

export type ProviderSettingsProps = {
  settings: Record<string, any>;
  setSettings: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  dark: boolean;
  mode: string;
  rtl: boolean;
};

export type DemoWrapperProps = React.PropsWithChildren<{
  rendererSettings: Record<string, any>;
  dark: boolean;
  mode: string;
  rtl: boolean;
}>;

export type DemoShellProps = React.PropsWithChildren<{
  brand: string;
  rendererName: string;
  logoSrc?: string;
  dark: boolean;
  rtl: boolean;
  isHome: boolean;
  formOnly: boolean;
  sidebarOpen: boolean;
  settingsOpen: boolean;
  useWebComponent: boolean;
  webComponentAvailable: boolean;
  search: string;
  examples: Array<{ name: string; label: string }>;
  currentExampleName?: string;
  settings: React.ReactNode;
  onHome: () => void;
  onSelectExample: (name: string) => void;
  onSearch: (value: string) => void;
  onToggleSidebar: () => void;
  onToggleFormOnly: () => void;
  onToggleWebComponent: () => void;
  onOpenSettings: () => void;
  onCloseSettings: () => void;
}>;

export type DemoShell = React.ComponentType<DemoShellProps>;

export type DemoOption = {
  label: string;
  value: string;
};

export type DemoButtonProps = React.PropsWithChildren<{
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}>;

export type DemoPanelProps = React.PropsWithChildren<{
  className?: string;
}>;

export type DemoTabsProps = {
  items: DemoOption[];
  value: string;
  onChange: (value: string) => void;
};

export type DemoSelectProps = {
  label: string;
  options: DemoOption[];
  value: string;
  onChange: (value: string) => void;
};

export type DemoToggleProps = {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
};

export type DemoUi = {
  Button: React.ComponentType<DemoButtonProps>;
  Panel: React.ComponentType<DemoPanelProps>;
  Select: React.ComponentType<DemoSelectProps>;
  Tabs: React.ComponentType<DemoTabsProps>;
  Toggle: React.ComponentType<DemoToggleProps>;
};

type AppProps = {
  brand: string;
  rendererName: string;
  logoSrc?: string;
  examples: ExampleDescription[];
  cells: JsonFormsCellRendererRegistryEntry[];
  renderers: JsonFormsRendererRegistryEntry[];
  webComponentTag?: string;
  Wrapper?: React.JSXElementConstructor<any>;
  Shell?: DemoShell;
  Ui?: DemoUi;
  ProviderSettings?: React.ComponentType<ProviderSettingsProps>;
  initialProviderSettings?: Record<string, any>;
};

type EditorKey = 'data' | 'schema' | 'uischema' | 'uischemas' | 'config';

type Action = {
  label: string;
  apply: any;
};

const getProps = (
  example: ExampleDescription,
  cells?: JsonFormsCellRendererRegistryEntry[],
  renderers?: JsonFormsRendererRegistryEntry[]
) => ({
  schema: example.schema,
  uischema: example.uischema,
  data: example.data,
  config: example.config,
  uischemas: example.uischemas,
  cells,
  renderers,
  i18n: example.i18n,
});

const stringify = (value: unknown) =>
  value === undefined ? '' : JSON.stringify(value, null, 2);

const parseEditorValue = (value: string) =>
  value.trim() === '' ? undefined : JSON.parse(value);

const routeFromLocation = (examples: ExampleDescription[]) => {
  const hash = window.location.hash.slice(1);
  const index = examples.findIndex((example) => example.name === hash);
  return { index: index === -1 ? 0 : index, isHome: index === -1 };
};

const useSystemDark = () => {
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const update = (event: MediaQueryList | MediaQueryListEvent) =>
      setSystemDark(event.matches);
    update(query);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return systemDark;
};

const WebComponentHost = ({
  tagName,
  props,
  dark,
  mode,
  rtl,
  locale,
  validationMode,
  rendererSettings,
  onChange,
  onAction,
}: {
  tagName: string;
  props: JsonFormsInitStateProps;
  dark: boolean;
  mode: string;
  rtl: boolean;
  locale: string;
  validationMode: ValidationMode;
  rendererSettings: Record<string, any>;
  onChange: (data: unknown) => void;
  onAction: (event: ActionEvent) => void;
}) => {
  const ref = useRef<HTMLElement>();

  useEffect(() => {
    const element = ref.current as any;
    if (!element) return;

    element.data = props.data;
    element.schema = props.schema;
    element.uischema = props.uischema;
    element.uischemas = props.uischemas;
    element.config = props.config;
    element.readonly = props.readonly;
    element.validationMode = validationMode;
    element.locale = locale;
    element.dark = dark;
    element.mode = mode;
    element.rtl = rtl;
    element.rendererSettings = rendererSettings;
  }, [props, dark, mode, rtl, locale, validationMode, rendererSettings]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleChange = (event: Event) =>
      onChange((event as CustomEvent).detail?.data);
    const handleAction = (event: Event) =>
      onAction((event as CustomEvent).detail);

    element.addEventListener('change', handleChange);
    element.addEventListener('handle-action', handleAction);
    return () => {
      element.removeEventListener('change', handleChange);
      element.removeEventListener('handle-action', handleAction);
    };
  }, [onAction, onChange]);

  return React.createElement(
    tagName,
    { ref },
    <div slot='form-header' className='webcomponent-form-header'>
      Web component mode
    </div>,
    <div slot='form-footer' className='webcomponent-form-footer' />
  );
};

const DefaultButton = ({
  active,
  disabled,
  onClick,
  children,
}: DemoButtonProps) => (
  <button
    className={`demo-button${active ? ' active' : ''}`}
    type='button'
    disabled={disabled}
    onClick={onClick}
  >
    {children}
  </button>
);

const DefaultPanel = ({ className = '', children }: DemoPanelProps) => (
  <div className={className}>{children}</div>
);

const DefaultSelect = ({
  label,
  options,
  value,
  onChange,
}: DemoSelectProps) => (
  <label>
    {label}
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

const DefaultTabs = ({ items, value, onChange }: DemoTabsProps) => (
  <div className='tab-list'>
    {items.map((item) => (
      <DefaultButton
        key={item.value}
        active={item.value === value}
        onClick={() => onChange(item.value)}
      >
        {item.label}
      </DefaultButton>
    ))}
  </div>
);

const DefaultToggle = ({ checked, label, onChange }: DemoToggleProps) => (
  <label className='checkbox-row'>
    <input
      type='checkbox'
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    />
    {label}
  </label>
);

export const defaultDemoUi: DemoUi = {
  Button: DefaultButton,
  Panel: DefaultPanel,
  Select: DefaultSelect,
  Tabs: DefaultTabs,
  Toggle: DefaultToggle,
};

const DefaultDemoShell = ({
  brand,
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
  <div
    className={dark ? 'app-shell app-dark' : 'app-shell'}
    dir={rtl ? 'rtl' : 'ltr'}
  >
    <header className='topbar'>
      <button
        className='demo-button icon-button'
        type='button'
        aria-label='Toggle navigation'
        onClick={onToggleSidebar}
      >
        Menu
      </button>
      <button className='brand' type='button' onClick={onHome}>
        {logoSrc ? (
          <img className='brand-logo' src={logoSrc} alt={`${brand} logo`} />
        ) : (
          <span className='brand-mark'>{brand[0]}</span>
        )}
        <span>
          <strong>JSON Forms</strong>
          <small>React · {rendererName}</small>
        </span>
      </button>
      <div className='topbar-actions'>
        <button
          className='demo-button'
          type='button'
          onClick={onToggleFormOnly}
        >
          {formOnly ? 'Full App' : 'Form Only'}
        </button>
        {webComponentAvailable && (
          <button
            className={`demo-button${useWebComponent ? ' active' : ''}`}
            type='button'
            aria-pressed={useWebComponent}
            onClick={onToggleWebComponent}
          >
            Web Component
          </button>
        )}
        <button className='demo-button' type='button' onClick={onOpenSettings}>
          Settings
        </button>
      </div>
    </header>

    {!formOnly && sidebarOpen && (
      <aside className='sidebar'>
        <input
          value={search}
          placeholder='Search examples'
          onChange={(event) => onSearch(event.target.value)}
        />
        <nav>
          {examples.map((example) => (
            <button
              type='button'
              key={example.name}
              className={`demo-button${
                example.name === currentExampleName ? ' active' : ''
              }`}
              onClick={() => onSelectExample(example.name)}
            >
              {example.label}
            </button>
          ))}
        </nav>
      </aside>
    )}

    <main
      className={`demo-main${!sidebarOpen || formOnly ? ' no-sidebar' : ''}`}
    >
      {children}
    </main>

    {settingsOpen && (
      <div className='settings-backdrop' onClick={onCloseSettings}>
        <aside
          className='settings-panel'
          onClick={(event) => event.stopPropagation()}
        >
          <div className='settings-heading'>
            <h2>Settings</h2>
            <button
              className='demo-button'
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

const App = ({
  brand,
  rendererName,
  logoSrc,
  examples,
  cells,
  renderers,
  webComponentTag,
  ProviderSettings,
  initialProviderSettings = {},
  Wrapper,
  Shell = DefaultDemoShell,
  Ui = defaultDemoUi,
}: AppProps) => {
  const initialRoute = routeFromLocation(examples);
  const [currentIndex, setIndex] = useState(initialRoute.index);
  const [isHome, setIsHome] = useState(initialRoute.isHome);
  const [exampleProps, setExampleProps] = useState(
    getProps(examples[initialRoute.index], cells, renderers)
  );
  const [models, setModels] = useState<Record<EditorKey, string>>({
    data: stringify(examples[initialRoute.index].data),
    schema: stringify(examples[initialRoute.index].schema),
    uischema: stringify(examples[initialRoute.index].uischema),
    uischemas: stringify(examples[initialRoute.index].uischemas),
    config: stringify(examples[initialRoute.index].config),
  });
  const [activeTab, setActiveTab] = useState<'demo' | EditorKey>('demo');
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [formOnly, setFormOnly] = useState(false);
  const [useWebComponent, setUseWebComponent] = useState(false);
  const [mode, setMode] = useState<'system' | 'light' | 'dark'>('system');
  const [rtl, setRtl] = useState(false);
  const [readonly, setReadonly] = useState(false);
  const [locale, setLocale] = useState('en');
  const [validationMode, setValidationMode] =
    useState<ValidationMode>('ValidateAndShow');
  const [errors, setErrors] = useState<any[]>([]);
  const [rendererSettings, setRendererSettings] = useState<Record<string, any>>(
    initialProviderSettings
  );
  const systemDark = useSystemDark();

  const currentExample = examples[currentIndex];
  const dark = mode === 'dark' || (mode === 'system' && systemDark);
  const actions: Action[] = currentExample.actions ?? [];
  const {
    Button: UiButton,
    Panel: UiPanel,
    Select: UiSelect,
    Tabs: UiTabs,
    Toggle: UiToggle,
  } = Ui;

  const updateModels = useCallback((example: ExampleDescription) => {
    setModels({
      data: stringify(example.data),
      schema: stringify(example.schema),
      uischema: stringify(example.uischema),
      uischemas: stringify(example.uischemas),
      config: stringify(example.config),
    });
  }, []);

  const loadExample = useCallback(
    (index: number) => {
      const example = examples[index];
      setIndex(index);
      setExampleProps(getProps(example, cells, renderers));
      updateModels(example);
      setActiveTab('demo');
      setIsHome(false);
    },
    [cells, examples, renderers, updateModels]
  );

  useEffect(() => {
    const syncRoute = () => {
      const route = routeFromLocation(examples);
      if (route.isHome) {
        setIsHome(true);
      } else {
        loadExample(route.index);
      }
    };
    window.addEventListener('hashchange', syncRoute);
    window.addEventListener('popstate', syncRoute);
    return () => {
      window.removeEventListener('hashchange', syncRoute);
      window.removeEventListener('popstate', syncRoute);
    };
  }, [examples, loadExample]);

  const changeExample = (exampleName: string) => {
    const index = examples.findIndex((example) => example.name === exampleName);
    if (index === -1) return;
    loadExample(index);
    if (window.location.hash.slice(1) !== exampleName) {
      window.location.hash = exampleName;
    }
  };

  const goHome = () => {
    window.history.pushState(
      null,
      '',
      `${window.location.pathname}${window.location.search}`
    );
    setIsHome(true);
    setFormOnly(false);
  };

  const filteredExamples = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (
      needle
        ? examples.filter((example) =>
            example.label.toLowerCase().includes(needle)
          )
        : examples
    ).map(({ name, label }) => ({ name, label }));
  }, [examples, search]);

  const jsonFormsProps = useMemo(
    () => ({
      ...exampleProps,
      config: {
        ...(exampleProps.config ?? {}),
        readonly,
      },
      readonly,
      validationMode,
      i18n: {
        ...(exampleProps.i18n ?? {}),
        locale,
      },
    }),
    [exampleProps, locale, readonly, validationMode]
  );

  const setData = useCallback((data: unknown) => {
    setExampleProps((oldProps) => ({ ...oldProps, data }));
    setModels((oldModels) => ({ ...oldModels, data: stringify(data) }));
  }, []);

  const handleAction = useCallback((event: ActionEvent) => {
    setErrors((oldErrors) => [
      ...oldErrors,
      { message: `Action handled: ${event.label}` },
    ]);
  }, []);

  const renderForm = () => {
    if (webComponentTag && useWebComponent) {
      return (
        <WebComponentHost
          tagName={webComponentTag}
          props={jsonFormsProps}
          dark={dark}
          mode={mode}
          rtl={rtl}
          locale={locale}
          validationMode={validationMode}
          rendererSettings={rendererSettings}
          onChange={setData}
          onAction={handleAction}
        />
      );
    }

    const content = (
      <HandleActionContext.Provider value={handleAction}>
        <JsonForms
          key={currentIndex}
          {...jsonFormsProps}
          onChange={({ data, errors: nextErrors }) => {
            setData(data);
            setErrors(nextErrors ?? []);
          }}
        />
      </HandleActionContext.Provider>
    );

    return Wrapper ? (
      <Wrapper
        rendererSettings={rendererSettings}
        dark={dark}
        mode={mode}
        rtl={rtl}
      >
        {content}
      </Wrapper>
    ) : (
      content
    );
  };

  const settings = (
    <div className='demo-settings'>
      <UiSelect
        label='Mode'
        value={mode}
        options={[
          { value: 'system', label: 'System' },
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ]}
        onChange={(value) => setMode(value as typeof mode)}
      />
      <UiSelect
        label='Locale'
        value={locale}
        options={[
          { value: 'en', label: 'English' },
          { value: 'bg', label: 'Bulgarian' },
        ]}
        onChange={setLocale}
      />
      <UiSelect
        label='Validation'
        value={validationMode}
        options={[
          { value: 'ValidateAndShow', label: 'Validate and show' },
          { value: 'ValidateAndHide', label: 'Validate and hide' },
          { value: 'NoValidation', label: 'No validation' },
        ]}
        onChange={(value) => setValidationMode(value as ValidationMode)}
      />
      <UiToggle checked={rtl} label='RTL' onChange={setRtl} />
      <UiToggle checked={readonly} label='Read-only' onChange={setReadonly} />
      {webComponentTag && (
        <UiToggle
          checked={useWebComponent}
          label='Web component view'
          onChange={setUseWebComponent}
        />
      )}
      {ProviderSettings && (
        <div className='provider-settings'>
          <ProviderSettings
            settings={rendererSettings}
            setSettings={setRendererSettings}
            dark={dark}
            mode={mode}
            rtl={rtl}
          />
        </div>
      )}
    </div>
  );

  const content = isHome ? (
    <section className='demo-home'>
      {logoSrc ? (
        <img className='demo-home-logo' src={logoSrc} alt={`${brand} logo`} />
      ) : (
        <div className='demo-home-mark'>{brand[0]}</div>
      )}
      <p className='demo-home-eyebrow'>JSON Forms renderer set</p>
      <h1>Welcome to JSON Forms React {rendererName}</h1>
      <p className='demo-home-tagline'>More Forms. Less Code.</p>
      <UiButton onClick={() => changeExample(examples[0].name)}>
        Open Demo
      </UiButton>
    </section>
  ) : (
    <section className={formOnly ? 'workspace form-only' : 'workspace'}>
      {!formOnly && (
        <div className='workspace-title'>
          <h1>{currentExample.label}</h1>
        </div>
      )}

      {formOnly ? (
        <UiPanel className='form-card standalone'>{renderForm()}</UiPanel>
      ) : (
        <div className='demo-tabs'>
          <UiTabs
            value={activeTab}
            items={(
              [
                'demo',
                'schema',
                'uischema',
                'uischemas',
                'config',
                'data',
              ] as const
            ).map((tab) => ({
              value: tab,
              label:
                tab === 'demo' && errors.length
                  ? `Demo (${errors.length})`
                  : tab === 'uischema'
                  ? 'UI Schema'
                  : tab === 'uischemas'
                  ? 'UI Schemas'
                  : tab[0].toUpperCase() + tab.slice(1),
            }))}
            onChange={(value) => setActiveTab(value as typeof activeTab)}
          />

          {activeTab === 'demo' ? (
            <UiPanel className='panel'>
              <div className='jsonform-toolbar'>
                <h2>JSON Forms</h2>
                <div className='action-row'>
                  {actions.map((action) => (
                    <UiButton
                      key={action.label}
                      onClick={() =>
                        setExampleProps((oldProps: JsonFormsInitStateProps) =>
                          action.apply(oldProps)
                        )
                      }
                    >
                      {action.label}
                    </UiButton>
                  ))}
                </div>
              </div>
              <UiPanel className='form-card'>{renderForm()}</UiPanel>
            </UiPanel>
          ) : (
            <UiPanel className='editor-panel panel'>
              <div className='editor-heading'>
                <h2>{activeTab}</h2>
                <div className='action-row'>
                  <UiButton
                    onClick={() =>
                      setModels((oldModels) => ({
                        ...oldModels,
                        [activeTab]: stringify(exampleProps[activeTab]),
                      }))
                    }
                  >
                    Reload
                  </UiButton>
                  <UiButton
                    onClick={() =>
                      setExampleProps((oldProps) => ({
                        ...oldProps,
                        [activeTab]: parseEditorValue(models[activeTab]),
                      }))
                    }
                  >
                    Apply
                  </UiButton>
                </div>
              </div>
              <Editor
                height='68vh'
                defaultLanguage='json'
                theme={dark ? 'vs-dark' : 'light'}
                value={models[activeTab]}
                onChange={(value) =>
                  setModels((oldModels) => ({
                    ...oldModels,
                    [activeTab]: value ?? '',
                  }))
                }
              />
            </UiPanel>
          )}
        </div>
      )}
    </section>
  );

  return (
    <Shell
      brand={brand}
      rendererName={rendererName}
      logoSrc={logoSrc}
      dark={dark}
      rtl={rtl}
      isHome={isHome}
      formOnly={formOnly}
      sidebarOpen={sidebarOpen}
      settingsOpen={settingsOpen}
      useWebComponent={useWebComponent}
      webComponentAvailable={Boolean(webComponentTag)}
      search={search}
      examples={filteredExamples}
      currentExampleName={isHome ? undefined : currentExample.name}
      settings={settings}
      onHome={goHome}
      onSelectExample={changeExample}
      onSearch={setSearch}
      onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      onToggleFormOnly={() => setFormOnly(!formOnly)}
      onToggleWebComponent={() => setUseWebComponent(!useWebComponent)}
      onOpenSettings={() => setSettingsOpen(true)}
      onCloseSettings={() => setSettingsOpen(false)}
    >
      {content}
    </Shell>
  );
};

export default App;
