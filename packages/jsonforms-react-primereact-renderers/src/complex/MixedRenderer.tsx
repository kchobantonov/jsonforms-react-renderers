import {
  ControlElement,
  ControlProps,
  createControlElement,
  createDefaultValue,
  findUISchema,
  isControl,
  JsonFormsUISchemaRegistryEntry,
  JsonSchema,
  JsonSchema7,
  rankWith,
  RankedTester,
  resolveSchema,
  Scopable,
  TesterContext,
  UISchemaElement,
} from '@jsonforms/core';
import {
  JsonFormsDispatch,
  useJsonForms,
  withJsonFormsControlProps,
} from '@jsonforms/react';
import React, { useMemo } from 'react';

type JsonDataType =
  | 'array'
  | 'boolean'
  | 'integer'
  | 'null'
  | 'number'
  | 'object'
  | 'string';

const ANY_TYPES: JsonDataType[] = [
  'array',
  'boolean',
  'integer',
  'null',
  'number',
  'object',
  'string',
];

const getJsonDataType = (value: any): JsonDataType | null => {
  if (typeof value === 'string') {
    return 'string';
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'integer' : 'number';
  }
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'object') {
    return 'object';
  }

  return null;
};

const getSchemaTypes = (schema: JsonSchema): JsonDataType[] => {
  if (typeof schema !== 'object') {
    return ANY_TYPES;
  }

  if (typeof schema.type === 'string') {
    return [schema.type as JsonDataType];
  }

  if (Array.isArray(schema.type)) {
    return schema.type as JsonDataType[];
  }

  return ANY_TYPES;
};

const schemaForType = (
  schema: JsonSchema,
  type: JsonDataType,
  rootSchema: JsonSchema
): JsonSchema => {
  const nextSchema: JsonSchema7 = {
    ...(typeof schema === 'object' ? (schema as JsonSchema7) : {}),
    type,
  };

  if (type === 'object') {
    nextSchema.additionalProperties =
      nextSchema.additionalProperties !== false
        ? nextSchema.additionalProperties ?? true
        : false;
  } else if (type === 'array') {
    const items =
      typeof nextSchema.items === 'object' &&
      typeof (nextSchema.items as JsonSchema).$ref === 'string'
        ? resolveSchema(
            rootSchema,
            (nextSchema.items as JsonSchema).$ref,
            rootSchema
          ) ?? nextSchema.items
        : nextSchema.items;
    nextSchema.items =
      items && typeof items === 'object'
        ? (items as JsonSchema7 | JsonSchema7[])
        : { type: ANY_TYPES as JsonSchema7['type'] };
  }

  return nextSchema;
};

const findDetailUiSchema = (
  schema: JsonSchema,
  uischema: ControlElement,
  path: string,
  rootSchema: JsonSchema,
  uischemas: JsonFormsUISchemaRegistryEntry[]
) =>
  findUISchema(
    uischemas,
    schema,
    uischema.scope,
    path,
    () => createControlElement('#'),
    uischema,
    rootSchema
  );

export const MixedRendererComponent = ({
  cells,
  data,
  enabled,
  handleChange,
  label,
  path,
  renderers,
  readonly,
  rootSchema,
  schema,
  uischema,
  visible,
}: ControlProps) => {
  const jsonforms = useJsonForms();
  const uischemas = jsonforms.uischemas ?? [];
  const types = useMemo(() => getSchemaTypes(schema), [schema]);
  const selectedType =
    getJsonDataType(data) ?? types.find((type) => type !== 'null') ?? types[0];
  const selectedSchema = useMemo(
    () => schemaForType(schema, selectedType, rootSchema),
    [rootSchema, schema, selectedType]
  );
  const detailUiSchema = useMemo(
    () =>
      findDetailUiSchema(
        selectedSchema,
        uischema,
        path,
        rootSchema,
        uischemas ?? []
      ),
    [path, rootSchema, selectedSchema, uischema, uischemas]
  );

  if (!visible) {
    return null;
  }

  const renderedControl = (
    <JsonFormsDispatch
      schema={selectedSchema}
      uischema={detailUiSchema}
      path={path}
      enabled={enabled}
      renderers={renderers}
      cells={cells}
      readonly={readonly}
    />
  );
  const isStructuredType =
    selectedType === 'object' || selectedType === 'array';

  return (
    <div className='jsonforms-mixed-renderer'>
      <label className='jsonforms-mixed-renderer-type'>
        {label ? <span>{label}</span> : null}
        <select
          disabled={!enabled}
          value={selectedType}
          onChange={(event) => {
            const nextType = event.currentTarget.value as JsonDataType;
            const nextSchema = schemaForType(schema, nextType, rootSchema);
            handleChange(path, createDefaultValue(nextSchema, rootSchema));
          }}
        >
          {types.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
      {isStructuredType ? (
        <details
          className='jsonforms-mixed-renderer-detail'
          key={selectedType}
          open
        >
          <summary>{selectedType}</summary>
          {renderedControl}
        </details>
      ) : (
        renderedControl
      )}
    </div>
  );
};

export const isMixedSchema = (
  uischema: UISchemaElement & Scopable,
  schema: JsonSchema,
  context: TesterContext
) => {
  if (schema && typeof schema === 'boolean') {
    return true;
  }

  if (!schema || typeof schema !== 'object') {
    return false;
  }

  if (Array.isArray(schema.type)) {
    return true;
  }

  if (schema.type === undefined && isControl(uischema)) {
    return true;
  }

  if (schema.type === 'object') {
    const schemaPath = uischema.scope;
    if (schemaPath) {
      const currentDataSchema = resolveSchema(
        schema,
        schemaPath,
        context?.rootSchema
      );
      return Array.isArray(
        (currentDataSchema as JsonSchema7 | undefined)?.type
      );
    }
  }

  return false;
};

const isDefaultGeneratedUiSchema = (uischema: UISchemaElement): boolean => {
  const elements = (uischema as any)?.elements;
  return (
    (uischema.type === 'VerticalLayout' || uischema.type === 'Group') &&
    Array.isArray(elements) &&
    elements.length === 1 &&
    elements[0].scope === '#' &&
    elements[0].type === 'Control'
  );
};

export const isMixedControl = (
  uischema: UISchemaElement,
  schema: JsonSchema,
  context: TesterContext
) =>
  isMixedSchema(uischema as UISchemaElement & Scopable, schema, context) &&
  (isControl(uischema) || isDefaultGeneratedUiSchema(uischema));

export const mixedControlTester: RankedTester = rankWith(20, isMixedControl);

export const MixedRenderer = withJsonFormsControlProps(MixedRendererComponent);
