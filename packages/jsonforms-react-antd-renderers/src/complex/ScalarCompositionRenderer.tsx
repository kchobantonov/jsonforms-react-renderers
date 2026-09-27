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
} from '../util/scalarComposition';

/**
 * One input for a composition that describes one editor.
 *
 * Ranked above the three combinator renderers so it wins where it applies,
 * and below the finite-choice renderers (`oneOf`/`const`, string-or-enum
 * `anyOf`), which the specification says "take precedence where applicable".
 * The tester is conservative: anything it does not recognise falls through to
 * the branch presentation, which is the behaviour that loses nothing.
 */
export const scalarCompositionTester: RankedTester = rankWith(
  4,
  and(
    uiTypeIs('Control'),
    /*
      `schemaMatches` resolves the control's scope first. A tester is handed
      the schema the dispatch started from - the root, for a top-level control
      - not the schema at the scope, so testing the argument directly would
      never see the composition at all.
    */
    schemaMatches(
      (schema, rootSchema) =>
        scalarCompositionType(schema, rootSchema) !== undefined
    )
  )
);

const COMPOSITION_KEYWORDS = ['oneOf', 'anyOf', 'allOf'];

/** Pulled up under the input, where a Form.Item's own message would sit. */
const MESSAGE_STYLE: React.CSSProperties = { marginTop: -16, marginBottom: 16 };

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

  /*
    "A failed composition must provide localized feedback beside its single
    input under the shared validation-display rules."

    The renderer has to draw this itself. Core lists `oneOf`, `anyOf` and
    `allOf` in `filteredErrorKeywords`, so a composition error is never handed
    to a control - whatever schema that control is given. Without this the
    input sits there looking valid while the form is not.

    The branch errors underneath it - `maximum` from one alternative,
    `minimum` from the other - stay suppressed by core, which is what the
    section asks for: "Present that alternative-match failure rather than
    displaying both branch bounds as simultaneous requirements."
  */
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
  /*
    The scope is re-rooted to `#` because the dispatched schema *is* the
    value's schema - `path` already points at it. The label is carried
    explicitly: the outer Control's label is what the property is called, and
    deriving one from a `#` scope would produce nothing.
  */
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
          className='ant-form-item-explain ant-form-item-explain-error'
          style={MESSAGE_STYLE}
        >
          {message}
        </div>
      ) : null}
    </>
  );
};

export default withJsonFormsControlProps(ScalarCompositionRenderer);
