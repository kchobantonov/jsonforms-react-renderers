import { useEffect, useState } from 'react';
import type { ExampleDescription } from '@jsonforms/examples';
import {
  type DemoLayout,
  type DemoTab,
  type DemoQueryKey,
  encodeDemoHashRoute,
  readDemoQueryState,
  splitDemoHash,
  writeDemoQueryValue,
} from './demoPreferences';
export const routeFromLocation = (examples: ExampleDescription[]) => {
  const hash = splitDemoHash(window.location.hash).route;
  const index = examples.findIndex((example) => example.name === hash);
  return { index: index === -1 ? 0 : index, isHome: index === -1 };
};

const setQueryOption = <T extends boolean | DemoTab>(
  key: DemoQueryKey,
  value: T,
  defaultValue: T,
) => {
  writeDemoQueryValue(
    window.location,
    window.history,
    key,
    value,
    defaultValue,
  );
};

export function useDemoNavigation(
  examples: ExampleDescription[],
  initialRoute: ReturnType<typeof routeFromLocation>,
  loadExample: (index: number) => void,
  layout: DemoLayout,
) {
  const [defaultDrawer] = useState(
    () => window.matchMedia('(min-width: 1280px)').matches,
  );
  const [queryDefaults] = useState(() => ({
    readonly: false,
    formOnly: false,
    activeTab: 'demo' as DemoTab,
    useWebComponent: false,
    drawer: defaultDrawer,
  }));
  const [initialQuery] = useState(() =>
    readDemoQueryState(window.location, queryDefaults),
  );
  const [currentIndex, setIndex] = useState(initialRoute.index);
  const [isHome, setIsHome] = useState(initialRoute.isHome);
  const [activeTab, setActiveTab] = useState<DemoTab>(initialQuery.activeTab);
  const [sidebarOpen, setSidebarOpen] = useState(initialQuery.drawer);
  const [formOnly, setFormOnly] = useState(initialQuery.formOnly);
  const [useWebComponent, setUseWebComponent] = useState(
    initialQuery.useWebComponent,
  );
  const [readonly, setReadonly] = useState(initialQuery.readonly);
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
        setIndex(route.index);
        setIsHome(false);
        loadExample(route.index);
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
    setIndex(index);
    setIsHome(false);
    setActiveTab('demo');
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
      `${window.location.pathname}${window.location.search}`,
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

  const currentExample = examples[currentIndex];
  useEffect(() => {
    if (
      (layout === 'demo-and-data' && activeTab === 'data') ||
      (activeTab === 'external' && !(currentExample as any).configuration)
    ) {
      // eslint-disable-next-line react/set-state-in-effect -- Keep tab state and the browser URL synchronized when the externally restored layout hides the data tab.
      setActiveTab('demo');
      setQueryOption('active-tab', 'demo', 'demo');
    }
  }, [activeTab, layout, currentExample]);

  const toggleSidebar = () => {
    const value = !sidebarOpen;
    setSidebarOpen(value);
    setQueryOption('drawer', value, defaultDrawer);
  };
  const toggleFormOnly = () => {
    const value = !formOnly;
    setFormOnly(value);
    setQueryOption('form-only', value, false);
  };
  const toggleWebComponent = () => {
    const value = !useWebComponent;
    setUseWebComponent(value);
    setQueryOption('use-webcomponent', value, false);
  };
  return {
    currentIndex,
    currentExample,
    isHome,
    activeTab,
    sidebarOpen,
    formOnly,
    useWebComponent,
    readonly,
    goHome,
    changeExample,
    changeActiveTab,
    changeReadonly,
    toggleSidebar,
    toggleFormOnly,
    toggleWebComponent,
  };
}
