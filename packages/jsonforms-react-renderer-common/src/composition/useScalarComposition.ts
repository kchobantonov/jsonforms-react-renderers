import {
  and,
  getCombinedErrorMessage,
  getControlPath,
  rankWith,
  schemaMatches,
  uiTypeIs,
  type ControlProps,
  type RankedTester,
} from '@jsonforms/core';
import { useJsonForms } from '@jsonforms/react';
import {
  scalarCompositionSchema,
  scalarCompositionType,
} from './scalarComposition';

/** A single scalar editor takes precedence over generic combinator navigation. */
export const scalarCompositionTester: RankedTester = rankWith(
  4,
  and(
    uiTypeIs('Control'),
    schemaMatches(
      (schema, rootSchema) =>
        scalarCompositionType(schema, rootSchema) !== undefined,
    ),
  ),
);

const COMPOSITION_KEYWORDS = ['oneOf', 'anyOf', 'allOf'];

/** Core filters combinator errors from child controls, so draw the parent error beside the editor. */
export const useScalarComposition = ({
  schema,
  rootSchema,
  uischema,
  path,
  label,
}: ControlProps) => {
  const ctx = useJsonForms();
  const compositionErrors = (ctx.core?.errors ?? []).filter(
    (error) =>
      getControlPath(error) === path &&
      COMPOSITION_KEYWORDS.includes(error.keyword),
  );
  const message =
    ctx.core?.validationMode !== 'ValidateAndHide' &&
    compositionErrors.length > 0
      ? getCombinedErrorMessage(
          compositionErrors,
          ctx.i18n?.translateError as any,
          ctx.i18n?.translate as any,
          schema,
          uischema,
          path,
        )
      : undefined;
  const delegated = {
    ...uischema,
    scope: '#',
    label: (uischema as { label?: unknown }).label ?? label,
  };
  return {
    delegated,
    delegatedSchema: scalarCompositionSchema(schema, rootSchema),
    message,
  };
};
