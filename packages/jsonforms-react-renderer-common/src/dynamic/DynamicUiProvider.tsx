import {
  createDynamicTreeResolver,
  hasDynamicTree,
  createDynamicChildrenMemo,
  dynamicPresentation,
  dynamicTreeAuthor,
} from './dynamicTree';
import {
  dynamicUiExpressionsReady,
  loadDynamicUiExpressions,
} from './dynamicRuntime';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  JsonFormsRendererRegistryEntry,
  JsonFormsCellRendererRegistryEntry,
  UISchemaElement,
} from '@jsonforms/core';
import {
  JsonForms,
  JsonFormsDispatch,
  DispatchCell,
  useJsonForms,
} from '@jsonforms/react';
import {
  createDynamicUiResolver,
  createDynamicUiCache,
  type DynamicUiCache,
  dynamicBoundValue,
  dynamicCellValue,
  dynamicItemAt,
  type DynamicUiOptions,
  type DynamicUiEnvironment,
  type DynamicUiResult,
} from './dynamicUi';

import { dynamicUiOptions } from './dynamicConfig';

export interface DynamicUiSettings extends DynamicUiOptions {
  onDiagnostic?: (diagnostic: {
    code: 'dynamic.invalid';
    path: string;
    message: string;
  }) => void;
}
const DynamicContext = createContext<DynamicUiSettings | undefined>(undefined);
const DynamicCacheContext = createContext<DynamicUiCache | undefined>(
  undefined,
);
const ExternalContext = createContext<
  Readonly<Record<string, unknown>> | undefined
>(undefined);
export const DynamicUiProvider = ({
  config,
  external,
  children,
  locale,
  translate,
}: React.PropsWithChildren<{
  config?: unknown;
  external?: Readonly<Record<string, unknown>>;
  locale?: string;
  translate?: (key: string, fallback?: string) => string | undefined;
}>) => {
  const cache = useMemo(createDynamicUiCache, []);
  const dynamic = dynamicUiOptions(config, external);
  const enabled = !!dynamic;
  const [ready, setReady] = useState(dynamicUiExpressionsReady);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!enabled || ready) return;
    let current = true;
    setFailed(false);
    loadDynamicUiExpressions().then(
      () => {
        if (current) setReady(true);
      },
      () => {
        if (current) setFailed(true);
      },
    );
    return () => {
      current = false;
    };
  }, [enabled, ready]);
  const pending = enabled && !ready;
  const [hasPresented, setHasPresented] = useState(() => !enabled || ready);
  useEffect(() => {
    if (!pending) setHasPresented(true);
  }, [pending]);
  const fallback = failed
    ? locale === 'bg'
      ? 'Зареждането на формуляра е неуспешно.'
      : 'Unable to load dynamic expressions.'
    : locale === 'bg'
      ? 'Зареждане на формуляра…'
      : 'Loading form…';
  return (
    <DynamicCacheContext.Provider value={cache}>
      <ExternalContext.Provider value={external}>
        <DynamicContext.Provider value={ready ? dynamic : undefined}>
          {pending && (hasPresented || failed) && (
            <p role={failed ? 'alert' : 'status'} data-dynamic-loading>
              {translate?.(
                failed ? 'dynamic.loadFailed' : 'dynamic.loading',
                fallback,
              ) ?? fallback}
            </p>
          )}
          <DynamicBoundary pending={pending}>
            {(!pending || hasPresented) && children}
          </DynamicBoundary>
        </DynamicContext.Provider>
      </ExternalContext.Provider>
    </DynamicCacheContext.Provider>
  );
};

/** Host-owned external values shared with template FormContext; no snapshot or writes. */
export const useDynamicExternal = () => useContext(ExternalContext);

// Stable identity uses the authored element; dispatch uses the effective presentation.
export const dynamicAuthoredElement = dynamicTreeAuthor;
const hasDynamic = (element: UISchemaElement) =>
  !!element &&
  Object.prototype.hasOwnProperty.call(
    dynamicAuthoredElement(element),
    '$dynamic',
  );

export function useDynamicResolution(path: string, cell = false) {
  const form = useJsonForms();
  const cache = useContext(DynamicCacheContext);
  const dynamic = useContext(DynamicContext);
  const resolvers = useMemo(
    () =>
      new WeakMap<
        UISchemaElement,
        ReturnType<typeof createDynamicUiResolver>
      >(),
    [cache],
  );
  return (element: UISchemaElement): DynamicUiResult => {
    const presented = dynamicPresentation(element);
    if (presented) return presented;
    const authored = dynamicAuthoredElement(element);
    if (!dynamic || !hasDynamic(authored))
      return { element: authored, failures: [] };
    let resolve = resolvers.get(authored);
    if (!resolve) {
      resolve = createDynamicUiResolver(cache);
      // Pure per-instance cache: abandoned React renders can only evict cached
      // calculations; no form state, subscriptions or effects are published.
      // eslint-disable-next-line react/immutability
      resolvers.set(authored, resolve);
    }
    const segments = path ? path.split('.') : [];
    const environment: DynamicUiEnvironment = {
      get data() {
        return form.core?.data;
      },
      get value() {
        return cell
          ? dynamicCellValue(form.core?.data, segments)
          : dynamicBoundValue(authored, form.core?.data, segments);
      },
      get item() {
        return dynamicItemAt(
          form.core?.data,
          segments,
          (form as typeof form & { item?: unknown }).item,
        );
      },
      get external() {
        return dynamic.external;
      },
      get config() {
        return form.config;
      },
      get errors() {
        return form.core?.errors;
      },
      get locale() {
        return form.i18n?.locale;
      },
      path,
      trustedFunctions: dynamic.trustedFunctions,
    };
    return resolve(authored, environment);
  };
}

/** Structural presentation views preserve both effective properties and authored identity. */
export function useDynamicTreeResolver(path = '') {
  const dynamic = useContext(DynamicContext);
  const resolve = useDynamicResolution(path);
  const tree = useMemo(() => createDynamicTreeResolver(), []);
  return (element: UISchemaElement) =>
    dynamic ? tree(element, resolve) : element;
}

/** Names/keys should be assigned from authored children before using this view. */
export function useDynamicElements(elements: UISchemaElement[], path: string) {
  const resolve = useDynamicTreeResolver(path);
  const stabilize = useMemo(() => createDynamicChildrenMemo(), []);
  return stabilize(elements.map(resolve));
}

// Capture focus before React removes the old DOM. This also covers an internal
// editor replacement within the selected component, without render-time refs.
type DynamicBoundaryProps = React.PropsWithChildren<{ pending?: boolean }>;
class DynamicBoundary extends React.Component<DynamicBoundaryProps> {
  private suspendedFocus: Element | null = null;
  private container = React.createRef<HTMLDivElement>();
  getSnapshotBeforeUpdate() {
    const root = this.container.current?.getRootNode() as
      | Document
      | ShadowRoot
      | undefined;
    const focused = root?.activeElement;
    return focused && this.container.current?.contains(focused)
      ? focused
      : null;
  }
  componentDidUpdate(
    previousProps: DynamicBoundaryProps,
    _state: unknown,
    snapshot: Element | null,
  ) {
    if (this.props.pending) {
      this.suspendedFocus ??= snapshot;
      return;
    }
    const resuming = previousProps.pending && !this.props.pending;
    const focused = resuming ? this.suspendedFocus : snapshot;
    this.suspendedFocus = null;
    const container = this.container.current;
    if (!focused || (!resuming && focused.isConnected) || !container) return;
    const root = container.getRootNode() as Document | ShadowRoot;
    const active = root.activeElement;
    if (
      active &&
      active !== container.ownerDocument.body &&
      active !== container &&
      active !== focused
    )
      return;
    if (
      resuming &&
      focused instanceof HTMLElement &&
      focused.isConnected &&
      !focused.closest('[inert]')
    ) {
      focused.focus({ preventScroll: true });
      return;
    }
    const candidates = container.querySelectorAll<HTMLElement>(
      'input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[role="combobox"],[role="slider"],[role="radio"],button:not([disabled]),[tabindex]:not([tabindex="-1"]),a[href]',
    );
    const target = Array.from(candidates).find(
      (element) =>
        element.getAttribute('aria-disabled') !== 'true' &&
        !element.closest('[hidden],[inert]') &&
        (typeof element.checkVisibility !== 'function' ||
          element.checkVisibility()),
    );
    if (target) {
      target.focus({ preventScroll: true });
      return;
    }
    let fallback = container.parentElement;
    while (fallback && getComputedStyle(fallback).display === 'contents')
      fallback = fallback.parentElement;
    if (!fallback) return;
    if (!fallback.hasAttribute('tabindex')) {
      fallback.setAttribute('tabindex', '-1');
      fallback.addEventListener(
        'blur',
        () => fallback.removeAttribute('tabindex'),
        { once: true },
      );
    }
    fallback.focus({ preventScroll: true });
  }
  render() {
    // React 18 forwards an empty-string inert attribute; React 19 expects a boolean.
    const inert = this.props.pending
      ? { inert: Number.parseInt(React.version, 10) >= 19 ? true : '' }
      : {};
    return (
      <div
        ref={this.container}
        style={{ display: 'contents' }}
        aria-busy={this.props.pending}
        {...inert}
      >
        {this.props.children}
      </div>
    );
  }
}

// Bypass only this redispatch; nested occurrences retain their own aspect boundary.
const redispatched = new WeakSet<UISchemaElement>();

function useDynamicAspect(props: any, cell: boolean) {
  const dynamic = useContext(DynamicContext);
  const resolve = useDynamicResolution(props.path ?? '', cell);
  const resolveChild = useDynamicResolution(props.path ?? '');
  const tree = useMemo(() => createDynamicTreeResolver(), []);
  const resolved = dynamic
    ? tree(props.uischema, (element) =>
        element === props.uischema ? resolve(element) : resolveChild(element),
      )
    : props.uischema;
  const result = dynamicPresentation(resolved) ?? resolve(resolved);
  const effective = useMemo(() => {
    const { $dynamic: _metadata, ...element } =
      result.element as UISchemaElement & { $dynamic?: unknown };
    redispatched.add(element);
    return element;
  }, [result.element]);
  const signature = result.failures.join('\n');
  const onDiagnostic = dynamic?.onDiagnostic;
  useEffect(() => {
    for (const message of signature ? signature.split('\n') : []) {
      const diagnostic = {
        code: 'dynamic.invalid' as const,
        path: props.path ?? '',
        message,
      };
      if (onDiagnostic) onDiagnostic(diagnostic);
      else console.warn('dynamic.invalid', diagnostic);
    }
  }, [signature, props.path, onDiagnostic]);
  const scope = (effective as { scope?: string }).scope ?? '';
  const {
    visible: _visible,
    readonly: cellReadonly,
    enabled: cellEnabled,
    ...cellProps
  } = props;
  return (
    <DynamicBoundary>
      {cell ? (
        <DispatchCell
          {...cellProps}
          readonly={cellReadonly || undefined}
          enabled={cellEnabled === false ? false : undefined}
          key={scope}
          uischema={effective}
        />
      ) : (
        <JsonFormsDispatch {...props} key={scope} uischema={effective} />
      )}
    </DynamicBoundary>
  );
}
export const DynamicRenderer = (props: any) => useDynamicAspect(props, false);
export const DynamicCell = (props: any) => useDynamicAspect(props, true);
const tester = (element: UISchemaElement) =>
  !redispatched.has(element) &&
  (hasDynamicTree(element) || dynamicPresentation(element))
    ? Number.MAX_SAFE_INTEGER
    : -1;
export const dynamicRendererEntry: JsonFormsRendererRegistryEntry = {
  tester,
  renderer: DynamicRenderer,
};
export const dynamicCellEntry: JsonFormsCellRendererRegistryEntry = {
  tester,
  cell: DynamicCell,
};
export const withDynamicRenderers = (
  entries: JsonFormsRendererRegistryEntry[] = [],
) => [
  dynamicRendererEntry,
  ...entries.filter((entry) => entry.renderer !== DynamicRenderer),
];
export const withDynamicCells = (
  entries: JsonFormsCellRendererRegistryEntry[] = [],
) => [
  dynamicCellEntry,
  ...entries.filter((entry) => entry.cell !== DynamicCell),
];

export type DynamicJsonFormsProps = React.ComponentProps<typeof JsonForms> & {
  external?: Readonly<Record<string, unknown>>;
};
export const DynamicJsonForms = ({
  external,
  renderers,
  cells,
  ...props
}: DynamicJsonFormsProps) => {
  const rendererRegistry = useMemo(
    () => withDynamicRenderers(renderers),
    [renderers],
  );
  const cellRegistry = useMemo(() => withDynamicCells(cells), [cells]);
  return (
    <DynamicUiProvider
      config={props.config}
      external={external}
      locale={props.i18n?.locale}
      translate={props.i18n?.translate}
    >
      <JsonForms {...props} renderers={rendererRegistry} cells={cellRegistry} />
    </DynamicUiProvider>
  );
};
