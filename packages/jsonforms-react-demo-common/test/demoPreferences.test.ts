import { describe, expect, it, vi } from 'vitest';
import {
  demoSettingsStorageKey,
  encodeDemoHashRoute,
  readDemoQueryState,
  readPersistedDemoSettings,
  splitDemoHash,
  writeDemoQueryValue,
  writePersistedDemoSettings,
} from '../src/demoPreferences';

const defaults = {
  readonly: false,
  formOnly: false,
  activeTab: 'demo' as const,
  useWebComponent: false,
  drawer: true,
};

describe('demo preferences', () => {
  it('reads regular and hash query parameters with hash values taking precedence', () => {
    expect(
      readDemoQueryState(
        {
          pathname: '/demo',
          search: '?read-only=true&active-tab=schema&drawer=false',
          hash: '#mixed?active-tab=uiSchemas&use-webcomponent=true',
        },
        defaults
      )
    ).toEqual({
      readonly: true,
      formOnly: false,
      activeTab: 'uischemas',
      useWebComponent: true,
      drawer: false,
    });
  });

  it('writes canonical Svelte-compatible hash query values', () => {
    const replaceState = vi.fn();
    writeDemoQueryValue(
      {
        pathname: '/demo',
        search: '?form-only=true&unrelated=kept',
        hash: '#mixed?read-only=true',
      },
      { replaceState },
      'active-tab',
      'i18n',
      'demo'
    );

    expect(replaceState).toHaveBeenCalledWith(
      {},
      '',
      '/demo?form-only=true&unrelated=kept#mixed?read-only=true&active-tab=internationalization'
    );
  });

  it('removes a standard query duplicate when that option changes', () => {
    const replaceState = vi.fn();
    writeDemoQueryValue(
      {
        pathname: '/demo',
        search: '?form-only=true&unrelated=kept',
        hash: '#mixed',
      },
      { replaceState },
      'form-only',
      false,
      false
    );

    expect(replaceState).toHaveBeenCalledWith(
      {},
      '',
      '/demo?unrelated=kept#mixed'
    );
  });

  it('reads and writes settings through a synchronous platform adapter', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    const settings = {
      version: 1 as const,
      mode: 'dark' as const,
      locale: 'de',
      layout: 'demo-and-data' as const,
      rendererSettings: { size: 'compact' },
    };

    writePersistedDemoSettings(storage, 'settings', settings);
    expect(readPersistedDemoSettings(storage, 'settings')).toEqual(settings);
  });

  it('supports asynchronous native-style storage adapters and ignores corrupt data', async () => {
    const storage = {
      getItem: vi
        .fn()
        .mockResolvedValueOnce('{not json')
        .mockResolvedValueOnce(
          JSON.stringify({
            version: 1,
            mode: 'light',
            locale: 'bg',
            layout: 'default',
            rendererSettings: {},
          })
        ),
      setItem: vi.fn().mockResolvedValue(undefined),
    };

    expect(
      await readPersistedDemoSettings(storage, 'settings')
    ).toBeUndefined();
    expect(await readPersistedDemoSettings(storage, 'settings')).toMatchObject({
      mode: 'light',
      locale: 'bg',
    });
  });

  it('keeps renderer keys stable and separates hash routes from their query', () => {
    expect(demoSettingsStorageKey('Ant Design')).toBe(
      'jsonforms-react-demo:ant-design:settings'
    );
    expect(splitDemoHash('#additional-properties?form-only=true')).toEqual({
      route: 'additional-properties',
      query: 'form-only=true',
    });
  });

  it('round-trips example routes containing spaces', () => {
    expect(encodeDemoHashRoute('Readonly Fields')).toBe('Readonly%20Fields');
    expect(splitDemoHash('#Readonly%20Fields')).toEqual({
      route: 'Readonly Fields',
      query: '',
    });
  });

  it('preserves an encoded example route while changing query state', () => {
    const replaceState = vi.fn();
    writeDemoQueryValue(
      {
        pathname: '/demo',
        search: '',
        hash: '#Readonly%20Fields',
      },
      { replaceState },
      'read-only',
      true,
      false
    );

    expect(replaceState).toHaveBeenCalledWith(
      {},
      '',
      '/demo#Readonly%20Fields?read-only=true'
    );
  });
});
