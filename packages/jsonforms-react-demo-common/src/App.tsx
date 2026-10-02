import { isSpecExample, isPrefixedOfficialExample } from './examples';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  createFormsAjv,
  createAdditionalErrorStore,
  createAjvErrorTranslator,
  ActionEvent,
} from '@chobantonov/jsonforms-react-extended-renderers';
import { ajvLocalizers } from '@chobantonov/jsonforms-react-extended-renderers/ajv-localizers';
import type { JsonFormsI18nState } from '@jsonforms/core';
import { ExampleDescription } from '@jsonforms/examples';
import {
  TranslationCatalogs,
  exampleTranslations,
  i18nEditorValue,
  translatorFor,
} from './i18nCatalogs';
import {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  ValidationMode,
} from '@jsonforms/core';
import { DemoFormPanel } from './app/DemoFormPanel';
import { DemoHome } from './app/DemoHome';
import { useMonacoSchema } from './app/useMonacoSchema';
import {
  useDemoPreferencePersistence,
  useDocumentChrome,
} from './app/useDemoChrome';
import { DemoWorkspace } from './app/DemoWorkspace';
import { DemoSettingsPanel } from './app/DemoSettings';
import { EditorModels, stringifyEditorValue } from './editorModels';
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
} from './demoPreferences';
import './App.css';

export * from './app/types';
import type { DemoShell, DemoUi, ProviderSettingsProps } from './app/types';

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

export { WebComponentHost } from './app/WebComponentHost';
export { defaultDemoUi } from './app/defaultUi';
export { DefaultDemoShell } from './app/DefaultDemoShell';
import { defaultDemoUi } from './app/defaultUi';
import { DefaultDemoShell } from './app/DefaultDemoShell';

/**
 * The validator the spec examples are written against.
 *
 * One instance for the whole demo: Ajv caches compiled schemas, and a fresh
 * one per render would recompile on every keystroke.
 *
 * The `temporal-controls` fixture needs it specifically. Its `$data` bound is
 * rejected by JSON Forms' plain `createAjv()` at **compile** time - "formatMinimum
 * value must be [\"string\"]" - which is thrown inside `coreReducer` while the
 * store initialises, so the whole demo fails to mount rather than the one
 * example misbehaving.
 */
/**
 * What the validator is told about the form's language.
 *
 * A module-level cell rather than a prop, because `demoAjv` is created once
 * (Ajv caches compiled schemas, and a fresh instance per render would
 * recompile on every keystroke) while the locale changes many times. The
 * factory reads it through a getter at validation time, so a locale switch
 * needs no new validator - and JSON Forms revalidates on an i18n change, so
 * the messages follow immediately.
 */
let demoI18n: JsonFormsI18nState | undefined;

/**
 * Whether the example on screen has granted script evaluation.
 *
 * Same arrangement as `demoI18n`, and for the same reason: the permission is a
 * property of a *form's* config, and one validator serves every example. Read
 * when a schema compiles, which is after this is assigned below.
 */
let demoAllowScriptEvaluation = false;

const demoAjv = createFormsAjv({
  i18n: () => demoI18n,
  allowScriptEvaluation: () => demoAllowScriptEvaluation,
  /*
    Deliberately **not** `localizers`. Ajv's own messages are localized at
    render time instead, through `demoErrorTranslator` below: core does not
    revalidate when the locale changes, so translating during validation would
    leave the previous language on screen until the data happened to change.
  */
});

/**
 * Ajv's own wording, localized when an error is rendered.
 *
 * The demo carries every language `ajv-i18n` ships, being an application
 * rather than a distributable; a shipped bundle should pass only what it
 * ships. Reads the locale through the same cell as the validator.
 */
const demoErrorTranslator = createAjvErrorTranslator(
  ajvLocalizers,
  () => demoI18n?.locale
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
    i18n: stringifyEditorValue(i18nEditorValue(examples[initialRoute.index])),
    config: stringifyEditorValue(examples[initialRoute.index].config),
  });
  useMonacoSchema(models.schema);

  const [activeTab, setActiveTab] = useState<DemoTab>(initialQuery.activeTab);
  const [search, setSearch] = useState('');
  const [exampleSource, setExampleSource] = useState(() =>
    examples.some((e) => isSpecExample(e.name)) ? 'spec' : 'all'
  );
  const ExampleSourceSelect = Ui.Select;
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
  // Catalogs live outside `exampleProps.i18n` because `translate` is a function:
  // it cannot be serialized for the editor, and it cannot follow the locale
  // switcher. Holding the raw catalogs lets both work.
  const [translations, setTranslations] = useState<
    TranslationCatalogs | undefined
  >(() => exampleTranslations(examples[initialRoute.index]));
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

  useDemoPreferencePersistence(
    preferenceStorage,
    preferenceStorageKey,
    preferencesHydrated,
    { mode, locale, layout, rendererSettings }
  );

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

  useDocumentChrome(dark, mode, rtl);

  const updateModels = useCallback((example: ExampleDescription) => {
    setModels({
      data: stringifyEditorValue(example.data),
      schema: stringifyEditorValue(example.schema),
      uischema: stringifyEditorValue(example.uischema),
      uischemas: stringifyEditorValue(example.uischemas),
      i18n: stringifyEditorValue(i18nEditorValue(example)),
      config: stringifyEditorValue(example.config),
    });
  }, []);

  const loadExample = useCallback(
    (index: number, resetActiveTab = true) => {
      const example = examples[index];
      setIndex(index);
      setExampleProps(getProps(example, cells, renderers));
      setTranslations(exampleTranslations(example));
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
    return examples
      .filter(
        (example) =>
          (exampleSource === 'all' ||
            (exampleSource === 'spec'
              ? isSpecExample(example.name)
              : isPrefixedOfficialExample(example.name))) &&
          example.label.toLowerCase().includes(needle)
      )
      .map(({ name, label }) => ({ name, label }));
  }, [examples, search, exampleSource]);

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
        ...(translations
          ? { locale, translate: translatorFor(translations, locale) }
          : { ...(exampleProps.i18n ?? {}), locale }),
        translateError: demoErrorTranslator,
      },
    }),
    [
      configOptions,
      exampleProps,
      locale,
      readonly,
      translations,
      validationMode,
    ]
  );

  /*
    Errors that are not the schema's: what a renderer publishes - the Monaco
    editor, when `propagateErrors` is on - and what the demo's `reportServer`
    action publishes to stand in for a rejected submit.

    One store per mounted demo, because it is delivered through middleware and
    a middleware belongs to one form.
  */
  const errorStore = useRef(createAdditionalErrorStore()).current;

  const setConfigOption = (key: string, value: unknown) =>
    setConfigOptions((current) => ({ ...current, [key]: value }));

  /**
   * What the form is actually using for an option.
   *
   * The example's own `config` is merged *under* these toggles, so an option
   * the example sets is in effect until the user touches the corresponding
   * switch. Reading only `configOptions` made a toggle sit at off while the
   * behaviour it names was on - and flipping it twice was the only way to make
   * the two agree.
   */
  /*
    The keyword list needs the same fallback for the same reason - an example
    that ships `filterErrorKeywordsBeforeTouch` would otherwise show an empty
    box while the form filtered on it.
  */
  const effectiveConfigOption = (key: string): boolean =>
    Boolean(
      configOptions[key] ??
        (exampleProps.config as Record<string, unknown> | undefined)?.[key]
    );

  const setData = useCallback((data: unknown) => {
    setExampleProps((oldProps) => ({ ...oldProps, data }));
    setModels((oldModels) => ({
      ...oldModels,
      data: stringifyEditorValue(data),
    }));
  }, []);

  /*
    The host's side of section 14's action path.

    A Button hands over an `ActionEvent` and awaits the result; what the
    command means is the application's business, not the renderer's. The one
    command understood here changes the form's language, which is the clearest
    demonstration that `params` carry the argument - `setLocale` with
    `{ "locale": "bg" }`, rather than one action per language.
  */
  const handleAction = useCallback(
    async (event: ActionEvent) => {
      const next = (event.params as { locale?: unknown } | undefined)?.locale;
      if (event.action === 'setLocale' && typeof next === 'string') {
        setLocale(next);
        return;
      }
      /*
      A deliberately slow command, so the button-actions example can show what
      section 14 asks for: pending covers the whole promise, and a second
      press while it is outstanding is refused.
    */
      if (event.action === 'slowExample') {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      /*
      Stands in for a submit the server rejected. A real host would publish
      whatever came back from it; the shape is the same, and so is everything
      after: the errors appear under the named fields, and each clears when
      that field is edited.
    */
      if (event.action === 'reportServer') {
        const reported = (event.params as { errors?: unknown } | undefined)
          ?.errors;
        errorStore.publish(
          'server',
          Array.isArray(reported) ? (reported as never[]) : []
        );
        return;
      }
      if (event.action === 'clearServer') {
        errorStore.clear('server');
        return;
      }
      setErrors((oldErrors) => [
        ...oldErrors,
        { message: `Action handled: ${event.label}` },
      ]);
    },
    [errorStore]
  );

  const renderForm = () => (
    <DemoFormPanel
      jsonFormsProps={jsonFormsProps}
      formKey={currentIndex}
      ajv={demoAjv}
      errorStore={errorStore}
      onAction={handleAction}
      setData={setData}
      setErrors={setErrors}
      Wrapper={Wrapper}
      webComponentTag={webComponentTag}
      useWebComponent={useWebComponent}
      dark={dark}
      mode={mode}
      rtl={rtl}
      locale={locale}
      validationMode={validationMode}
      rendererSettings={rendererSettings}
      onFormContext={(i18n, allowScriptEvaluation) => {
        demoI18n = i18n;
        demoAllowScriptEvaluation = allowScriptEvaluation;
      }}
    />
  );

  const settings = (
    <DemoSettingsPanel
      Ui={Ui}
      ProviderSettings={ProviderSettings}
      mode={mode}
      setMode={setMode}
      rtl={rtl}
      setRtl={setRtl}
      locale={locale}
      setLocale={setLocale}
      validationMode={validationMode}
      setValidationMode={setValidationMode}
      layout={layout}
      setLayout={setLayout}
      readonly={readonly}
      changeReadonly={changeReadonly}
      configOptions={configOptions}
      setConfigOption={setConfigOption}
      effectiveConfigOption={effectiveConfigOption}
      rendererSettings={rendererSettings}
      setRendererSettings={setRendererSettings}
      dark={dark}
      exampleConfig={exampleProps.config as Record<string, unknown> | undefined}
    />
  );

  const content = isHome ? (
    <DemoHome
      Ui={Ui}
      brand={brand}
      rendererName={rendererName}
      logoSrc={logoSrc}
      examples={examples}
      changeExample={changeExample}
    />
  ) : (
    <DemoWorkspace
      Ui={Ui}
      currentExample={currentExample}
      actions={actions}
      setExampleProps={setExampleProps}
      activeTab={activeTab}
      changeActiveTab={changeActiveTab}
      layout={layout}
      formOnly={formOnly}
      errors={errors}
      models={models}
      setModels={setModels}
      setTranslations={setTranslations}
      dark={dark}
      setData={setData}
      renderForm={renderForm}
    />
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
      exampleFilter={
        <ExampleSourceSelect
          label='Example source'
          value={exampleSource}
          options={[
            { value: 'spec', label: 'Spec examples' },
            { value: 'jsonforms', label: 'JSON Forms originals' },
            { value: 'all', label: 'All examples' },
          ]}
          onChange={setExampleSource}
        />
      }
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
