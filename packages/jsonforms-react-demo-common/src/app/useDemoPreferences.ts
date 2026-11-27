import { useEffect, useMemo, useState } from 'react';
import {
  type DemoMode,
  type DemoLayout,
  type DemoSettingsStorage,
  type PersistedDemoSettings,
  isPromise,
  writePersistedDemoSettings,
  demoSettingsStorageKey,
  getWebDemoSettingsStorage,
  readPersistedDemoSettings,
} from './demoPreferences';

type PersistedPreferences = Omit<PersistedDemoSettings, 'version'>;

/**
 * Writes the preferences back, once they have been read.
 *
 * `hydrated` is the guard that matters: writing before the stored values have
 * been read would persist the defaults over whatever the user had chosen, and
 * the read is asynchronous.
 */
const useDemoPreferencePersistence = (
  storage: DemoSettingsStorage | undefined,
  storageKey: string,
  hydrated: boolean,
  { mode, locale, layout, rendererSettings }: PersistedPreferences,
): void => {
  useEffect(() => {
    if (!hydrated) {
      return;
    }
    writePersistedDemoSettings(storage, storageKey, {
      version: 1,
      mode,
      locale,
      layout,
      rendererSettings,
    });
  }, [storage, storageKey, hydrated, mode, locale, layout, rendererSettings]);
};

const isMode = (mode: unknown): mode is DemoMode =>
  mode === 'system' || mode === 'light' || mode === 'dark';
const isLayout = (layout: unknown): layout is DemoLayout =>
  layout === 'default' || layout === 'demo-and-data';

const isRendererSettings = (
  settings: unknown,
): settings is Record<string, unknown> =>
  settings !== null && typeof settings === 'object' && !Array.isArray(settings);

export function useDemoPreferences({
  rendererName,
  initialLayout,
  initialProviderSettings,
  settingsStorage,
  settingsStorageKey,
}: {
  rendererName: string;
  initialLayout: DemoLayout;
  initialProviderSettings: Record<string, unknown>;
  settingsStorage?: DemoSettingsStorage | null;
  settingsStorageKey?: string;
}) {
  const [initialSettings] = useState(() => initialProviderSettings);
  const preferenceStorage = useMemo(
    () =>
      settingsStorage === undefined
        ? getWebDemoSettingsStorage()
        : (settingsStorage ?? undefined),
    [settingsStorage],
  );
  const preferenceStorageKey =
    settingsStorageKey ?? demoSettingsStorageKey(rendererName);
  const initialPersistedRead = useMemo(
    () => readPersistedDemoSettings(preferenceStorage, preferenceStorageKey),
    [preferenceStorage, preferenceStorageKey],
  );
  const initialPersisted = isPromise(initialPersistedRead)
    ? undefined
    : initialPersistedRead;
  const [mode, setMode] = useState<DemoMode>(
    isMode(initialPersisted?.mode) ? initialPersisted.mode : 'system',
  );
  const [locale, setLocale] = useState(
    typeof initialPersisted?.locale === 'string'
      ? initialPersisted.locale
      : 'en',
  );
  const [layout, setLayout] = useState<DemoLayout>(
    isLayout(initialPersisted?.layout)
      ? initialPersisted.layout
      : initialLayout,
  );
  const [rendererSettings, setRendererSettings] = useState<Record<string, any>>(
    {
      ...initialSettings,
      ...initialPersisted?.rendererSettings,
    },
  );
  const [preferencesHydrated, setPreferencesHydrated] = useState(
    !isPromise(initialPersistedRead),
  );
  useEffect(() => {
    let cancelled = false;
    Promise.resolve(initialPersistedRead).then((persisted) => {
      if (cancelled || initialPersisted !== undefined) return;
      if (persisted) {
        if (isMode(persisted.mode)) {
          setMode(persisted.mode);
        }
        if (typeof persisted.locale === 'string') setLocale(persisted.locale);
        if (isLayout(persisted.layout)) {
          setLayout(persisted.layout);
        }
        if (isRendererSettings(persisted.rendererSettings)) {
          setRendererSettings({
            ...initialSettings,
            ...persisted.rendererSettings,
          });
        }
      }
      setPreferencesHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [initialPersisted, initialPersistedRead, initialSettings]);

  useDemoPreferencePersistence(
    preferenceStorage,
    preferenceStorageKey,
    preferencesHydrated,
    { mode, locale, layout, rendererSettings },
  );

  return {
    mode,
    setMode,
    locale,
    setLocale,
    layout,
    setLayout,
    rendererSettings,
    setRendererSettings,
  };
}
