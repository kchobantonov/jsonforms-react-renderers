import React from 'react';
import type {
  ControlElement,
  JsonSchema,
  StatePropsOfControlWithDetail,
} from '@jsonforms/core';
import {
  JsonFormsDispatch,
  type JsonFormsStateContext,
  ctxDispatchToControlProps,
  ctxToControlWithDetailProps,
  withJsonFormsContext,
} from '@jsonforms/react';
import {
  TuplePositionContext,
  tuplePositionEntry,
  type useTupleControl,
} from './useTupleControl';
import { tupleRenderSchema } from './tupleSchema';
import type { TupleAdditionalItemsProps } from './useTupleAdditionalItems';
import type { TupleFieldProps } from './TupleField';
export type TupleControlProps = StatePropsOfControlWithDetail & {
  handleChange: (path: string, value: unknown) => void;
};

export function TupleControlContent({
  props,
  model,
  TupleField,
  TupleAdditionalItems,
  diagnostic,
  gap,
}: {
  props: TupleControlProps;
  model: ReturnType<typeof useTupleControl>;
  TupleField: React.ComponentType<TupleFieldProps>;
  TupleAdditionalItems: React.ComponentType<TupleAdditionalItemsProps>;
  diagnostic: (message: string) => React.ReactNode;
  gap: number;
}) {
  const { path, rootSchema, schema } = props;
  const {
    t,
    options,
    vertical,
    definition,
    values,
    editable,
    positionLabel,
    fieldSchema,
    fieldUiSchema,
    positionLayout,
  } = model;
  const field = (index: number) => (
    <TupleField
      key={index}
      schema={fieldSchema(index)}
      prefix={definition?.prefix ?? []}
      index={index}
      arrayPath={path}
      rootSchema={rootSchema}
      uischema={fieldUiSchema(index)}
      enabled={editable}
      options={options}
    />
  );

  if (!definition) return <>{diagnostic(t('tuple.configuration'))}</>;
  return (
    <>
      {positionLayout ? (
        <div data-tuple-fields data-tuple-layout>
          <TuplePositionContext.Provider
            value={{
              count: definition.prefix.length,
              render: field,
              renderWithin: (index, scope) => (
                <JsonFormsDispatch
                  schema={tupleRenderSchema(fieldSchema(index)) as JsonSchema}
                  uischema={{ type: 'Control', scope } as ControlElement}
                  path={`${path}.${index}`}
                  renderers={props.renderers}
                  cells={props.cells}
                  enabled={editable}
                />
              ),
            }}
          >
            <JsonFormsDispatch
              schema={schema as JsonSchema}
              uischema={positionLayout}
              path={path}
              renderers={[...(props.renderers ?? []), tuplePositionEntry]}
              cells={props.cells}
              enabled={editable}
            />
          </TuplePositionContext.Provider>
        </div>
      ) : (
        <div
          data-tuple-fields
          style={{
            display: 'flex',
            flexDirection: vertical ? 'column' : 'row',
            flexWrap: vertical ? 'nowrap' : 'wrap',
            gap,
            alignItems: vertical ? 'stretch' : 'flex-start',
          }}
        >
          {definition.prefix.map((_, index) => field(index))}
        </div>
      )}
      {(definition.tail !== false ||
        values.length > definition.prefix.length) && (
        <TupleAdditionalItems
          definition={definition}
          config={props.config}
          path={path}
          data={values}
          schema={schema}
          rootSchema={rootSchema}
          options={options}
          enabled={editable}
          onChange={(next) => props.handleChange(path, next)}
          renderItem={field}
          positionLabel={positionLabel}
        />
      )}
    </>
  );
}
const withTupleProps = (Component: React.ComponentType<TupleControlProps>) =>
  function WithTupleProps({
    ctx,
    props,
  }: {
    ctx: JsonFormsStateContext;
    props: any;
  }) {
    if (!ctx.dispatch) return null;
    return (
      <Component
        {...props}
        {...ctxToControlWithDetailProps(ctx, props)}
        {...ctxDispatchToControlProps(ctx.dispatch)}
      />
    );
  };

export const connectTupleControl = (
  Component: React.ComponentType<TupleControlProps>,
) => withJsonFormsContext(withTupleProps(React.memo(Component)) as any);
