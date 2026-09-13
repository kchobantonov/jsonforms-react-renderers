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
import { LaptopMinimalCheck, Moon, RotateCcw, Save, Sun } from 'lucide-react';
import { DefaultDemoSplitter, DemoSplitterProps } from './DemoSplitter';
import {
  EditorModels,
  reloadOriginalEditorModel,
  stringifyEditorValue,
} from './editorModels';
import {
  DemoLayout,
  DemoMode,
  DemoQueryKey,
  DemoSettingsStorage,
  DemoTab,
  PersistedDemoSettings,
  demoSettingsStorageKey,
  encodeDemoHashRoute,
  getWebDemoSettingsStorage,
  readDemoQueryState,
  readPersistedDemoSettings,
  splitDemoHash,
  writeDemoQueryValue,
  writePersistedDemoSettings,
} from './demoPreferences';
import './App.css';
import { DefaultDemoTypography } from './DefaultDemoTypography';
import { DefaultDemoTextInput } from './DefaultDemoTextInput';

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
  ariaLabel?: string;
  disabled?: boolean;
  iconOnly?: boolean;
  tooltip?: string;
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
  description?: string;
  onChange: (checked: boolean) => void;
};

export type DemoTextInputProps = {
  label: string;
  value: string;
  placeholder?: string;
  description?: string;
  onChange: (value: string) => void;
};

export type DemoTypographyProps = React.PropsWithChildren<{
  component: 'h1' | 'h2' | 'h3' | 'p';
  className?: string;
}>;

export type DemoUi = {
  Typography?: React.ComponentType<DemoTypographyProps>;
  TextInput?: React.ComponentType<DemoTextInputProps>;
  SegmentedControl?: React.ComponentType<DemoSelectProps>;
  Divider?: React.ComponentType;

  Button: React.ComponentType<DemoButtonProps>;
  Panel: React.ComponentType<DemoPanelProps>;
  Select: React.ComponentType<DemoSelectProps>;
  Splitter?: React.ComponentType<DemoSplitterProps>;
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
  initialLayout?: DemoLayout;
  settingsStorage?: DemoSettingsStorage | null;
  settingsStorageKey?: string;
};

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

const parseEditorValue = (value: string) =>
  value.trim() === '' ? undefined : JSON.parse(value);

const routeFromLocation = (examples: ExampleDescription[]) => {
  const hash = splitDemoHash(window.location.hash).route;
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
    element.translations = props.i18n?.translate;
    element.additionalErrors = props.additionalErrors;
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
  ariaLabel,
  disabled,
  iconOnly,
  tooltip,
  onClick,
  children,
}: DemoButtonProps) => (
  <button
    aria-label={ariaLabel}
    className={`demo-button${active ? ' active' : ''}${
      iconOnly ? ' icon-only' : ''
    }`}
    type='button'
    disabled={disabled}
    title={tooltip}
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

const DefaultToggle = ({
  checked,
  label,
  description,
  onChange,
}: DemoToggleProps) => (
  <label className='checkbox-row'>
    <input
      type='checkbox'
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    />
    <span>
      <strong>{label}</strong>
      {description && <small>{description}</small>}
    </span>
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
  initialLayout = 'default',
  settingsStorage,
  settingsStorageKey,
  Wrapper,
  Shell = DefaultDemoShell,
  Ui = defaultDemoUi,
}: AppProps) => {
  const initialProviderSettingsRef = useRef(initialProviderSettings).current;
  const defaultDrawer = useRef(
    window.matchMedia('(min-width: 1280px)').matches
  ).current;
  const queryDefaults = useRef({
    readonly: false,
    formOnly: false,
    activeTab: 'demo' as DemoTab,
    useWebComponent: false,
    drawer: defaultDrawer,
  }).current;
  const initialQuery = useRef(
    readDemoQueryState(window.location, queryDefaults)
  ).current;
  const preferenceStorage = useMemo(
    () =>
      settingsStorage === undefined
        ? getWebDemoSettingsStorage()
        : settingsStorage ?? undefined,
    [settingsStorage]
  );
  const preferenceStorageKey =
    settingsStorageKey ?? demoSettingsStorageKey(rendererName);
  const initialPersistedRead = useMemo(
    () => readPersistedDemoSettings(preferenceStorage, preferenceStorageKey),
    [preferenceStorage, preferenceStorageKey]
  );
  const initialPersisted =
    initialPersistedRead &&
    typeof (initialPersistedRead as Promise<unknown>).then !== 'function'
      ? (initialPersistedRead as Partial<PersistedDemoSettings>)
      : undefined;
  const initialRoute = routeFromLocation(examples);
  const [currentIndex, setIndex] = useState(initialRoute.index);
  const [isHome, setIsHome] = useState(initialRoute.isHome);
  const [exampleProps, setExampleProps] = useState(
    getProps(examples[initialRoute.index], cells, renderers)
  );
  const [models, setModels] = useState<EditorModels>({
    data: stringifyEditorValue(examples[initialRoute.index].data),
    schema: stringifyEditorValue(examples[initialRoute.index].schema),
    uischema: stringifyEditorValue(examples[initialRoute.index].uischema),
    uischemas: stringifyEditorValue(examples[initialRoute.index].uischemas),
    i18n: stringifyEditorValue(examples[initialRoute.index].i18n),
    config: stringifyEditorValue(examples[initialRoute.index].config),
  });
  const [activeTab, setActiveTab] = useState<DemoTab>(initialQuery.activeTab);
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(initialQuery.drawer);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [formOnly, setFormOnly] = useState(initialQuery.formOnly);
  const [useWebComponent, setUseWebComponent] = useState(
    initialQuery.useWebComponent
  );
  const [mode, setMode] = useState<DemoMode>(
    initialPersisted?.mode === 'light' || initialPersisted?.mode === 'dark'
      ? initialPersisted.mode
      : 'system'
  );
  const [rtl, setRtl] = useState(false);
  const [readonly, setReadonly] = useState(initialQuery.readonly);
  const [locale, setLocale] = useState(
    typeof initialPersisted?.locale === 'string'
      ? initialPersisted.locale
      : 'en'
  );
  const [validationMode, setValidationMode] =
    useState<ValidationMode>('ValidateAndShow');
  const [layout, setLayout] = useState<DemoLayout>(
    initialPersisted?.layout === 'default' ||
      initialPersisted?.layout === 'demo-and-data'
      ? initialPersisted.layout
      : initialLayout
  );
  const [configOptions, setConfigOptions] = useState<Record<string, any>>({
    restrict: true,
  });
  const [errors, setErrors] = useState<any[]>([]);
  const [rendererSettings, setRendererSettings] = useState<Record<string, any>>(
    {
      ...initialProviderSettingsRef,
      ...(initialPersisted?.rendererSettings ?? {}),
    }
  );
  const [preferencesHydrated, setPreferencesHydrated] = useState(
    initialPersistedRead === undefined || initialPersisted !== undefined
  );
  const systemDark = useSystemDark();

  const currentExample = examples[currentIndex];
  const dark = mode === 'dark' || (mode === 'system' && systemDark);
  const actions: Action[] = currentExample.actions ?? [];
  const {
    Button: UiButton,
    Panel: UiPanel,
    Select: UiSelect,
    Splitter: UiSplitter = DefaultDemoSplitter,
    Tabs: UiTabs,
    Toggle: UiToggle,
    Typography: UiTypography = DefaultDemoTypography,
    TextInput: UiTextInput = DefaultDemoTextInput,
    SegmentedControl: UiSegmentedControl,
    Divider: UiDivider,
  } = Ui;

  useEffect(() => {
    let cancelled = false;
    Promise.resolve(initialPersistedRead).then((persisted) => {
      if (cancelled || initialPersisted !== undefined) return;
      if (persisted) {
        if (
          persisted.mode === 'system' ||
          persisted.mode === 'light' ||
          persisted.mode === 'dark'
        ) {
          setMode(persisted.mode);
        }
        if (typeof persisted.locale === 'string') setLocale(persisted.locale);
        if (
          persisted.layout === 'default' ||
          persisted.layout === 'demo-and-data'
        ) {
          setLayout(persisted.layout);
        }
        if (
          persisted.rendererSettings &&
          typeof persisted.rendererSettings === 'object' &&
          !Array.isArray(persisted.rendererSettings)
        ) {
          setRendererSettings({
            ...initialProviderSettingsRef,
            ...persisted.rendererSettings,
          });
        }
      }
      setPreferencesHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [initialPersisted, initialPersistedRead, initialProviderSettingsRef]);

  useEffect(() => {
    if (!preferencesHydrated) return;
    writePersistedDemoSettings(preferenceStorage, preferenceStorageKey, {
      version: 1,
      mode,
      locale,
      layout,
      rendererSettings,
    });
  }, [
    layout,
    locale,
    mode,
    preferenceStorage,
    preferenceStorageKey,
    preferencesHydrated,
    rendererSettings,
  ]);

  const setQueryOption = useCallback(
    <T extends boolean | DemoTab>(
      key: DemoQueryKey,
      value: T,
      defaultValue: T
    ) => {
      writeDemoQueryValue(
        window.location,
        window.history,
        key,
        value,
        defaultValue
      );
    },
    []
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.dataset.mode = mode;
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';

    return () => {
      document.documentElement.classList.remove('dark');
      delete document.documentElement.dataset.mode;
      document.documentElement.removeAttribute('dir');
    };
  }, [dark, mode, rtl]);

  const updateModels = useCallback((example: ExampleDescription) => {
    setModels({
      data: stringifyEditorValue(example.data),
      schema: stringifyEditorValue(example.schema),
      uischema: stringifyEditorValue(example.uischema),
      uischemas: stringifyEditorValue(example.uischemas),
      i18n: stringifyEditorValue(example.i18n),
      config: stringifyEditorValue(example.config),
    });
  }, []);

  const loadExample = useCallback(
    (index: number, resetActiveTab = true) => {
      const example = examples[index];
      setIndex(index);
      setExampleProps(getProps(example, cells, renderers));
      updateModels(example);
      if (resetActiveTab) setActiveTab('demo');
      setIsHome(false);
    },
    [cells, examples, renderers, updateModels]
  );

  useEffect(() => {
    const syncRoute = () => {
      const route = routeFromLocation(examples);
      const query = readDemoQueryState(window.location, queryDefaults);
      setReadonly(query.readonly);
      setFormOnly(query.formOnly);
      setActiveTab(query.activeTab);
      setUseWebComponent(query.useWebComponent);
      setSidebarOpen(query.drawer);
      if (route.isHome) {
        setIsHome(true);
      } else {
        loadExample(route.index, false);
        setActiveTab(query.activeTab);
      }
    };
    window.addEventListener('hashchange', syncRoute);
    window.addEventListener('popstate', syncRoute);
    return () => {
      window.removeEventListener('hashchange', syncRoute);
      window.removeEventListener('popstate', syncRoute);
    };
  }, [examples, loadExample, queryDefaults]);

  const changeExample = (exampleName: string) => {
    const index = examples.findIndex((example) => example.name === exampleName);
    if (index === -1) return;
    loadExample(index);
    setQueryOption('active-tab', 'demo', 'demo');
    const currentHash = splitDemoHash(window.location.hash);
    if (currentHash.route !== exampleName) {
      window.location.hash = `${encodeDemoHashRoute(exampleName)}${
        currentHash.query ? `?${currentHash.query}` : ''
      }`;
    }
    if (!window.matchMedia('(min-width: 1280px)').matches) {
      setSidebarOpen(false);
      setQueryOption('drawer', false, defaultDrawer);
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

  const changeActiveTab = (value: DemoTab) => {
    setActiveTab(value);
    setQueryOption('active-tab', value, 'demo');
  };

  const changeReadonly = (value: boolean) => {
    setReadonly(value);
    setQueryOption('read-only', value, false);
  };

  useEffect(() => {
    if (layout === 'demo-and-data' && activeTab === 'data') {
      setActiveTab('demo');
      setQueryOption('active-tab', 'demo', 'demo');
    }
  }, [activeTab, layout, setQueryOption]);

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
        ...configOptions,
      },
      readonly,
      validationMode,
      i18n: {
        ...(exampleProps.i18n ?? {}),
        locale,
      },
    }),
    [configOptions, exampleProps, locale, readonly, validationMode]
  );

  const setConfigOption = (key: string, value: unknown) =>
    setConfigOptions((current) => ({ ...current, [key]: value }));

  const setData = useCallback((data: unknown) => {
    setExampleProps((oldProps) => ({ ...oldProps, data }));
    setModels((oldModels) => ({
      ...oldModels,
      data: stringifyEditorValue(data),
    }));
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
      {UiSegmentedControl ? (
        <UiSegmentedControl
          label='Mode'
          value={mode}
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
          onChange={(value) => setMode(value as DemoMode)}
        />
      ) : (
        <div className='demo-setting-field'>
          <span className='demo-setting-label'>Mode</span>
          <div className='demo-segmented-control'>
            {(['system', 'light', 'dark'] as const).map((value) => (
              <UiButton
                key={value}
                active={mode === value}
                onClick={() => setMode(value)}
              >
                {value === 'system' ? (
                  <LaptopMinimalCheck aria-hidden='true' />
                ) : value === 'light' ? (
                  <Sun aria-hidden='true' />
                ) : (
                  <Moon aria-hidden='true' />
                )}
                {value[0].toUpperCase() + value.slice(1)}
              </UiButton>
            ))}
          </div>
        </div>
      )}
      {UiSegmentedControl ? (
        <UiSegmentedControl
          label='Direction'
          value={rtl ? 'rtl' : 'ltr'}
          options={[
            { value: 'ltr', label: 'LTR' },
            { value: 'rtl', label: 'RTL' },
          ]}
          onChange={(value) => setRtl(value === 'rtl')}
        />
      ) : (
        <div className='demo-setting-field'>
          <span className='demo-setting-label'>Direction</span>
          <div className='demo-segmented-control'>
            <UiButton active={!rtl} onClick={() => setRtl(false)}>
              LTR
            </UiButton>
            <UiButton active={rtl} onClick={() => setRtl(true)}>
              RTL
            </UiButton>
          </div>
        </div>
      )}
      {UiDivider ? <UiDivider /> : <div className='demo-settings-separator' />}
      <UiSelect
        label='Locale'
        value={locale}
        options={[
          { value: 'en', label: 'English' },
          { value: 'de', label: 'German' },
          { value: 'bg', label: 'Bulgarian' },
          { value: navigator.language, label: 'Browser language' },
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
      <UiSelect
        label='Demo Layout'
        value={layout}
        options={[
          { value: 'default', label: 'Default' },
          { value: 'demo-and-data', label: 'Demo and Data' },
        ]}
        onChange={(value) => setLayout(value as DemoLayout)}
      />
      {UiDivider ? <UiDivider /> : <div className='demo-settings-separator' />}
      <UiTypography component='h3' className='demo-settings-section-title'>
        Options
      </UiTypography>
      <UiToggle
        checked={Boolean(configOptions.hideRequiredAsterisk)}
        label='Hide Required Asterisk'
        description='Hide asterisks in labels for required fields.'
        onChange={(value) => setConfigOption('hideRequiredAsterisk', value)}
      />
      <UiToggle
        checked={Boolean(configOptions.showUnfocusedDescription)}
        label='Show Unfocused Description'
        description='Keep input descriptions visible while controls are unfocused.'
        onChange={(value) => setConfigOption('showUnfocusedDescription', value)}
      />
      <UiToggle
        checked={Boolean(configOptions.restrict)}
        label='Restrict'
        description='Enforce schema length and array size restrictions.'
        onChange={(value) => setConfigOption('restrict', value)}
      />
      <UiToggle
        checked={readonly}
        label='Read-Only'
        description='Set all controls to read-only.'
        onChange={changeReadonly}
      />
      <UiToggle
        checked={Boolean(configOptions.collapseNewItems)}
        label='Collapse new array items'
        description='Do not expand newly added array items.'
        onChange={(value) => setConfigOption('collapseNewItems', value)}
      />
      <UiToggle
        checked={Boolean(configOptions.hideArraySummaryValidation)}
        label='Hide array summary validation'
        description='Hide validation summaries in array headers.'
        onChange={(value) =>
          setConfigOption('hideArraySummaryValidation', value)
        }
      />
      <UiToggle
        checked={Boolean(configOptions.initCollapsed)}
        label='Collapse arrays initially'
        description='Start array accordions collapsed.'
        onChange={(value) => setConfigOption('initCollapsed', value)}
      />
      <UiToggle
        checked={Boolean(configOptions.hideAvatar)}
        label='Hide Array Item Avatar'
        description='Hide array index avatars.'
        onChange={(value) => setConfigOption('hideAvatar', value)}
      />
      <UiToggle
        checked={Boolean(configOptions.enableFilterErrorsBeforeTouch)}
        label='Enable Filter Errors Before Touch'
        description='Hide selected validation errors until a control is touched.'
        onChange={(value) =>
          setConfigOption('enableFilterErrorsBeforeTouch', value)
        }
      />
      <UiTextInput
        label='Filter Error Keywords Before Touch'
        value={(configOptions.filterErrorKeywordsBeforeTouch ?? []).join(', ')}
        placeholder='required, minLength'
        description='Separate AJV keywords with commas.'
        onChange={(value) =>
          setConfigOption(
            'filterErrorKeywordsBeforeTouch',
            value
              .split(',')
              .map((keyword) => keyword.trim())
              .filter(Boolean)
          )
        }
      />
      <UiToggle
        checked={Boolean(configOptions.allowAdditionalPropertiesIfMissing)}
        label='Allow Additional Properties By Default'
        description='Allow properties when the schema does not explicitly configure them.'
        onChange={(value) =>
          setConfigOption('allowAdditionalPropertiesIfMissing', value)
        }
      />
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
      <UiTypography component='p' className='demo-home-eyebrow'>
        JSON Forms renderer set
      </UiTypography>
      <UiTypography component='h1'>
        Welcome to JSON Forms React {rendererName}
      </UiTypography>
      <UiTypography component='p' className='demo-home-tagline'>
        More Forms. Less Code.
      </UiTypography>
      <UiButton onClick={() => changeExample(examples[0].name)}>
        Open Demo
      </UiButton>
    </section>
  ) : (
    <section className={formOnly ? 'workspace form-only' : 'workspace'}>
      {!formOnly && (
        <div className='workspace-title'>
          <UiTypography component='h1'>{currentExample.label}</UiTypography>
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
                'i18n',
                'config',
                'data',
              ] as const
            )
              .filter((tab) => layout !== 'demo-and-data' || tab !== 'data')
              .map((tab) => ({
                value: tab,
                label:
                  tab === 'demo'
                    ? `${
                        layout === 'demo-and-data' ? 'Demo and Data' : 'Demo'
                      }${errors.length ? ` (${errors.length})` : ''}`
                    : tab === 'uischema'
                    ? 'UI Schema'
                    : tab === 'uischemas'
                    ? 'UI Schemas'
                    : tab === 'i18n'
                    ? 'Internationalization'
                    : tab[0].toUpperCase() + tab.slice(1),
              }))}
            onChange={(value) => changeActiveTab(value as DemoTab)}
          />

          {activeTab === 'demo' ? (
            <UiPanel className='panel'>
              <div className='jsonform-toolbar'>
                <UiTypography component='h2'>JSON Forms</UiTypography>
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
              {layout === 'demo-and-data' ? (
                <UiSplitter
                  form={
                    <section className='demo-data-pane demo-form-pane'>
                      <UiTypography component='h3'>Demo</UiTypography>
                      <UiPanel className='form-card'>{renderForm()}</UiPanel>
                    </section>
                  }
                  data={
                    <section className='demo-data-pane demo-editor-pane'>
                      <div className='editor-heading'>
                        <UiTypography component='h3'>Data</UiTypography>
                        <div className='action-row'>
                          <UiButton
                            ariaLabel='Reload original example data'
                            iconOnly
                            tooltip='Reload original example data'
                            onClick={() =>
                              setModels((current) =>
                                reloadOriginalEditorModel(
                                  current,
                                  'data',
                                  currentExample.data
                                )
                              )
                            }
                          >
                            <RotateCcw aria-hidden='true' />
                            <span className='sr-only'>
                              Reload original example data
                            </span>
                          </UiButton>
                          <UiButton
                            ariaLabel='Apply data changes'
                            iconOnly
                            tooltip='Apply data changes'
                            onClick={() =>
                              setData(parseEditorValue(models.data))
                            }
                          >
                            <Save aria-hidden='true' />
                            <span className='sr-only'>Apply data changes</span>
                          </UiButton>
                        </div>
                      </div>
                      <div className='data-editor-frame'>
                        <Editor
                          height='calc(100vh - 19rem)'
                          defaultLanguage='json'
                          theme={dark ? 'vs-dark' : 'light'}
                          value={models.data}
                          onChange={(value) =>
                            setModels((current) => ({
                              ...current,
                              data: value ?? '',
                            }))
                          }
                        />
                      </div>
                    </section>
                  }
                />
              ) : (
                <UiPanel className='form-card'>{renderForm()}</UiPanel>
              )}
            </UiPanel>
          ) : (
            <UiPanel className='editor-panel panel'>
              <div className='editor-heading'>
                <UiTypography component='h2'>{activeTab}</UiTypography>
                <div className='action-row'>
                  <UiButton
                    ariaLabel='Reload original example value'
                    iconOnly
                    tooltip='Reload original example value'
                    onClick={() =>
                      setModels((oldModels) =>
                        reloadOriginalEditorModel(
                          oldModels,
                          activeTab,
                          currentExample[activeTab]
                        )
                      )
                    }
                  >
                    <RotateCcw aria-hidden='true' />
                    <span className='sr-only'>
                      Reload original example value
                    </span>
                  </UiButton>
                  <UiButton
                    ariaLabel='Apply editor changes'
                    iconOnly
                    tooltip='Apply editor changes'
                    onClick={() =>
                      setExampleProps((oldProps) => ({
                        ...oldProps,
                        [activeTab]: parseEditorValue(models[activeTab]),
                      }))
                    }
                  >
                    <Save aria-hidden='true' />
                    <span className='sr-only'>Apply editor changes</span>
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
      onToggleSidebar={() => {
        const value = !sidebarOpen;
        setSidebarOpen(value);
        setQueryOption('drawer', value, defaultDrawer);
      }}
      onToggleFormOnly={() => {
        const value = !formOnly;
        setFormOnly(value);
        setQueryOption('form-only', value, false);
      }}
      onToggleWebComponent={() => {
        const value = !useWebComponent;
        setUseWebComponent(value);
        setQueryOption('use-webcomponent', value, false);
      }}
      onOpenSettings={() => setSettingsOpen(true)}
      onCloseSettings={() => setSettingsOpen(false)}
    >
      {content}
    </Shell>
  );
};

export default App;
