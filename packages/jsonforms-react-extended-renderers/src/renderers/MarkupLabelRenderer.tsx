import type { ItemContext } from '@chobantonov/jsonforms-react-renderer-common/CellSummary';
import {
  LabelProps,
  RankedTester,
  UISchemaElement,
  rankWith,
  uiTypeIs,
} from '@jsonforms/core';
import React, { Suspense, lazy } from 'react';
import { useJsonForms, withJsonFormsLabelProps } from '@jsonforms/react';
import { LoadBoundary } from '../util/lazyControl';
import {
  buildNamespaceScope,
  dynamicValuesEnabled,
  hasExpressions,
  reservedParamNames,
  splitTemplate,
  wantsInterpolation,
} from '../util/interpolate';
import { escapeMarkdown } from '../util/markdownEscape';
import { markdownProfile, resolveMarkup } from '../util/markup';
import { InterpolatedText } from './InterpolatedText';
import { resolveUrlPolicy } from '../util/urlPolicy';
import { useExtendedTranslator } from '../util/useExtendedTranslator';
import type { MarkdownTextProps } from './MarkupLabelRenderer.impl';

/**
 * A `Label` whose text is more than a string.
 *
 * ## Why this is not a new element type
 *
 * It would have been simpler to define `MarkdownLabel` and give it its own
 * tester. It would also have been unusable: an element type nothing in the
 * base renderer set knows renders as **nothing at all**, so a form authored
 * against the extended set and opened on the base one would lose the text
 * entirely. `Label` with `options.markup` degrades instead - the base renderer
 * still claims it at rank 1 and still shows the text, unparsed. Section 1's
 * "unknown options are preserved and ignored" is what makes that work, and it
 * only works for options, not for types.
 */

/**
 * Whether this element asks for markup or interpolation.
 *
 * Reads the **requested** values, not the resolved ones, so a request the
 * host has switched off still lands here and can be reported. Leaving it to
 * the base renderer would render the source silently, which is the failure
 * the diagnostics exist to prevent.
 */
const asksForMarkup = (uischema: UISchemaElement): boolean => {
  const options = uischema.options as Record<string, unknown> | undefined;
  const markup = options?.['markup'];
  return (
    wantsInterpolation(options) || (markup !== undefined && markup !== 'plain')
  );
};

/**
 * Rank 3, above the base `Label` renderer's 1.
 *
 * Not 2: the antd renderer set reserves 2 for its own overrides of core
 * elements, and a markup label has to beat those too.
 */
export const markupLabelTester: RankedTester = rankWith(
  3,
  (uischema, _schema, _context) =>
    uiTypeIs('Label')(uischema, _schema, _context) && asksForMarkup(uischema)
);

/**
 * The UI library's own text component, if the binding package supplies one.
 *
 * `block` says what it is being handed. Parsed Markdown is already block
 * content - paragraphs, lists - while plain text is a single run, and a
 * library whose paragraph component renders an actual `<p>` must not wrap the
 * former in it: `<p>` accepts phrasing content only, so a `<p>` or a `<ul>`
 * inside one is invalid and the browser closes the outer tag early, leaving a
 * tree that does not match what React thinks it rendered.
 *
 * It is one slot with a flag rather than two components because for some
 * libraries the two coincide - antd's `Typography.Paragraph` renders a `div`,
 * so it is safe for both - and a binding should be able to say that by
 * ignoring the flag rather than by naming the same component twice.
 */
export type MarkupTypography = React.ComponentType<{
  block: boolean;
  children?: React.ReactNode;
}>;

export interface MarkupLabelProps extends LabelProps {
  typography?: MarkupTypography;
}

/*
  Created once at module scope, so the chunk is requested once however many
  labels there are.
*/
const LazyMarkdownText = lazy(async () => ({
  default: (await import('./MarkupLabelRenderer.impl'))
    .MarkdownText as React.ComponentType<MarkdownTextProps>,
}));

const DIAGNOSTIC_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: '0.85em',
  opacity: 0.85,
};

export const MarkupLabelRendererComponent = ({
  uischema,
  text,
  visible,
  config,
  typography,
}: MarkupLabelProps) => {
  const t = useExtendedTranslator();
  const ctx = useJsonForms();
  if (visible === false) {
    return null;
  }
  const options = uischema?.options as Record<string, unknown> | undefined;
  const request = resolveMarkup(options, config);
  const content = text ?? '';

  const diagnostic = request.diagnostic ? (
    <span
      role='alert'
      data-markup-diagnostic={request.diagnostic}
      style={DIAGNOSTIC_STYLE}
    >
      {request.diagnostic === 'markdownDisabled'
        ? t('markup.markdownDisabled')
        : t('markup.unsupported', { markup: JSON.stringify(options?.markup) })}
    </span>
  ) : null;

  const Typography = request.typography ? typography : undefined;

  /*
    Split eagerly. It is pure string work, it decides whether the evaluator is
    needed at all, and doing it here keeps that decision out of the chunk.
  */
  const segments = request.interpolate ? splitTemplate(content) : undefined;
  /*
    The segments only when there is something to evaluate, so the type itself
    carries the decision: every path below either has expressions or does not,
    and neither needs to assert it.
  */
  const expressions =
    segments && hasExpressions(segments) ? segments : undefined;
  /*
    The text with no expressions to resolve - which is **not** the authored
    text, because the grammar's brace escaping still has to be applied:
    `{{data.x}}` is the literal `{data.x}`, and a template made only of
    literals must still say so. Skipping the evaluator is right here; skipping
    the unescaping was a bug.
  */
  const plainText = segments
    ? segments
        .map((segment) => (segment.kind === 'literal' ? segment.text : ''))
        .join('')
    : content;
  const textParams = options?.['textParams'] as
    | Record<string, unknown>
    | undefined;
  /*
    The namespaces are for the PARAMETERS, not for the text. A translated
    string that reads `{data.customerName}` couples the catalog to the schema;
    one that reads `{product}` does not, and that is the whole reason the two
    scopes are separate.
  */
  const namespaceScope = expressions
    ? buildNamespaceScope({
        data: ctx.core?.data,
        get item() { return (ctx as typeof ctx & ItemContext).item; },
        locale: ctx.i18n?.locale,
        config,
        dynamicAllowed: dynamicValuesEnabled(config),
      })
    : {};
  const reserved = reservedParamNames(textParams);

  /*
    A refusal shows the diagnostic AND the text. A Label's text is inert
    content, not a program: the reason a refused template renders nothing is
    that running it is the whole point, whereas the words of a label are
    readable whether or not their asterisks became bold. Hiding them would
    turn a policy decision into missing information on the page.
  */
  /*
    Nothing to do beyond what the base renderer would do: no parsing, and no
    expression to resolve. The `expressions` half matters - `interpolate:
    true` over text with no placeholder must not reach for the evaluator.
  */
  if (!request.markdown && !expressions) {
    return (
      <label data-markup-label='plain'>
        {Typography ? (
          <Typography block={false}>{plainText}</Typography>
        ) : (
          plainText
        )}
        {diagnostic}
      </label>
    );
  }

  /*
    The parsed half, as a function of the text, because the text may still be
    on its way: when interpolation is in play this is called with the
    resolved string rather than the authored one.
  */
  const parsed = (source: string) => (
    /*
      Both fallbacks are the text itself, not a spinner and not an error.
      The chunk usually arrives within a frame, and a paragraph of prose
      replaced by "Loading…" and back again is a worse read than the same
      prose unparsed for a moment.

      The boundary is not optional. Suspense has no error path, so without it
      a chunk that never arrives - an offline reload, a stale hash after a
      deploy - throws past it and takes the whole form down, over a label.
    */
    <LoadBoundary fallback={source}>
      <Suspense fallback={source}>
        <LazyMarkdownText
          text={source}
          profile={markdownProfile(config)}
          urlPolicy={resolveUrlPolicy(config)}
        />
      </Suspense>
    </LoadBoundary>
  );

  const body = (source: string): React.ReactNode =>
    request.markdown ? parsed(source) : source;

  const wrap = (node: React.ReactNode, extra?: React.ReactNode) => {
    const inner = Typography ? (
      <Typography block={request.markdown}>{node}</Typography>
    ) : (
      node
    );
    /*
      A `div` once Markdown is parsed, because that is block content and
      `<label>` accepts phrasing content only; a `label` otherwise, which is
      what the base renderer draws.
    */
    return request.markdown ? (
      <div data-markup-label='markdown'>
        {inner}
        {extra}
      </div>
    ) : (
      <label data-markup-label='interpolated'>
        {inner}
        {extra}
      </label>
    );
  };

  if (!expressions) {
    return wrap(body(plainText), diagnostic);
  }

  /*
    The evaluator is fetched only when there is something to evaluate. A
    template with no placeholders is resolved here, for free, and never asks
    for the chunk - which is the difference between `interpolate: true` being
    a declaration of intent and a download.
  */
  /*
    The wrapper is outside the boundary on purpose. It depends only on what
    was *asked for*, never on what arrived, so the element, its typography and
    its `data-markup-label` are present while the chunk is in flight and stay
    present if it never lands. Wrapping inside the render prop instead left a
    failed load rendering a bare string with no element at all.
  */
  return wrap(
    <InterpolatedText
      segments={expressions}
      textParams={textParams}
      namespaceScope={namespaceScope}
      locale={ctx.i18n?.locale}
      translate={ctx.i18n?.translate}
      escape={request.markdown ? escapeMarkdown : undefined}
      fallback={plainText}
    >
      {(result) => (
        <>
          {body(result.text)}
          {result.failures.length > 0 || reserved.length > 0 ? (
            <span
              role='alert'
              data-markup-diagnostic='interpolationFailed'
              style={DIAGNOSTIC_STYLE}
            >
              {t('markup.interpolationFailed', {
                detail: [
                  ...reserved.map(
                    (name) => `textParams.${name} is a reserved name`
                  ),
                  ...result.failures,
                ].join('; '),
              })}
            </span>
          ) : null}
        </>
      )}
    </InterpolatedText>,
    diagnostic
  );
};

export const MarkupLabelRenderer = withJsonFormsLabelProps(
  MarkupLabelRendererComponent
);

/** Binds the typography slots, for a renderer set that has them. */
export const createMarkupLabelRenderer = (typography: MarkupTypography) =>
  withJsonFormsLabelProps((props: LabelProps) => (
    <MarkupLabelRendererComponent {...props} typography={typography} />
  ));
