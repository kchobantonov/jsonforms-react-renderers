import {
  useAdditionalPropertyItems,
  type AdditionalPropertiesProps,
} from '@chobantonov/jsonforms-react-renderer-common/objects/useAdditionalPropertyEntries';
import {
  renamePropertyKey,
  toObjectSchema,
  toAdditionalPropertyItem,
} from '@chobantonov/jsonforms-react-renderer-common/objects/additionalProperties';
import {
  createDefaultValue,
  JsonSchema,
  JsonSchema7,
  resolveSchema,
} from '@jsonforms/core';
import { JsonFormsDispatch } from '@jsonforms/react';
import { useExtendedTranslator } from '../util/useExtendedTranslator';

/** The translator `useExtendedTranslator` returns. */
type ExtendedTranslator = ReturnType<typeof useExtendedTranslator>;
import React, { useState } from 'react';

export type GenericAdditionalPropertiesProps = Omit<
  AdditionalPropertiesProps,
  'embedded'
>;

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

/*
  Takes the translator rather than calling the hook: it is a plain function,
  used twice per render (the add box and the row being renamed), and a hook
  cannot be called from either position.
*/
const validatePropertyName = (
  t: ExtendedTranslator,
  propertyName: string,
  data: any,
  schema: JsonSchema,
  rootSchema: JsonSchema,
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
    return t('additionalProperties.namePattern', { pattern });
  }

  return undefined;
};

export const GenericAdditionalProperties = ({
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
}: GenericAdditionalPropertiesProps) => {
  const t = useExtendedTranslator();
  const [newPropertyName, setNewPropertyName] = useState('');
  const [renamingPropertyName, setRenamingPropertyName] = useState<
    string | null
  >(null);
  const [renameValue, setRenameValue] = useState('');
  const {
    maxPropertiesReached,
    minPropertiesReached,
    appliedOptions,
    objectData,
    allowIfMissing,
    additionalPropertyItems,
    shouldShow,
  } = useAdditionalPropertyItems({
    data,
    schema,
    rootSchema,
    path,
    uischema,
    config,
  });

  if (!shouldShow) {
    return null;
  }

  const propertyName = newPropertyName.trim();
  const propertyNameError = validatePropertyName(
    t,
    propertyName,
    data,
    schema,
    rootSchema,
  );
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
      t,
      trimmed,
      data,
      schema,
      rootSchema,
      propertyToRename,
    );
    if (
      renameError ||
      !trimmed ||
      trimmed === propertyToRename ||
      !objectData
    ) {
      return;
    }

    const updatedData = renamePropertyKey(
      objectData,
      propertyToRename,
      trimmed,
    );
    handleChange(path, updatedData);
    setRenamingPropertyName(null);
    setRenameValue('');
  };

  return (
    <div className='jsonforms-additional-properties'>
      <div className='jsonforms-additional-properties-add'>
        <input
          aria-label={
            label
              ? t('additionalProperties.addTo', { label })
              : t('additionalProperties.addLabel')
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
        <button
          disabled={addPropertyDisabled}
          type='button'
          onClick={addProperty}
        >
          {t('additionalProperties.add')}
        </button>
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
            t,
            renameValue.trim(),
            data,
            schema,
            rootSchema,
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
                      <input
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
                      <button
                        disabled={renameDisabled}
                        type='button'
                        onClick={() => renameProperty(item.propertyName)}
                      >
                        {t('additionalProperties.save')}
                      </button>
                      <button
                        type='button'
                        onClick={() => {
                          setRenamingPropertyName(null);
                          setRenameValue('');
                        }}
                      >
                        {t('additionalProperties.cancel')}
                      </button>
                      {renameError ? (
                        <div className='jsonforms-additional-properties-error'>
                          {renameError}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <button
                        disabled={readonly}
                        type='button'
                        onClick={() => {
                          setRenamingPropertyName(item.propertyName);
                          setRenameValue(item.propertyName);
                        }}
                      >
                        {t('additionalProperties.rename')}
                      </button>
                      <button
                        disabled={removePropertyDisabled}
                        type='button'
                        onClick={() => removeProperty(item.propertyName)}
                      >
                        {t('additionalProperties.delete')}
                      </button>
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
