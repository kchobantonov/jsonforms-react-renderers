import React from 'react';
import {
  ControlProps,
  RankedTester,
  and,
  getCombinedErrorMessage,
  getControlPath,
  rankWith,
  schemaMatches,
  uiTypeIs,
} from '@jsonforms/core';
import {
  JsonFormsDispatch,
  useJsonForms,
  withJsonFormsControlProps,
} from '@jsonforms/react';
import {
  scalarCompositionSchema,
  scalarCompositionType,
} from '@chobantonov/jsonforms-react-renderer-common/scalarComposition';

export const scalarCompositionTester: RankedTester = rankWith(
  4,
  and(
    uiTypeIs('Control'),

    schemaMatches(
      (schema, rootSchema) =>
        scalarCompositionType(schema, rootSchema) !== undefined
    )
  )
);

const COMPOSITION_KEYWORDS = ['oneOf', 'anyOf', 'allOf'];

const MESSAGE_STYLE: React.CSSProperties = { marginBottom: 16 };

export const ScalarCompositionRenderer = ({
  schema,
  rootSchema,
  uischema,
  path,
  renderers,
  cells,
  label,
  visible,
}: ControlProps) => {
  const ctx = useJsonForms();

  const compositionErrors = (ctx.core?.errors ?? []).filter(
    (error) =>
      getControlPath(error) === path &&
      COMPOSITION_KEYWORDS.includes(error.keyword)
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
          path
        )
      : undefined;

  if (visible === false) {
    return null;
  }

  const delegated = {
    ...uischema,
    scope: '#',
    label: (uischema as { label?: unknown }).label ?? label,
  };
  return (
    <>
      <JsonFormsDispatch
        uischema={delegated as any}
        schema={scalarCompositionSchema(schema, rootSchema)}
        path={path}
        renderers={renderers}
        cells={cells}
      />
      {message ? (
        <div
          role='alert'
          data-composition-error
          className='text-destructive text-sm'
          style={MESSAGE_STYLE}
        >
          {message}
        </div>
      ) : null}
    </>
  );
};

export default withJsonFormsControlProps(ScalarCompositionRenderer);
