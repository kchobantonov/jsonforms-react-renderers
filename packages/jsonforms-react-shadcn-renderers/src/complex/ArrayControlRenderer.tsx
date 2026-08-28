import {
  ArrayLayoutProps,
  composePaths,
  createDefaultValue,
  Generate,
  getFirstPrimitiveProp,
  isObjectArrayControl,
  isPrimitiveArrayControl,
  or,
  RankedTester,
  rankWith,
  Resolve,
} from '@jsonforms/core';
import { JsonFormsDispatch, useJsonForms } from '@jsonforms/react';
import React from 'react';

export const ShadcnArrayRenderer = ({
  addItem,
  cells,
  data,
  enabled,
  label,
  path,
  removeItems,
  renderers,
  rootSchema,
  schema,
  uischema,
  visible,
}: ArrayLayoutProps) => {
  const ctx = useJsonForms();
  if (!visible) return null;
  const detail =
    (uischema.options?.detail as any) ??
    Generate.uiSchema(schema, 'VerticalLayout', undefined, rootSchema);
  const childLabelProp =
    uischema.options?.elementLabelProp ??
    uischema.options?.childLabelProp ??
    getFirstPrimitiveProp(schema);

  const childLabelForIndex = (childPath: string, index: number) => {
    if (!childLabelProp) {
      return `${index}`;
    }
    const labelValue = Resolve.data(
      ctx.core.data,
      composePaths(childPath, childLabelProp)
    );
    if (
      labelValue === undefined ||
      labelValue === null ||
      Number.isNaN(labelValue)
    ) {
      return '';
    }
    return `${labelValue}`;
  };

  return (
    <div className='shadcn-jsonforms-array'>
      <div className='shadcn-jsonforms-array-header'>
        <h3>{label}</h3>
        <button
          className='shadcn-jsonforms-button'
          type='button'
          disabled={!enabled}
          onClick={addItem(path, createDefaultValue(schema, rootSchema))}
        >
          Add
        </button>
      </div>
      {Array.from({ length: data }, (_, index) => {
        const childPath = composePaths(path, `${index}`);
        const childLabel = childLabelForIndex(childPath, index);
        return (
          <div className='shadcn-jsonforms-array-item' key={childPath}>
            {childLabel ? (
              <h4 className='shadcn-jsonforms-array-item-label'>
                {childLabel}
              </h4>
            ) : null}
            <JsonFormsDispatch
              schema={schema}
              uischema={detail}
              path={childPath}
              enabled={enabled}
              renderers={renderers}
              cells={cells}
            />
            <button
              className='shadcn-jsonforms-button shadcn-jsonforms-button-danger'
              type='button'
              disabled={!enabled}
              onClick={removeItems(path, [index])}
            >
              Remove
            </button>
          </div>
        );
      })}
    </div>
  );
};

export const arrayControlTester: RankedTester = rankWith(
  3,
  or(isObjectArrayControl, isPrimitiveArrayControl)
);
