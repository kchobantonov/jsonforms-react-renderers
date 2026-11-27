import {
  useTranslator,
  useI18n,
} from '@chobantonov/jsonforms-react-renderer-common/locale/translate';

import { findMixedDetailUiSchema } from '@chobantonov/jsonforms-react-renderer-common/core/detailUiSchema';
import {
  ControlProps,
  createDefaultValue,
  findUISchema,
  isControl,
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

import {
  ANY_TYPES,
  getJsonDataType,
  getSchemaTypes,
  mixedControlFor,
  resolveMixedArrayItems,
  removeInapplicableKeywords,
  type JsonDataType,
} from '@chobantonov/jsonforms-react-renderer-common/mixed/mixedSchema';

export const schemaForType = (
  schema: JsonSchema,
  type: JsonDataType,
  rootSchema: JsonSchema,
): JsonSchema => {
  const nextSchema: JsonSchema7 = {
    ...(typeof schema === 'object' ? (schema as JsonSchema7) : {}),
    type,
  };
  delete nextSchema.anyOf;
  delete nextSchema.oneOf;
  delete nextSchema.allOf;
  removeInapplicableKeywords(nextSchema, type);

  if (type === 'object') {
    nextSchema.additionalProperties = nextSchema.additionalProperties ?? true;
  } else if (type === 'array') {
    const items = resolveMixedArrayItems(nextSchema.items, rootSchema);
    nextSchema.items =
      items && typeof items === 'object'
        ? (items as JsonSchema7 | JsonSchema7[])
        : { type: ANY_TYPES as JsonSchema7['type'] };
  }

  return nextSchema;
};

export const GenericMixedRendererComponent = ({
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
  const text = useI18n();
  const translateType = useTranslator();
  const jsonforms = useJsonForms();
  const uischemas = useMemo(
    () => jsonforms.uischemas ?? [],
    [jsonforms.uischemas],
  );
  const types = useMemo(() => getSchemaTypes(schema), [schema]);
  const dataType = getJsonDataType(data);
  const selectedType =
    dataType && types.includes(dataType)
      ? dataType
      : dataType === 'integer' && types.includes('number')
        ? 'number'
        : null;
  const selectedSchema = useMemo(
    () =>
      selectedType
        ? schemaForType(schema, selectedType, rootSchema)
        : undefined,
    [rootSchema, schema, selectedType],
  );
  const detailUiSchema = useMemo(
    () =>
      selectedSchema
        ? findMixedDetailUiSchema(
            selectedSchema,
            uischema,
            path,
            rootSchema,
            uischemas ?? [],
            findUISchema,
          )
        : undefined,
    [path, rootSchema, selectedSchema, uischema, uischemas],
  );

  if (!visible) {
    return null;
  }

  const renderedControl =
    selectedType !== 'null' && selectedSchema && detailUiSchema ? (
      <JsonFormsDispatch
        schema={selectedSchema}
        uischema={detailUiSchema}
        path={path}
        enabled={enabled}
        renderers={renderers}
        cells={cells}
        readonly={readonly}
      />
    ) : null;
  const isStructuredType =
    selectedType === 'object' || selectedType === 'array';

  return (
    <div className='jsonforms-mixed-renderer'>
      <label className='jsonforms-mixed-renderer-type'>
        {label ? <span>{label}</span> : null}
        <select
          disabled={!enabled}
          value={selectedType ?? ''}
          onChange={(event) => {
            const nextType = event.currentTarget.value as JsonDataType;
            const nextSchema = schemaForType(schema, nextType, rootSchema);
            handleChange(path, createDefaultValue(nextSchema, rootSchema));
          }}
        >
          <option disabled value=''>
            {text('mixed.typePlaceholder')}
          </option>
          {types.map((type) => (
            <option
              key={translateType(`mixed.type.${type}`, type)}
              value={type}
            >
              {translateType(`mixed.type.${type}`, type)}
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
  context: TesterContext,
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
        context?.rootSchema,
      );
      return Array.isArray(
        (currentDataSchema as JsonSchema7 | undefined)?.type,
      );
    }
  }

  return false;
};

export const isMixedControl = mixedControlFor(isMixedSchema);

export const genericMixedControlTester: RankedTester = rankWith(
  20,
  isMixedControl,
);

export const GenericMixedRenderer = withJsonFormsControlProps(
  GenericMixedRendererComponent,
);
