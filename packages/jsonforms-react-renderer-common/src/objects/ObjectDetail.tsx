import {
  UiSchemaCycleProvider,
  useUiSchemaCycleGuard,
} from '../core/uiSchemaCycle';
import type { AdditionalPropertiesProps } from './useAdditionalPropertyEntries';
import React, { useMemo } from 'react';
import {
  Generate,
  isObjectControl,
  type RankedTester,
  type ControlProps,
  type UISchemaElement,
} from '@jsonforms/core';
import { JsonFormsDispatch, useJsonForms } from '@jsonforms/react';
import { useDynamicTreeResolver } from '../dynamic/DynamicUiProvider';
import { findDetailUISchema } from '../core/detailUiSchema';
import {
  ObjectErrorContext,
  usePathErrorIndicator,
} from '../validation/errorSummary';
import {
  conditionalLayout,
  useConditionalFields,
  conditionalFieldsEnabled,
  hasConditionalFields,
} from './conditionalFields';

export const ObjectDetailContext = React.createContext<
  { uischema: UISchemaElement; additional: React.ReactNode } | undefined
>(undefined);

export function useObjectSchema({
  schema: originalSchema,
  rootSchema,
  data,
  uischema,
  config,
}: ControlProps) {
  const jsonforms = useJsonForms();
  const uischemas = useMemo(
    () => jsonforms.uischemas ?? [],
    [jsonforms.uischemas],
  );
  const conditional = useConditionalFields(
    originalSchema,
    rootSchema,
    data,
    uischema,
    config,
  );
  const schema = conditional.schema;
  const additionalSchema = {
    ...schema,
    properties: {
      ...Object.fromEntries([...conditional.known].map((key) => [key, {}])),
      ...schema.properties,
    },
  } as ControlProps['schema'];
  return { uischemas, conditional, schema, additionalSchema };
}

export function ObjectDetail({
  props,
  schema,
  uischema,
  diagnostics,
  errors,
  additional,
}: {
  props: ControlProps;
  schema: ControlProps['schema'];
  uischema: UISchemaElement;
  diagnostics: readonly string[];
  errors: string;
  additional: React.ReactNode;
}) {
  const elements = (uischema as { elements?: unknown[] }).elements;
  const showContent =
    uischema.type === 'Group' ||
    !Array.isArray(elements) ||
    elements.length > 0;
  return (
    <>
      {diagnostics.map((message) => (
        <div key={message} role='alert'>
          {message}
        </div>
      ))}
      <ObjectErrorContext.Provider value={{ uischema, message: errors }}>
        <ObjectDetailContext.Provider value={{ uischema, additional }}>
          {showContent && (
            <JsonFormsDispatch
              visible={props.visible}
              enabled={props.enabled}
              schema={schema}
              uischema={uischema}
              path={props.path}
              renderers={props.renderers}
              cells={props.cells}
              readonly={props.readonly}
            />
          )}
        </ObjectDetailContext.Provider>
      </ObjectErrorContext.Provider>
    </>
  );
}

export const objectControlTester: RankedTester = (ui, schema, context) =>
  isObjectControl(ui, schema, context)
    ? conditionalFieldsEnabled(ui, context.config) &&
      hasConditionalFields(schema)
      ? 25
      : 2
    : -1;

/** Assemble the shared object boundary while adapters retain their native outer frame. */
export function createObjectPresentation(
  AdditionalProperties: React.ComponentType<AdditionalPropertiesProps>,
) {
  return (
    props: ControlProps,
    state: ReturnType<typeof useObjectSchema>,
    uischema: UISchemaElement,
    stack: ReadonlySet<string>,
    errors: string,
  ) => {
    const isGroup = uischema.type === 'Group';
    const additional = (
      <AdditionalProperties
        {...props}
        embedded={Boolean(props.path) || isGroup}
        schema={state.additionalSchema}
        uischemas={state.uischemas}
      />
    );
    const detail = (
      <UiSchemaCycleProvider stack={stack}>
        <ObjectDetail
          props={props}
          schema={state.schema}
          uischema={uischema}
          diagnostics={state.conditional.diagnostics}
          errors={errors}
          additional={additional}
        />
      </UiSchemaCycleProvider>
    );
    return {
      isGroup,
      additional,
      detail,
      title:
        props.label && props.path && props.uischema.label !== false
          ? props.label
          : undefined,
    };
  };
}

export interface ObjectFrameProps {
  path: string;
  title?: string;
  errors: string;
  detail: React.ReactNode;
  additional: React.ReactNode;
}

/** Shared resolution and boundary ownership; native frames remain adapter-specific. */
export function createObjectRenderer(
  AdditionalProperties: React.ComponentType<AdditionalPropertiesProps>,
  Frame: React.ComponentType<ObjectFrameProps>,
  hideGeneratedLabel = false,
) {
  const presentation = createObjectPresentation(AdditionalProperties);
  return function ObjectRenderer(props: ControlProps) {
    const state = useObjectSchema(props);
    const { path, rootSchema, uischema, label } = props;
    const { schema, conditional, uischemas } = state;
    const generated = useMemo(
      () => ({
        ...Generate.uiSchema(
          schema,
          path ? 'Group' : 'VerticalLayout',
          undefined,
          rootSchema,
        ),
        ...(path
          ? {
              label:
                hideGeneratedLabel && uischema.label === false
                  ? undefined
                  : label,
            }
          : {}),
      }),
      [schema, path, rootSchema, uischema.label, label],
    );
    const detailUiSchema = useMemo(
      () =>
        findDetailUISchema(
          uischemas,
          schema,
          uischema.scope,
          path,
          () => generated,
          uischema,
          rootSchema,
        ),
      [uischemas, schema, uischema, path, generated, rootSchema],
    );
    const { cycle, stack } = useUiSchemaCycleGuard(
      detailUiSchema,
      path,
      'the object renderer',
    );
    const resolveTree = useDynamicTreeResolver(path);
    const dispatchUiSchema = conditionalLayout(
      resolveTree(cycle ? generated : detailUiSchema),
      schema,
      conditional.known,
    );
    const errors = usePathErrorIndicator(path, undefined, false);
    if (!props.visible) return null;
    const content = presentation(props, state, dispatchUiSchema, stack, errors);
    return content.isGroup ? (
      content.detail
    ) : (
      <Frame path={path} errors={errors} {...content} />
    );
  };
}
