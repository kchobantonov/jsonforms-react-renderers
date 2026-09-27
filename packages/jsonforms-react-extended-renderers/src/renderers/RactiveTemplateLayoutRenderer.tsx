import { LayoutProps } from '@jsonforms/core';
import { JsonFormsDispatch, useJsonForms } from '@jsonforms/react';
import React, { useEffect, useMemo } from 'react';
import { createLazyTemplate } from '../util/lazyTemplate';
import type { RactiveTemplateProps } from '../components/RactiveTemplate';

/*
  Ractive is ~100KB and is imported at module scope by the template component,
  so it is fetched only when a `lang: "ractive"` element actually renders.
*/
const RactiveTemplate = createLazyTemplate<RactiveTemplateProps>(
  async () => (await import('../components/RactiveTemplate')).RactiveTemplate,
  {
    loading: 'template.loading',
    error: 'template.loadError',
    renderError: 'template.renderError',
  }
);
import {
  ractiveTransitionAttributes,
  resolveChildNames,
} from '../util/childNames';
import { buildFormContext } from '../util/formContext';
import { resolveUrlPolicy } from '../util/urlPolicy';
import {
  TemplateLayoutElement,
  resolveTemplateEngine,
} from '../util/templateLang';
import { TemplateDiagnostic } from './templateEngines';

/**
 * The `lang: "ractive"` profile - the specification's default web profile, and
 * the one the Svelte renderer family implements.
 *
 * Children are **partials**: `{{> body}}` renders the child named `body`.
 * Ractive cannot host a React subtree, so each partial resolves to a
 * placeholder element that React then portals the delegated renderer into. The
 * partial registry is generated from the child names rather than authored, so
 * a template never has to know about the placeholder attribute.
 *
 * The bindings are the ones the specification names: `data` (whole-form data),
 * `errors` (core schema errors), `context`, `elements` and `translate`.
 */

const SLOT_ATTR = 'data-jsonforms-slot';

export const RactiveTemplateLayoutRenderer = (
  props: LayoutProps & { uischema: TemplateLayoutElement }
) => {
  const { uischema, schema, path, enabled, visible, renderers, cells, config } =
    props;
  const ctx = useJsonForms();
  const resolved = resolveTemplateEngine(uischema, config);

  const children = uischema.elements ?? [];
  /*
    Collision-aware: an index fallback never steals a name another child
    declared, and a child that cannot be addressed is reported rather than
    silently left off the form.
  */
  const { names, diagnostics } = resolveChildNames(children);
  const nameKey = names.join('\u0000');

  /*
    Reported to the author rather than rendered: a child that cannot be
    addressed is a mistake in the UI schema, and the person filling in the
    form can do nothing about it. Same precedent as `Categorization`'s
    `initial` (adjustment 10.5).
  */
  useEffect(() => {
    for (const diagnostic of diagnostics) {
      // eslint-disable-next-line no-console
      console.warn(diagnostic);
    }
  }, [diagnostics.join('\u0000')]);

  /*
    An attribute Ractive will eat as a transition directive. This profile
    registers no transitions, so it does nothing except disappear - and
    disappearing silently is how an hour goes missing.
  */
  const template = uischema.template ?? '';
  useEffect(() => {
    const eaten = ractiveTransitionAttributes(template);
    if (eaten.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `template.ractiveTransitionAttribute: ${JSON.stringify(
          eaten
        )} end in -in, -out or -in-out, which Ractive parses as transition directives. This profile registers no transitions, so they are dropped from the DOM. Rename them.`
      );
    }
  }, [template]);

  /* One placeholder partial per child, so `{{> body}}` resolves. */
  const partials = useMemo(() => {
    const map: Record<string, string> = {};
    for (const name of names) {
      if (name !== undefined) {
        map[name] = `<div ${SLOT_ATTR}="${name}"></div>`;
      }
    }
    return map;
  }, [nameKey]);

  const slots = useMemo(() => {
    const map: Record<string, React.ReactNode> = {};
    children.forEach((element, index) => {
      const name = names[index];
      if (name === undefined) {
        return;
      }
      map[name] = (
        <JsonFormsDispatch
          uischema={element}
          schema={schema}
          path={path}
          enabled={enabled}
          renderers={renderers}
          cells={cells}
        />
      );
    });
    return map;
  }, [nameKey, schema, path, enabled, renderers, cells]);

  /*
    Rebuilt whenever a binding changes; the template component turns that into
    a keypath `set`, which is the surgical half. The object identity is the
    signal, the values inside are what Ractive diffs.
  */
  const bindings = useMemo(
    () => ({
      data: ctx.core?.data,
      errors: ctx.core?.errors,
      context: buildFormContext({ ctx: ctx as any, schema, uischema }),
      elements: names
        .filter((name): name is string => name !== undefined)
        .map((name) => ({ name })),
      translate: (key: string, fallback?: string) =>
        ctx.i18n?.translate?.(key, fallback) ?? fallback ?? key,
    }),
    [ctx.core?.data, ctx.core?.errors, ctx.i18n?.locale, nameKey]
  );

  if (visible === false) {
    return null;
  }
  if (resolved.diagnostic) {
    return (
      <TemplateDiagnostic
        uischema={uischema}
        config={config}
        visible={visible}
      />
    );
  }

  return (
    <RactiveTemplate
      template={template}
      partials={partials}
      data={bindings}
      slots={slots}
      urlPolicy={resolveUrlPolicy(config)}
    />
  );
};
