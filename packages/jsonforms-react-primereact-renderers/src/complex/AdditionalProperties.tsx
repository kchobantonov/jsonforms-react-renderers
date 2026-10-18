import { DynamicPropertyProvider } from '@chobantonov/jsonforms-react-renderer-common/dynamicProperties';
import { PrimeIconButton } from '../prime-controls/PrimeIconButton';
import { InputText } from 'primereact/inputtext';
import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/translate';
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
      Object.keys(objectSchema.patternProperties).length > 0,
    ) ||
    typeof objectSchema.additionalProperties === 'object' ||
    objectSchema.additionalProperties === true
  );
};

const getMatchingAdditionalPropertySchema = (
  propName: string,
  parentSchema: JsonSchema,
  rootSchema: JsonSchema,
  allowIfMissing: boolean,
): JsonSchema => {
  const objectSchema = toObjectSchema(parentSchema);
  let propSchema: JsonSchema | undefined;

  if (objectSchema.patternProperties) {
    const matchedPattern = Object.keys(objectSchema.patternProperties).find(
      (pattern) => new RegExp(pattern).test(propName),
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
  allowIfMissing: boolean,
): AdditionalPropertyItem => {
  let propSchema = getMatchingAdditionalPropertySchema(
    propName,
    parentSchema,
    rootSchema,
    allowIfMissing,
  );
  let propUiSchema: UISchemaElement = createControlElement('#');

  if (typeof propSchema === 'object' && propSchema.type === 'array') {
    propUiSchema = Generate.uiSchema(
      propSchema,
      'Group',
      undefined,
      rootSchema,
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
          ? (propSchema.additionalProperties ?? true)
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
  rootSchema: JsonSchema,
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
  t: ReturnType<typeof useI18n>,
  currentPropertyName?: string,
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
    return t('additionalProperties.nameTaken', { name: propertyName });
  }

  if (
    propertyName.includes('[') ||
    propertyName.includes(']') ||
    propertyName.includes('.')
  ) {
    return t('additionalProperties.nameInvalid', { name: propertyName });
  }

  const pattern = getPropertyNamePattern(schema, rootSchema);
  if (pattern && !new RegExp(pattern).test(propertyName)) {
    return t('additionalProperties.namePattern');
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
  const t = useI18n();
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
    (key) => !reservedPropertyNames.includes(key),
  );
  const additionalPropertyItems = useMemo(
    () =>
      additionalKeys.map((propertyName) =>
        toAdditionalPropertyItem(
          propertyName,
          path,
          schema,
          rootSchema,
          allowIfMissing,
        ),
      ),
    [additionalKeys.join('\u0000'), allowIfMissing, path, rootSchema, schema],
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
    rootSchema,
    t,
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
      allowIfMissing,
    );
    const updatedData = objectData ? { ...objectData } : {};

    updatedData[propertyName] = createDefaultValue(
      additionalProperty.schema,
      rootSchema,
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
      t,
      propertyToRename,
    );
    if (
      !enabled ||
      readonly ||
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
      ]),
    );
    handleChange(path, updatedData);
    setRenamingPropertyName(null);
    setRenameValue('');
  };

  return (
    <div className='jsonforms-additional-properties'>
      <div className='jsonforms-additional-properties-add'>
        <InputText
          aria-label={
            label
              ? t('additionalProperties.addTo', { label })
              : t('additionalProperties.add')
          }
          disabled={!enabled || readonly}
          placeholder={t('additionalProperties.namePlaceholder')}
          type='text'
          value={newPropertyName}
          onChange={(event) => setNewPropertyName(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              addProperty();
            }
          }}
        />
        <PrimeIconButton
          icon='pi pi-plus'
          aria-label={t('additionalProperties.add')}
          tooltip={t('additionalProperties.add')}
          disabled={addPropertyDisabled}
          onClick={addProperty}
        />
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
            t,
            item.propertyName,
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
                <DynamicPropertyProvider path={item.path}>
                  <JsonFormsDispatch
                    schema={item.schema}
                    uischema={item.uischema}
                    path={item.path}
                    enabled={enabled}
                    renderers={renderers}
                    cells={cells}
                    readonly={readonly}
                  />
                </DynamicPropertyProvider>
              </div>
              {enabled ? (
                <div className='jsonforms-additional-property-actions'>
                  {isRenaming ? (
                    <>
                      <InputText
                        aria-label={t('additionalProperties.renameNamed', {
                          name: item.propertyName,
                        })}
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
                      <PrimeIconButton
                        icon='pi pi-check'
                        aria-label={t('additionalProperties.renameConfirm')}
                        tooltip={t('additionalProperties.renameConfirm')}
                        disabled={renameDisabled}
                        onClick={() => renameProperty(item.propertyName)}
                      />
                      <PrimeIconButton
                        icon='pi pi-times'
                        aria-label={t('composite.cancel')}
                        tooltip={t('composite.cancel')}
                        onClick={() => {
                          setRenamingPropertyName(null);
                          setRenameValue('');
                        }}
                      />
                      {renameError ? (
                        <div className='jsonforms-additional-properties-error'>
                          {renameError}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <PrimeIconButton
                        icon='pi pi-pencil'
                        aria-label={t('additionalProperties.renameNamed', {
                          name: item.propertyName,
                        })}
                        tooltip={t('additionalProperties.renameNamed', {
                          name: item.propertyName,
                        })}
                        disabled={readonly}
                        onClick={() => {
                          setRenamingPropertyName(item.propertyName);
                          setRenameValue(item.propertyName);
                        }}
                      />
                      <PrimeIconButton
                        icon='pi pi-trash'
                        aria-label={t('additionalProperties.deleteNamed', {
                          name: item.propertyName,
                        })}
                        tooltip={t('additionalProperties.deleteNamed', {
                          name: item.propertyName,
                        })}
                        disabled={removePropertyDisabled}
                        onClick={() => removeProperty(item.propertyName)}
                      />
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
