import React, { Suspense, lazy } from 'react';
import { ControlProps } from '@jsonforms/core';
import { EditorRendererComponents } from '../renderers/EditorControlFrame';
import { ExtendedI18nKey } from './i18nDefaults';
import { useExtendedTranslator } from './useExtendedTranslator';

const DefaultLoading = ({ label }: { label?: string }) => (
  <div aria-busy='true' aria-live='polite' style={{ minHeight: '4rem' }}>
    {label}
  </div>
);
const DefaultLoadError = ({ label }: { label?: string }) => (
  <div role='alert'>{label}</div>
);

/**
 * Suspense has no error path of its own, so a boundary catches import
 * failures.
 *
 * Exported because every lazily-loaded renderer needs one, not only the ones
 * built by `createLazyControl`. Without it a chunk that fails to arrive - an
 * offline reload, a stale hash after a deploy - throws past Suspense and
 * takes the whole form down rather than degrading to whatever the caller
 * chose as a fallback.
 */
export class LoadBoundary extends React.Component<
  React.PropsWithChildren<{ fallback: React.ReactNode }>,
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * Defers a renderer's heavy dependency until the control is actually rendered.
 * The import lives behind React.lazy so bundlers split it into its own chunk -
 * a form with no code editor or data grid never downloads them.
 */
export const createLazyControl = (
  load: () => Promise<React.ComponentType<ControlProps>>,
  components: EditorRendererComponents,
  labels: { loading: ExtendedI18nKey; error: ExtendedI18nKey }
): React.ComponentType<ControlProps> => {
  const Loading = components.Loading ?? DefaultLoading;
  const LoadError = components.LoadError ?? DefaultLoadError;
  // Created once per renderer set, not per render, so the chunk is fetched once.
  const Lazy = lazy(async () => ({ default: await load() }));
  return (props: ControlProps) => {
    // translated here so the fallbacks are localised like everything else
    const t = useExtendedTranslator();
    return (
      <LoadBoundary fallback={<LoadError label={t(labels.error)} />}>
        <Suspense fallback={<Loading label={t(labels.loading)} />}>
          <Lazy {...props} />
        </Suspense>
      </LoadBoundary>
    );
  };
};
