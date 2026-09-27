import type { JsonSchema, UISchemaElement } from '@jsonforms/core';

/**
 * The `context` binding every template profile exposes.
 *
 * Section 3 declares the shape, and section 13 says the Ractive profile
 * "exposes data…, errors…, **context (extended FormContext)**, elements, and
 * translate", adding that "context may expose additionalErrors and
 * application capabilities".
 *
 * All three profiles used to pass something different and smaller - the JSX
 * engine a flat `locale` and no `context` at all, Ractive a `context` holding
 * only `{ locale }`. So `readonly` was unreachable from a template, which
 * matters as soon as a template draws its own widget: **readonly and disabled
 * are different states**, and a widget that wants to render as text rather
 * than as a greyed-out input has to be able to tell them apart.
 */
export interface FormContext {
  [key: string]: unknown;
  config?: unknown;
  readonly?: boolean;
  locale?: string;
  translate?: unknown;
  data?: unknown;
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  errors?: unknown[];
  additionalErrors?: unknown[];
  fireActionEvent?: unknown;
}

export interface FormContextSources {
  /** `useJsonForms()`. */
  ctx: {
    core?: {
      data?: unknown;
      schema?: JsonSchema;
      errors?: unknown[];
      additionalErrors?: unknown[];
    };
    i18n?: { locale?: string; translate?: unknown };
    readonly?: boolean;
    config?: unknown;
  };
  /** The schema at this element's path, which is narrower than the root. */
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  /** The host's action handler, where one is registered. */
  fireActionEvent?: unknown;
}

export const buildFormContext = ({
  ctx,
  schema,
  uischema,
  fireActionEvent,
}: FormContextSources): FormContext => ({
  config: ctx.config,
  readonly: ctx.readonly === true,
  locale: ctx.i18n?.locale,
  translate: ctx.i18n?.translate,
  data: ctx.core?.data,
  // The schema *here*, not the root - a template is usually interested in the
  // part of the model it is rendering.
  schema: schema ?? ctx.core?.schema,
  uischema,
  errors: ctx.core?.errors ?? [],
  additionalErrors: ctx.core?.additionalErrors ?? [],
  fireActionEvent,
});
