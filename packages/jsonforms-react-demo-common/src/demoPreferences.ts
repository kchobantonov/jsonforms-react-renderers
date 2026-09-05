export type DemoMode = 'system' | 'light' | 'dark';
export type DemoLayout = 'default' | 'demo-and-data';
export type DemoTab =
  | 'demo'
  | 'schema'
  | 'uischema'
  | 'uischemas'
  | 'i18n'
  | 'config'
  | 'data';

export interface DemoSettingsStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem?(key: string): void | Promise<void>;
}

export interface PersistedDemoSettings {
  version: 1;
  mode: DemoMode;
  locale: string;
  layout: DemoLayout;
  rendererSettings: Record<string, unknown>;
}

export interface DemoQueryState {
  readonly: boolean;
  formOnly: boolean;
  activeTab: DemoTab;
  useWebComponent: boolean;
  drawer: boolean;
}

type LocationLike = Pick<Location, 'hash' | 'pathname' | 'search'>;
type HistoryLike = Pick<History, 'replaceState'>;

const TAB_FROM_QUERY: Record<string, DemoTab> = {
  demo: 'demo',
  schema: 'schema',
  uiSchema: 'uischema',
  uischema: 'uischema',
  uiSchemas: 'uischemas',
  uischemas: 'uischemas',
  internationalization: 'i18n',
  i18n: 'i18n',
  config: 'config',
  data: 'data',
};

const TAB_TO_QUERY: Record<DemoTab, string> = {
  demo: 'demo',
  schema: 'schema',
  uischema: 'uiSchema',
  uischemas: 'uiSchemas',
  i18n: 'internationalization',
  config: 'config',
  data: 'data',
};

const isPromise = <T>(value: T | Promise<T>): value is Promise<T> =>
  typeof (value as Promise<T> | undefined)?.then === 'function';

const parseStoredSettings = (value: string | null) => {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as Partial<PersistedDemoSettings>;
    if (!parsed || parsed.version !== 1) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
};

export const readPersistedDemoSettings = (
  storage: DemoSettingsStorage | undefined,
  key: string
):
  | Partial<PersistedDemoSettings>
  | undefined
  | Promise<Partial<PersistedDemoSettings> | undefined> => {
  if (!storage) return undefined;
  try {
    const stored = storage.getItem(key);
    return isPromise(stored)
      ? stored.then(parseStoredSettings).catch(() => undefined)
      : parseStoredSettings(stored);
  } catch {
    return undefined;
  }
};

export const writePersistedDemoSettings = (
  storage: DemoSettingsStorage | undefined,
  key: string,
  settings: PersistedDemoSettings
) => {
  if (!storage) return;
  try {
    const result = storage.setItem(key, JSON.stringify(settings));
    if (isPromise(result)) void result.catch(() => undefined);
  } catch {
    // Persistence is optional; storage failures must not break the demo.
  }
};

export const getWebDemoSettingsStorage = ():
  | DemoSettingsStorage
  | undefined => {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
};

export const demoSettingsStorageKey = (rendererName: string) =>
  `jsonforms-react-demo:${rendererName
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, '-')}:settings`;

const decodeDemoHashRoute = (route: string) => {
  try {
    return decodeURIComponent(route);
  } catch {
    return route;
  }
};

export const encodeDemoHashRoute = (route: string) => encodeURIComponent(route);

export const splitDemoHash = (hash: string) => {
  const [route = '', query = ''] = hash.replace(/^#/, '').split('?');
  return { route: decodeDemoHashRoute(route), query };
};

const combinedSearchParams = (location: LocationLike) => {
  const params = new URLSearchParams(location.search);
  const hashParams = new URLSearchParams(splitDemoHash(location.hash).query);
  hashParams.forEach((value, key) => params.set(key, value));
  return params;
};

const booleanParam = (
  params: URLSearchParams,
  key: string,
  fallback: boolean
) => (params.has(key) ? params.get(key) === 'true' : fallback);

export const readDemoQueryState = (
  location: LocationLike,
  defaults: DemoQueryState
): DemoQueryState => {
  const params = combinedSearchParams(location);
  return {
    readonly: booleanParam(params, 'read-only', defaults.readonly),
    formOnly: booleanParam(params, 'form-only', defaults.formOnly),
    activeTab:
      TAB_FROM_QUERY[params.get('active-tab') ?? ''] ?? defaults.activeTab,
    useWebComponent: booleanParam(
      params,
      'use-webcomponent',
      defaults.useWebComponent
    ),
    drawer: booleanParam(params, 'drawer', defaults.drawer),
  };
};

export type DemoQueryKey =
  | 'read-only'
  | 'form-only'
  | 'active-tab'
  | 'use-webcomponent'
  | 'drawer';

export const writeDemoQueryValue = (
  location: LocationLike,
  history: HistoryLike,
  key: DemoQueryKey,
  value: boolean | DemoTab,
  defaultValue: boolean | DemoTab
) => {
  const { route, query } = splitDemoHash(location.hash);
  const params = new URLSearchParams(query);
  const searchParams = new URLSearchParams(location.search);
  // Query parameters in the regular URL are accepted as input for parity with
  // non-hash routers. Once a setting changes, keep one canonical hash value.
  searchParams.delete(key);
  if (value === defaultValue) {
    params.delete(key);
  } else {
    params.set(
      key,
      key === 'active-tab' ? TAB_TO_QUERY[value as DemoTab] : String(value)
    );
  }
  const queryString = params.toString();
  const searchString = searchParams.toString();
  const encodedRoute = encodeDemoHashRoute(route);
  const hash = `${encodedRoute}${queryString ? `?${queryString}` : ''}`;
  const search = searchString ? `?${searchString}` : '';
  history.replaceState(
    {},
    '',
    `${location.pathname}${search}${hash ? `#${hash}` : ''}`
  );
};
