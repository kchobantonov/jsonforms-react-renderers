import {
  composePaths,
  ControlElement,
  createControlElement,
  createDefaultValue,
  Generate,
  GroupLayout,
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonFormsUISchemaRegistryEntry,
  JsonSchema,
  JsonSchema7,
  resolveSchema,
  UISchemaElement,
} from '@jsonforms/core';
import { JsonFormsDispatch } from '@jsonforms/react';
import React, { useMemo, useState } from 'react';
import { useShadcnComponents } from '../components';

const ANY_TYPE: JsonSchema7['type'] = [
  'array',
  'boolean',
  'integer',
  'null',
  'number',
  'object',
  'string',
];

type AdditionalPropertyItem = {
  propertyName: string;
  path: string;
  schema: JsonSchema;
  uischema: UISchemaElement;
};

export type AdditionalPropertiesProps = {
  cells?: JsonFormsCellRendererRegistryEntry[];
  config?: any;
  data: any;
  enabled: boolean;
  handleChange(path: string, value: any): void;
  label: string;
  path: string;
  readonly?: boolean;
  renderers?: JsonFormsRendererRegistryEntry[];
  rootSchema: JsonSchema;
  schema: JsonSchema;
  uischema: ControlElement;
  uischemas?: JsonFormsUISchemaRegistryEntry[];
};

const toObjectSchema = (schema: JsonSchema): JsonSchema7 =>
  typeof schema === 'object' ? (schema as JsonSchema7) : {};

const hasAdditionalProperties = (schema: JsonSchema): boolean => {
  const objectSchema = toObjectSchema(schema);
  return (
    Boolean(
      objectSchema.patternProperties &&
        Object.keys(objectSchema.patternProperties).length > 0
    ) ||
    typeof objectSchema.additionalProperties === 'object' ||
    objectSchema.additionalProperties === true
  );
};

const getMatchingAdditionalPropertySchema = (
  propName: string,
  parentSchema: JsonSchema,
  rootSchema: JsonSchema,
  allowIfMissing: boolean
): JsonSchema => {
  const objectSchema = toObjectSchema(parentSchema);
  let propSchema: JsonSchema | undefined;

  if (objectSchema.patternProperties) {
    const matchedPattern = Object.keys(objectSchema.patternProperties).find(
      (pattern) => new RegExp(pattern).test(propName)
    );
    if (matchedPattern) {
      propSchema = objectSchema.patternProperties[matchedPattern];
    }
  }

  if (
    !propSchema &&
    (typeof objectSchema.additionalProperties === 'object' ||
      objectSchema.additionalProperties === true)
  ) {
    propSchema =
      objectSchema.additionalProperties === true
        ? { type: ANY_TYPE }
        : objectSchema.additionalProperties;
  }

  if (!propSchema && allowIfMissing) {
    propSchema = { type: ANY_TYPE };
  }

  if (typeof propSchema === 'object' && typeof propSchema.$ref === 'string') {
    propSchema = resolveSchema(rootSchema, propSchema.$ref, rootSchema);
  }

  propSchema = propSchema ?? { type: ANY_TYPE };

  if (typeof propSchema === 'object' && propSchema.type === undefined) {
    propSchema = {
      ...propSchema,
      type: ANY_TYPE,
    };
  }

  return propSchema;
};

const toAdditionalPropertyItem = (
  propName: string,
  parentPath: string,
  parentSchema: JsonSchema,
  rootSchema: JsonSchema,
  allowIfMissing: boolean
): AdditionalPropertyItem => {
  let propSchema = getMatchingAdditionalPropertySchema(
    propName,
    parentSchema,
    rootSchema,
    allowIfMissing
  );
  let propUiSchema: UISchemaElement = createControlElement('#');

  if (typeof propSchema === 'object' && propSchema.type === 'array') {
    propUiSchema = Generate.uiSchema(
      propSchema,
      'Group',
      undefined,
      rootSchema
    );
    (propUiSchema as GroupLayout).label = propSchema.title ?? propName;
  }

  if (typeof propSchema === 'object') {
    propSchema = {
      ...propSchema,
      title: propName,
    };

    if (propSchema.type === 'object') {
      propSchema.additionalProperties =
        propSchema.additionalProperties !== false
          ? propSchema.additionalProperties ?? true
          : false;
    } else if (propSchema.type === 'array') {
      propSchema.items = propSchema.items ?? {};
    }
  }

  return {
    propertyName: propName,
    path: composePaths(parentPath, propName),
    schema: propSchema,
    uischema: propUiSchema,
  };
};

const getPropertyNamePattern = (
  schema: JsonSchema,
  rootSchema: JsonSchema
): string | undefined => {
  const objectSchema = toObjectSchema(schema);
  let propertyNames = objectSchema.propertyNames as JsonSchema7 | undefined;
  if (
    typeof propertyNames === 'object' &&
    typeof propertyNames.$ref === 'string'
  ) {
    propertyNames =
      (resolveSchema(rootSchema, propertyNames.$ref, rootSchema) as
        | JsonSchema7
        | undefined) ?? propertyNames;
  }

  if (typeof propertyNames === 'object' && propertyNames.pattern) {
    return propertyNames.pattern;
  }

  if (
    objectSchema.additionalProperties === false &&
    objectSchema.patternProperties
  ) {
    const patterns = Object.keys(objectSchema.patternProperties);
    return patterns.length > 0 ? patterns.join('|') : undefined;
  }

  return undefined;
};

const validatePropertyName = (
  propertyName: string,
  data: any,
  schema: JsonSchema,
  rootSchema: JsonSchema,
  currentPropertyName?: string
): string | undefined => {
  if (!propertyName) {
    return undefined;
  }

  if (
    typeof data === 'object' &&
    data !== null &&
    Object.prototype.hasOwnProperty.call(data, propertyName) &&
    propertyName !== currentPropertyName
  ) {
    return `Property '${propertyName}' already defined`;
  }

  if (
    propertyName.includes('[') ||
    propertyName.includes(']') ||
    propertyName.includes('.')
  ) {
    return `Property name '${propertyName}' is invalid`;
  }

  const pattern = getPropertyNamePattern(schema, rootSchema);
  if (pattern && !new RegExp(pattern).test(propertyName)) {
    return `Property name must match pattern: ${pattern}`;
  }

  return undefined;
};

export const AdditionalProperties = ({
  cells,
  config,
  data,
  enabled,
  handleChange,
  label,
  path,
  readonly,
  renderers,
  rootSchema,
  schema,
  uischema,
}: AdditionalPropertiesProps) => {
  const { Button, Input } = useShadcnComponents();
  const [newPropertyName, setNewPropertyName] = useState('');
  const [renamingPropertyName, setRenamingPropertyName] = useState<
    string | null
  >(null);
  const [renameValue, setRenameValue] = useState('');
  const objectSchema = toObjectSchema(schema);
  const appliedOptions = { ...(config ?? {}), ...(uischema.options ?? {}) };
  const objectData =
    typeof data === 'object' && data !== null && !Array.isArray(data)
      ? data
      : undefined;
  const allowIfMissing =
    appliedOptions.allowAdditionalPropertiesIfMissing === true &&
    objectSchema.additionalProperties === undefined;
  const reservedPropertyNames = Object.keys(objectSchema.properties ?? {});
  const additionalKeys = Object.keys(objectData ?? {}).filter(
    (key) => !reservedPropertyNames.includes(key)
  );
  const additionalPropertyItems = useMemo(
    () =>
      additionalKeys.map((propertyName) =>
        toAdditionalPropertyItem(
          propertyName,
          path,
          schema,
          rootSchema,
          allowIfMissing
        )
      ),
    [additionalKeys.join('\u0000'), allowIfMissing, path, rootSchema, schema]
  );
  const shouldShow =
    hasAdditionalProperties(schema) ||
    allowIfMissing ||
    additionalKeys.length > 0;

  if (!shouldShow) {
    return null;
  }

  const propertyName = newPropertyName.trim();
  const propertyNameError = validatePropertyName(
    propertyName,
    data,
    schema,
    rootSchema
  );
  const maxPropertiesReached =
    objectSchema.maxProperties !== undefined &&
    objectData &&
    Object.keys(objectData).length >= objectSchema.maxProperties;
  const minPropertiesReached =
    objectSchema.minProperties !== undefined &&
    objectData &&
    Object.keys(objectData).length <= objectSchema.minProperties;
  const addPropertyDisabled =
    !enabled ||
    readonly ||
    (appliedOptions.restrict && maxPropertiesReached) ||
    Boolean(propertyNameError) ||
    !propertyName;
  const removePropertyDisabled =
    !enabled || readonly || (appliedOptions.restrict && minPropertiesReached);

  const addProperty = () => {
    if (addPropertyDisabled) {
      return;
    }

    const additionalProperty = toAdditionalPropertyItem(
      propertyName,
      path,
      schema,
      rootSchema,
      allowIfMissing
    );
    const updatedData = objectData ? { ...objectData } : {};

    updatedData[propertyName] = createDefaultValue(
      additionalProperty.schema,
      rootSchema
    );
    handleChange(path, updatedData);
    setNewPropertyName('');
  };

  const removeProperty = (propertyToRemove: string) => {
    if (removePropertyDisabled || !objectData) {
      return;
    }

    const updatedData = { ...objectData };
    delete updatedData[propertyToRemove];
    handleChange(path, updatedData);
  };

  const renameProperty = (propertyToRename: string) => {
    const trimmed = renameValue.trim();
    const renameError = validatePropertyName(
      trimmed,
      data,
      schema,
      rootSchema,
      propertyToRename
    );
    if (
      renameError ||
      !trimmed ||
      trimmed === propertyToRename ||
      !objectData
    ) {
      return;
    }

    const updatedData = Object.fromEntries(
      Object.entries(objectData).map(([key, value]) => [
        key === propertyToRename ? trimmed : key,
        value,
      ])
    );
    handleChange(path, updatedData);
    setRenamingPropertyName(null);
    setRenameValue('');
  };

  return (
    <div className='jsonforms-additional-properties'>
      <div className='jsonforms-additional-properties-add'>
        <Input
          aria-label={label ? `Add property to ${label}` : 'Add property'}
          disabled={!enabled || readonly}
          placeholder='Property name'
          type='text'
          value={newPropertyName}
          onChange={(event) => setNewPropertyName(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              addProperty();
            }
          }}
        />
        <Button
          disabled={addPropertyDisabled}
          type='button'
          onClick={addProperty}
        >
          Add
        </Button>
      </div>
      {propertyNameError ? (
        <div className='jsonforms-additional-properties-error'>
          {propertyNameError}
        </div>
      ) : null}
      <div className='jsonforms-additional-properties-list'>
        {additionalPropertyItems.map((item) => {
          const isRenaming = renamingPropertyName === item.propertyName;
          const renameError = validatePropertyName(
            renameValue.trim(),
            data,
            schema,
            rootSchema,
            item.propertyName
          );
          const renameDisabled =
            !enabled ||
            readonly ||
            Boolean(renameError) ||
            !renameValue.trim() ||
            renameValue.trim() === item.propertyName;

          return (
            <div
              className='jsonforms-additional-property'
              key={item.propertyName}
            >
              <div className='jsonforms-additional-property-control'>
                <JsonFormsDispatch
                  schema={item.schema}
                  uischema={item.uischema}
                  path={item.path}
                  enabled={enabled}
                  renderers={renderers}
                  cells={cells}
                  readonly={readonly}
                />
              </div>
              {enabled ? (
                <div className='jsonforms-additional-property-actions'>
                  {isRenaming ? (
                    <>
                      <Input
                        aria-label={`Rename ${item.propertyName}`}
                        autoFocus
                        disabled={readonly}
                        type='text'
                        value={renameValue}
                        onChange={(event) =>
                          setRenameValue(event.currentTarget.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            renameProperty(item.propertyName);
                          } else if (event.key === 'Escape') {
                            setRenamingPropertyName(null);
                            setRenameValue('');
                          }
                        }}
                      />
                      <Button
                        disabled={renameDisabled}
                        type='button'
                        onClick={() => renameProperty(item.propertyName)}
                      >
                        Save
                      </Button>
                      <Button
                        variant='ghost'
                        type='button'
                        onClick={() => {
                          setRenamingPropertyName(null);
                          setRenameValue('');
                        }}
                      >
                        Cancel
                      </Button>
                      {renameError ? (
                        <div className='jsonforms-additional-properties-error'>
                          {renameError}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <Button
                        variant='outline'
                        disabled={readonly}
                        type='button'
                        onClick={() => {
                          setRenamingPropertyName(item.propertyName);
                          setRenameValue(item.propertyName);
                        }}
                      >
                        Rename
                      </Button>
                      <Button
                        variant='destructive'
                        disabled={removePropertyDisabled}
                        type='button'
                        onClick={() => removeProperty(item.propertyName)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
