import React, { Suspense, lazy } from 'react';
import { LoadBoundary } from '../util/lazyControl';
import { TemplateSegment, buildTextScope } from '../util/interpolate';
import type { TemplateResult } from '../util/celTemplate';

/**
 * Resolves a split template, loading the evaluator only if there is one to
 * resolve.
 *
 * The chunk boundary is the point of this component. A label that asks for
 * interpolation but whose text contains no placeholder never requests the
 * evaluator, because the split has already happened - see `interpolate.ts`,
 * which is deliberately free of any CEL import so that the decision can be
 * made before the chunk is.
 *
 * Children are a render prop rather than an element, so the caller decides
 * what to do with the resolved string. That is what keeps the Markdown chunk
 * independent of this one: a label that interpolates without Markdown never
 * touches the parser, and one that does both loads two chunks rather than a
 * combined one.
 */

export interface InterpolatedTextProps {
  segments: TemplateSegment[];
  /** Declared parameters, unresolved: their values may be expressions. */
  textParams?: Record<string, unknown>;
  /** What a parameter's value may see - the namespaces, subject to the gate. */
  namespaceScope: Record<string, unknown>;
  locale?: string;
  /** The form's translator, so an expression can look a key up (§9). */
  translate?: (key: string, defaultMessage?: string) => string | undefined;
  escape?: (text: string) => string;
  children: (result: TemplateResult) => React.ReactNode;
  /** The unresolved text, shown while the chunk is in flight or if it fails. */
  fallback: string;
}

const LazyEvaluate = lazy(async () => {
  const { renderTemplate, resolveTextParams } = await import(
    '../util/celTemplate'
  );
  const Evaluated = ({
    segments,
    textParams,
    namespaceScope,
    locale,
    translate,
    escape,
    children,
  }: Omit<InterpolatedTextProps, 'fallback'>) => {
    /*
      Two levels, in order. The parameters are resolved against the
      namespaces, then the text is resolved against the parameters - which is
      the whole point of the split: the text never sees `data`.
    */
    const resolved = resolveTextParams(
      textParams,
      namespaceScope,
      locale,
      translate
    );
    const rendered = renderTemplate(
      segments,
      buildTextScope(resolved.params, locale),
      escape,
      locale,
      translate
    );
    return (
      <>
        {children({
          text: rendered.text,
          failures: [...resolved.failures, ...rendered.failures],
        })}
      </>
    );
  };
  return { default: Evaluated };
});

export const InterpolatedText = ({
  segments,
  textParams,
  namespaceScope,
  locale,
  translate,
  escape,
  children,
  fallback,
}: InterpolatedTextProps) => (
  /*
    A pending evaluator shows a compact status indicator, never the authored
    template. The caller supplies safe literal content for a failed load.
  */
  <LoadBoundary fallback={fallback}>
    <Suspense fallback={<span role="status" aria-busy="true">…</span>}>
      <LazyEvaluate
        segments={segments}
        textParams={textParams}
        namespaceScope={namespaceScope}
        locale={locale}
        translate={translate}
        escape={escape}
      >
        {children}
      </LazyEvaluate>
    </Suspense>
  </LoadBoundary>
);
