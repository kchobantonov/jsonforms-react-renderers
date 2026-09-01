import {
  ControlElement,
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
} from '@jsonforms/core';
import { useJsonForms } from '@jsonforms/react';
import { Paper, Stack, Typography } from '@mui/material';
import React, { useMemo, useState } from 'react';
import { MuiAdditionalPropertyAdd } from './MuiAdditionalPropertyAdd';
import { MuiAdditionalPropertyRenameDialog } from './MuiAdditionalPropertyRenameDialog';
import { MuiAdditionalPropertyRow } from './MuiAdditionalPropertyRow';
import {
  createAdditionalPropertyItem,
  defaultAdditionalPropertyValue,
  hasDynamicPropertySchema,
  isJsonFormsSafePropertyName,
  matchesAllowedPattern,
  renameObjectProperty,
  resolvePropertyNamesSchema,
  toObjectSchema,
} from './additionalPropertyUtils';

export interface MuiAdditionalPropertiesProps {
  cells?: JsonFormsCellRendererRegistryEntry[];
  config?: any;
  data: unknown;
  enabled: boolean;
  handleChange(path: string, value: unknown): void;
  label: string;
  path: string;
  readonly?: boolean;
  renderers?: JsonFormsRendererRegistryEntry[];
  rootSchema: JsonSchema;
  schema: JsonSchema;
  uischema: ControlElement;
}

export const MuiAdditionalProperties = ({
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
}: MuiAdditionalPropertiesProps) => {
  const context = useJsonForms();
  const [newPropertyName, setNewPropertyName] = useState('');
  const [renamingPropertyName, setRenamingPropertyName] = useState<
    string | null
  >(null);
  const [renameValue, setRenameValue] = useState('');
  const objectSchema = toObjectSchema(schema);
  const objectData =
    data && typeof data === 'object' && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};
  const options = { ...(config ?? {}), ...(uischema.options ?? {}) };
  const restrict = options.restrict !== false;
  const allowIfMissing =
    options.allowAdditionalPropertiesIfMissing === true &&
    objectSchema.additionalProperties === undefined;
  const declaredNames = Object.keys(objectSchema.properties ?? {});
  const dynamicNames = Object.keys(objectData).filter(
    (propertyName) => !declaredNames.includes(propertyName)
  );
  const items = useMemo(
    () =>
      dynamicNames
        .map((propertyName) =>
          createAdditionalPropertyItem(
            propertyName,
            path,
            schema,
            rootSchema,
            allowIfMissing,
            true
          )
        )
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [allowIfMissing, dynamicNames.join('\u0000'), path, rootSchema, schema]
  );
  const shouldShow =
    hasDynamicPropertySchema(schema) ||
    allowIfMissing ||
    dynamicNames.length > 0;

  if (!shouldShow) return null;

  const validateName = (
    rawName: string,
    currentName?: string
  ): string | undefined => {
    const name = rawName.trim();
    if (!name) return 'Property name is required.';
    if (
      Object.prototype.hasOwnProperty.call(objectData, name) &&
      name !== currentName
    ) {
      return `Property '${name}' already exists.`;
    }
    if (declaredNames.includes(name) && name !== currentName) {
      return `Property '${name}' is declared by the schema.`;
    }
    if (!isJsonFormsSafePropertyName(name)) {
      return 'Property names containing dots or brackets are not supported.';
    }
    if (!matchesAllowedPattern(name, schema)) {
      return 'The property name does not match an allowed pattern.';
    }
    const propertyNamesSchema = resolvePropertyNamesSchema(schema, rootSchema);
    const ajv = context.core?.ajv;
    if (
      propertyNamesSchema &&
      ajv &&
      !ajv.validate(propertyNamesSchema, name)
    ) {
      const translateError = context.i18n?.translateError;
      const translate = context.i18n?.translate;
      if (translateError && translate && ajv.errors?.[0]) {
        return translateError(ajv.errors[0], translate, uischema);
      }
      return ajv.errorsText(ajv.errors) || 'The property name is invalid.';
    }
    return undefined;
  };

  const trimmedNewName = newPropertyName.trim();
  const newNameError = validateName(trimmedNewName);
  const maxReached =
    objectSchema.maxProperties !== undefined &&
    Object.keys(objectData).length >= objectSchema.maxProperties;
  const addDisabled =
    !enabled ||
    Boolean(readonly) ||
    Boolean(newNameError) ||
    (restrict && maxReached);
  const addProperty = () => {
    if (addDisabled) return;
    const item = createAdditionalPropertyItem(
      trimmedNewName,
      path,
      schema,
      rootSchema,
      allowIfMissing,
      false
    );
    if (!item) return;
    handleChange(path, {
      ...objectData,
      [trimmedNewName]: defaultAdditionalPropertyValue(item, rootSchema),
    });
    setNewPropertyName('');
  };
  const renameError = renamingPropertyName
    ? validateName(renameValue, renamingPropertyName)
    : undefined;
  const closeRename = () => {
    setRenamingPropertyName(null);
    setRenameValue('');
  };
  const renameProperty = () => {
    if (
      !renamingPropertyName ||
      renameError ||
      !enabled ||
      readonly ||
      renameValue.trim() === renamingPropertyName
    ) {
      return;
    }
    handleChange(
      path,
      renameObjectProperty(objectData, renamingPropertyName, renameValue.trim())
    );
    closeRename();
  };

  return (
    <>
      <Paper
        className='jsonforms-mui-additional-properties'
        sx={{ mt: 1, p: 2 }}
        variant='outlined'
      >
        <Stack spacing={1.5}>
          <Typography variant='subtitle2'>Additional Properties</Typography>
          <MuiAdditionalPropertyAdd
            disabled={addDisabled}
            error={newPropertyName ? newNameError : undefined}
            label={label}
            onAdd={addProperty}
            onChange={setNewPropertyName}
            value={newPropertyName}
          />
          {items.map((item) => {
            const minReached =
              objectSchema.minProperties !== undefined &&
              Object.keys(objectData).length <= objectSchema.minProperties;
            const required = objectSchema.required?.includes(item.propertyName);
            return (
              <MuiAdditionalPropertyRow
                cells={cells}
                deleteDisabled={
                  !enabled ||
                  Boolean(readonly) ||
                  Boolean(restrict && (minReached || required))
                }
                enabled={enabled}
                item={item}
                key={item.propertyName}
                onDelete={() => {
                  const next = { ...objectData };
                  delete next[item.propertyName];
                  handleChange(path, next);
                }}
                onRename={() => {
                  setRenamingPropertyName(item.propertyName);
                  setRenameValue(item.propertyName);
                }}
                readonly={readonly}
                renderers={renderers}
              />
            );
          })}
        </Stack>
      </Paper>
      <MuiAdditionalPropertyRenameDialog
        disabled={
          !enabled ||
          Boolean(readonly) ||
          Boolean(renameError) ||
          !renameValue.trim() ||
          renameValue.trim() === renamingPropertyName
        }
        error={renameError}
        oldName={renamingPropertyName}
        onCancel={closeRename}
        onChange={setRenameValue}
        onRename={renameProperty}
        value={renameValue}
      />
    </>
  );
};
