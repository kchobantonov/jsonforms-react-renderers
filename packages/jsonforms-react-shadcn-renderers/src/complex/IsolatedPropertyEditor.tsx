import {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  UISchemaElement,
} from '@jsonforms/core';
import { JsonForms, useJsonForms } from '@jsonforms/react';
import isEqual from 'lodash/isEqual';
import React, { useRef } from 'react';

export interface ShadcnIsolatedPropertyEditorProps {
  value: unknown;
  schema: JsonSchema;
  uischema: UISchemaElement;
  enabled: boolean;
  readonly?: boolean;
  renderers?: JsonFormsRendererRegistryEntry[];
  cells?: JsonFormsCellRendererRegistryEntry[];
  onChange: (value: unknown) => void;
}

/**
 * Edits one dynamic property's value in a form of its own, rooted at that
 * value.
 *
 * This exists because **some property names cannot be addressed by a data
 * path**. JSON Forms separates path segments with `.` and has no escape for
 * one, so a property literally called `""` or `a.b` has no path: composing an
 * empty segment yields the parent's own path, and a control dispatched there
 * would edit the whole containing object rather than that property. Composing a
 * dotted name yields a path that points at a nested property nobody declared.
 *
 * So the value is edited in isolation - `scope: "#"`, no path at all - and
 * written back to the containing object under its exact key by the caller. This
 * is the "literal-key editing" contract of section 18.
 *
 * The parent form's validator, locale and validation mode are passed in, so
 * errors and labels behave as they do everywhere else. What does **not** cross
 * the boundary is the error *list*: this form validates its own value, so those
 * errors are shown here but are not part of the containing form's error count.
 * That is a real limitation of editing in isolation, and the price of being
 * able to edit the property at all.
 */
export const ShadcnIsolatedPropertyEditor = ({
  value,
  schema,
  uischema,
  enabled,
  readonly,
  renderers,
  cells,
  onChange,
}: ShadcnIsolatedPropertyEditorProps) => {
  const parent = useJsonForms();
  /*
    JsonForms reports once on mount with the data it was given. Writing that
    back would replace the containing object with an equal copy, which
    re-renders this editor with a new `data` identity and reports again - a
    loop. Only a real change is forwarded.
  */
  const latest = useRef(value);
  latest.current = value;

  return (
    <JsonForms
      data={value}
      schema={schema}
      uischema={uischema}
      renderers={renderers ?? parent.renderers ?? []}
      cells={cells ?? parent.cells ?? []}
      readonly={!enabled || Boolean(readonly)}
      ajv={parent.core?.ajv}
      validationMode={parent.core?.validationMode}
      i18n={parent.i18n}
      onChange={({ data }) => {
        if (isEqual(data, latest.current)) {
          return;
        }
        latest.current = data;
        onChange(data);
      }}
    />
  );
};
