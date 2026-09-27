import React, { Suspense, lazy } from 'react';
import { ExtendedI18nKey } from './i18nDefaults';
import { useExtendedTranslator } from './useExtendedTranslator';

/**
 * Defers a template engine's compiler until a template is actually rendered.
 *
 * Both engines carry a heavyweight dependency at module scope - Sucrase for
 * the JSX profile, Ractive for the Ractive one - and a form with no
 * `TemplateLayout` in it should download neither. `React.lazy` puts each
 * behind its own chunk, the same arrangement the AG Grid and Monaco controls
 * already use.
 *
 * Selection happens in the **tester**, so only the engine an element actually
 * asks for is ever fetched: a form of `lang: "ractive"` templates never loads
 * Sucrase, and vice versa.
 */

/**
 * Suspense has no error path of its own, so a boundary catches import failures.
 *
 * It catches **render** failures too, which is not the same thing and must not
 * be reported as if it were: a template that throws while React reconciles its
 * output used to surface as "The template engine could not be loaded", which
 * sends the reader to look at chunks and network tabs instead of at their
 * template. `loaded` says which of the two happened.
 */
class LoadBoundary extends React.Component<
  React.PropsWithChildren<{ describe: () => React.ReactNode }>,
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error('template.failed:', error);
  }
  render() {
    return this.state.failed ? this.props.describe() : this.props.children;
  }
}

/**
 * Translation **keys**, not text.
 *
 * The labels are chosen where `createLazyTemplate` is called, which is module
 * scope - no hook can run there, and text fixed at module scope is text that
 * cannot follow the locale. Naming the keys here and translating them inside
 * the component is what lets these three strings be translated at all.
 */
export interface LazyTemplateLabels {
  loading: ExtendedI18nKey;
  /** Shown when the engine's chunk itself could not be fetched. */
  error: ExtendedI18nKey;
  /** Shown when the engine loaded and the template then threw. */
  renderError?: ExtendedI18nKey;
}

export const createLazyTemplate = <P extends object>(
  load: () => Promise<React.ComponentType<P>>,
  labels: LazyTemplateLabels
): React.ComponentType<P> => {
  /*
    Module scope, so it survives a remount: once the chunk is in, a later
    failure can only be the template's own.
  */
  let loaded = false;
  // Created once per module, not per render, so the chunk is fetched once.
  const Lazy = lazy(async () => {
    const component = await load();
    loaded = true;
    return { default: component };
  });
  const LazyTemplate = (props: P) => {
    const t = useExtendedTranslator();
    return (
      <LoadBoundary
        describe={() => (
          <div
            role='alert'
            data-template-load-error={loaded ? undefined : true}
            data-template-render-error={loaded ? true : undefined}
          >
            {t(
              loaded
                ? labels.renderError ?? 'template.renderError'
                : labels.error
            )}
          </div>
        )}
      >
        <Suspense
          fallback={
            <div aria-busy='true' aria-live='polite' data-template-loading>
              {t(labels.loading)}
            </div>
          }
        >
          {/* The generic defeats React.lazy's prop inference; the call sites are typed. */}
          <Lazy {...(props as any)} />
        </Suspense>
      </LoadBoundary>
    );
  };
  // Named so React DevTools and the lint rule both have something to show.
  LazyTemplate.displayName = 'LazyTemplate';
  return LazyTemplate;
};
