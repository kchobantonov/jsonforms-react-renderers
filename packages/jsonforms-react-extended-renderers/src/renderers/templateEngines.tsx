import {
  RankedTester,
  UISchemaElement,
  rankWith,
  uiTypeIs,
} from '@jsonforms/core';
import React from 'react';
import {
  TemplateLang,
  resolveTemplateEngine,
  resolveTemplateLang,
} from '../util/templateLang';

/**
 * Selecting a template engine, and refusing to run one.
 *
 * A `TemplateLayout` is dispatched to a renderer per **language**, so each
 * engine is an ordinary registry entry with its own tester rather than a
 * branch inside one component. The tester is where the choice belongs: a
 * `TesterContext` carries the form-wide `config`, which is what
 * `defaultTemplateLang` lives in.
 */

/**
 * A tester for one engine.
 *
 * Deliberately does **not** consult `allowScriptEvaluation`. A tester that
 * returned `-1` for a disabled host would leave the element unmatched and the
 * form silent; the specification asks for the opposite - "report
 * unsupported/evaluation-disabled behavior instead". So the renderer is still
 * selected, and it explains itself.
 */
export const templateLangTester = (lang: TemplateLang): RankedTester =>
  rankWith(2, (uischema, _schema, context) => {
    if (!uiTypeIs('TemplateLayout')(uischema, _schema, context)) {
      return false;
    }
    return resolveTemplateLang(uischema, context?.config).lang === lang;
  });

/**
 * The fallback for a `TemplateLayout` no engine claimed.
 *
 * "Unknown or unsupported languages must be diagnosed rather than interpreted
 * as another engine." Ranked below the engines, so it only wins when the
 * resolution produced no supported language.
 */
export const unsupportedTemplateLangTester: RankedTester = rankWith(
  1,
  uiTypeIs('TemplateLayout')
);

export interface TemplateDiagnosticProps {
  uischema: UISchemaElement;
  config?: unknown;
  visible?: boolean;
}

const DIAGNOSTIC_STYLE: React.CSSProperties = {
  border: '1px solid currentColor',
  borderRadius: 4,
  padding: '0.75rem 1rem',
  opacity: 0.85,
  fontSize: '0.9rem',
};

/**
 * Says why a template is not being rendered, in place of rendering it.
 *
 * Both reasons are reported the same way and neither is an error state the
 * form can recover from by itself: one is an authoring mistake, the other a
 * deliberate host policy.
 */
export const TemplateDiagnostic = ({
  uischema,
  config,
  visible,
}: TemplateDiagnosticProps) => {
  const resolved = resolveTemplateEngine(uischema, config);
  if (visible === false || !resolved.diagnostic) {
    return null;
  }
  const message =
    resolved.diagnostic === 'unsupported'
      ? `Unsupported template language ${JSON.stringify(
          resolved.requested
        )}. This renderer set implements "ractive" and "jsx".`
      : 'Template rendering is disabled. It compiles the template string into ' +
        'executable code, which requires ' +
        'jsonformsExtended.security.allowScriptEvaluation to be true.';
  return (
    <div
      role='alert'
      data-template-diagnostic={resolved.diagnostic}
      style={DIAGNOSTIC_STYLE}
    >
      {message}
    </div>
  );
};
