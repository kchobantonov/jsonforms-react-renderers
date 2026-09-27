import {
  Actions,
  JsonSchema,
  LayoutProps,
  RankedTester,
  Translator,
  and,
  rankWith,
  uiTypeIs,
} from '@jsonforms/core';
import {
  JsonFormsDispatch,
  useJsonForms,
  withJsonFormsLayoutProps,
} from '@jsonforms/react';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import type { ExtendedUISchemaElement } from '../core/uiSchema';
import { resolveChildNames } from '../util/childNames';
import { buildFormContext, type FormContext } from '../util/formContext';
import { useHandleAction } from './actionContext';
import { UrlPolicy, resolveUrlPolicy } from '../util/urlPolicy';
import type { TemplateLayoutElement } from '../util/templateLang';

/**
 * A `TemplateLayout` whose template is a **function**, not a string.
 *
 * The same element, authored in TypeScript instead of serialized. Nothing is
 * compiled from a string, so there is no parser and - importantly - **no
 * `allowScriptEvaluation`**: the permission exists because string evaluation
 * needs CSP `unsafe-eval`, and a function the build already compiled needs
 * nothing of the sort. A TSX template is strictly the safer of the two forms.
 *
 * It is not portable, and that is the deal: a function cannot be serialized,
 * so a form carrying one cannot be sent over the wire. The portable
 * `TemplateLayoutElement.template` stays a `string`; only the React-specific
 * `ReactTemplateLayoutElement` widens it.
 */

/** What a `Slot` receives. `children` is the fallback, per section 13. */
export interface SlotProps {
  name: string;
  children?: React.ReactNode;
}

/**
 * Everything a TSX template is handed.
 *
 * Deliberately close to what the string engines expose, so the three forms
 * stay one idea - plus the pieces a function can actually use: the element
 * definitions for inspection, a guarded write, and the layout's own schema
 * and path.
 */
export interface TemplateRenderProps<T = unknown> {
  /** The whole form's data, as the string engines' `data` binding. */
  data: T;
  /** Where this layout sits, for addressing a write. */
  path: string;
  /** Core schema errors, unfiltered. */
  errors: unknown[];
  /** The schema at this layout's path. */
  schema: JsonSchema;
  /** This element, for its own `options`. */
  uischema: TemplateLayoutElement;
  /**
   * The child **elements**, by name - the definitions, not rendered output.
   * Read `.type`, `.scope`, `.options`, or reach a layout's own `.elements`.
   */
  elements: Record<string, ExtendedUISchemaElement>;
  /** Places a named child, with optional fallback content. */
  Slot: (props: SlotProps) => React.ReactElement | null;
  /** False when the form or this subtree is disabled or read-only. */
  enabled: boolean;
  /**
   * True when the form is read-only.
   *
   * Distinct from `enabled` on purpose. A read-only form sets `enabled` to
   * false as well, but the two mean different things to a widget: *disabled*
   * is "not available right now", *read-only* is "display this, do not edit
   * it" - and the second often wants text rather than a greyed-out input.
   */
  readonly: boolean;
  /**
   * Writes through the normal change dispatch.
   *
   * Section 13 requires that a template's two-way binding "must not bypass
   * readonly/restrict or normal form change dispatch", so this is a no-op
   * while `enabled` is false. It does **not** know about `restrict`, which is
   * per-renderer and has no shared guard a layout can consult - a template can
   * still write past an array's `maxItems`. Recorded rather than pretended
   * away.
   */
  handleChange: (path: string, value: unknown) => void;
  translate: Translator;
  /**
   * Section 12's URL policy, resolved from the form's config.
   *
   * **This profile has to apply it itself**, and that is not an oversight.
   * The string engines route every element through a `createElement` pragma
   * this package owns, so an `href` carrying `javascript:` is dropped before
   * the element exists. A TSX template is compiled by the *build*, with
   * React's own pragma, and there is nothing to intercept.
   *
   * The distinction is real: a string template is **data** and may arrive with
   * the form; a TSX template is **code** in this repository, which can already
   * do anything. What is still data either way is the *value* - so a template
   * writing `href={data.url}` should pass it through
   * `isAllowedUrl(url, urlPolicy)` first, which is why the policy is handed
   * over here rather than left to be imported and resolved again.
   */
  urlPolicy: UrlPolicy;
  /** Section 3's `FormContext`, in full. */
  context: FormContext;
}

export type TemplateRender<T = unknown> = (
  props: TemplateRenderProps<T>
) => React.ReactNode;

/** The React-only element: `template` may be a function here. */
export type ReactTemplateLayoutElement<T = unknown> = Omit<
  TemplateLayoutElement,
  'template'
> & { template: string | TemplateRender<T> };

/**
 * Selected by the **shape of `template`**, not by `lang`.
 *
 * A function is not written in a template language, so routing it through
 * `lang` would be the wrong axis - and it must win over the string engines,
 * which a shared `uiTypeIs('TemplateLayout')` alone would not guarantee.
 */
export const tsxTemplateLayoutTester: RankedTester = rankWith(
  5,
  and(
    uiTypeIs('TemplateLayout'),
    (uischema) =>
      typeof (uischema as { template?: unknown } | undefined)?.template ===
      'function'
  )
);

export const TsxTemplateLayoutRendererComponent = (
  props: LayoutProps & { uischema: ReactTemplateLayoutElement }
) => {
  const { uischema, schema, path, enabled, visible, renderers, cells } = props;
  const ctx = useJsonForms();
  const fireActionEvent = useHandleAction();

  const children = uischema.elements ?? [];
  const { names, diagnostics } = resolveChildNames(children);

  useEffect(() => {
    for (const diagnostic of diagnostics) {
      // eslint-disable-next-line no-console
      console.warn(diagnostic);
    }
  }, [diagnostics.join('\u0000')]);

  const byName = useMemo(() => {
    const map: Record<string, ExtendedUISchemaElement> = {};
    children.forEach((element, index) => {
      const name = names[index];
      if (name !== undefined) {
        map[name] = element;
      }
    });
    return map;
  }, [children, names.join('\u0000')]);

  /*
    `Slot` is used as a **component type**, so its identity is load-bearing:
    React unmounts and remounts the whole subtree whenever the type changes.
    A `useCallback` over `[byName, schema, path, enabled, renderers, cells]`
    looks safe and is not - a parent that builds its `renderers` array inline
    hands a new one every render, which remounted every slotted control on
    every keystroke and took the cursor with it. That is precisely the
    no-remount guarantee the string profiles are held to.

    So the component is created **once**, and reads what it needs from a ref.
    It re-runs on every render anyway, because the template function does, so
    it never shows a stale value.
  */
  const slotState = useRef({ byName, schema, path, enabled, renderers, cells });
  slotState.current = { byName, schema, path, enabled, renderers, cells };

  const Slot = useMemo(() => {
    const SlotComponent = ({ name, children: fallback }: SlotProps) => {
      const current = slotState.current;
      const element = current.byName[name];
      /*
        A name no child answers to is an authoring mistake that would otherwise
        render nothing and say nothing - the same silence the child-name
        collision used to produce. The fallback still renders, so the form
        stays usable.
      */
      if (!element) {
        // eslint-disable-next-line no-console
        console.warn(
          `template.unknownSlot: no child is named ${JSON.stringify(
            name
          )}; known names are ${JSON.stringify(Object.keys(current.byName))}.`
        );
        return <>{fallback ?? null}</>;
      }
      return (
        <JsonFormsDispatch
          uischema={element}
          schema={current.schema}
          path={current.path}
          enabled={current.enabled}
          renderers={current.renderers}
          cells={current.cells}
        />
      );
    };
    SlotComponent.displayName = 'Slot';
    return SlotComponent;
  }, []);

  const handleChange = useCallback(
    (target: string, value: unknown) => {
      if (enabled === false) {
        return;
      }
      ctx.dispatch?.(Actions.update(target, () => value));
    },
    [ctx.dispatch, enabled]
  );

  if (visible === false) {
    return null;
  }

  const template = uischema.template;
  if (typeof template !== 'function') {
    // The tester guarantees otherwise; this keeps the type honest.
    return null;
  }

  return (
    <>
      {template({
        data: ctx.core?.data,
        path: path ?? '',
        errors: ctx.core?.errors ?? [],
        schema,
        uischema: uischema as TemplateLayoutElement,
        elements: byName,
        Slot,
        enabled: enabled !== false,
        readonly: (ctx as { readonly?: boolean }).readonly === true,
        handleChange,
        translate: (ctx.i18n?.translate ??
          ((key: string) => key)) as Translator,
        urlPolicy: resolveUrlPolicy((ctx as { config?: unknown }).config),
        context: buildFormContext({
          ctx: ctx as any,
          schema,
          uischema,
          fireActionEvent,
        }),
      })}
    </>
  );
};

export const TsxTemplateLayoutRenderer = withJsonFormsLayoutProps(
  TsxTemplateLayoutRendererComponent as any
);
