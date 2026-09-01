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
import { Pencil, Plus, Trash2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';

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
  const [newPropertyName, setNewPropertyName] = useState('');
  const [renamingPropertyName, setRenamingPropertyName] = useState<
    string | null
  >(null);
  const [renameValue, setRenameValue] = useState('');
  const objectSchema = toObjectSchema(schema);
  const additionalPropertiesTitle =
    typeof objectSchema.additionalProperties === 'object' &&
    typeof objectSchema.additionalProperties.title === 'string'
      ? objectSchema.additionalProperties.title
      : undefined;
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
    if (trimmed === propertyToRename) {
      setRenamingPropertyName(null);
      setRenameValue('');
      return;
    }
    if (renameError || !trimmed || !objectData) {
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

  const closeRenameDialog = () => {
    setRenamingPropertyName(null);
    setRenameValue('');
  };

  const renameError = renamingPropertyName
    ? validatePropertyName(
        renameValue.trim(),
        data,
        schema,
        rootSchema,
        renamingPropertyName
      )
    : undefined;
  const renameDisabled =
    !enabled || readonly || Boolean(renameError) || !renameValue.trim();

  return (
    <>
      <Card className='jsonforms-additional-properties my-1 min-w-full'>
        <div className='px-4 py-2'>
          <div className='flex flex-col gap-2 md:flex-row md:gap-4'>
            {additionalPropertiesTitle ? (
              <div className='md:flex md:h-10 md:items-center md:pt-6'>
                <span className='text-sm text-foreground'>
                  {additionalPropertiesTitle}
                </span>
              </div>
            ) : null}
            <div className='min-w-0 flex-1'>
              <label
                className='mb-1 block text-sm font-medium text-foreground'
                htmlFor='shadcn-additional-property-name'
              >
                Property Name
              </label>
              <div className='relative pr-12'>
                <Input
                  id='shadcn-additional-property-name'
                  className='shadcn-jsonforms-input'
                  aria-label={
                    label ? `Add property to ${label}` : 'Add property'
                  }
                  aria-invalid={Boolean(propertyNameError)}
                  disabled={!enabled || readonly}
                  type='text'
                  value={newPropertyName}
                  onChange={(event) =>
                    setNewPropertyName(event.currentTarget.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      addProperty();
                    }
                  }}
                />
                <Button
                  className='absolute right-0 top-0 h-10 w-10 shrink-0'
                  disabled={addPropertyDisabled}
                  size='icon'
                  type='button'
                  aria-label='Add property'
                  title='Add property'
                  onClick={addProperty}
                >
                  <Plus className='h-4 w-4' />
                </Button>
              </div>
              {propertyNameError ? (
                <div
                  className='jsonforms-additional-properties-error mt-1 text-sm text-destructive'
                  role='alert'
                >
                  {propertyNameError}
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <div className='jsonforms-additional-properties-list flex flex-col gap-2 px-4 pb-4'>
          {additionalPropertyItems.map((item) => (
            <div className='jsonforms-additional-property relative' key={item.propertyName}>
              {enabled ? (
                <div className='jsonforms-additional-property-actions absolute right-1 top-0 z-20 flex items-center gap-0.5'>
                  <Button
                    className='h-7 w-7 text-muted-foreground'
                    variant='ghost'
                    size='icon'
                    disabled={readonly}
                    type='button'
                    aria-label={`Rename ${item.propertyName}`}
                    title={`Rename ${item.propertyName}`}
                    onClick={() => {
                      setRenamingPropertyName(item.propertyName);
                      setRenameValue(item.propertyName);
                    }}
                  >
                    <Pencil className='h-4 w-4' />
                  </Button>
                  <Button
                    className='h-7 w-7'
                    variant='destructive'
                    size='icon'
                    disabled={removePropertyDisabled}
                    type='button'
                    aria-label={`Delete ${item.propertyName}`}
                    title={`Delete ${item.propertyName}`}
                    onClick={() => removeProperty(item.propertyName)}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              ) : null}
              <div className='jsonforms-additional-property-control min-w-0'>
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
            </div>
          ))}
        </div>
      </Card>

      <Dialog
        open={renamingPropertyName !== null}
        onOpenChange={(dialogOpen) => {
          if (!dialogOpen) closeRenameDialog();
        }}
      >
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle>Rename property</DialogTitle>
            <DialogDescription>
              Change the property name without changing its value.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (renamingPropertyName) {
                renameProperty(renamingPropertyName);
              }
            }}
          >
            <label
              className='mb-2 block text-sm font-medium'
              htmlFor='shadcn-rename-property'
            >
              Property Name
            </label>
            <Input
              id='shadcn-rename-property'
              autoFocus
              disabled={readonly}
              value={renameValue}
              aria-invalid={Boolean(renameError)}
              onChange={(event) => setRenameValue(event.currentTarget.value)}
            />
            {renameError ? (
              <p className='mt-2 text-sm text-destructive' role='alert'>
                {renameError}
              </p>
            ) : null}
            <DialogFooter className='mt-4'>
              <Button type='button' variant='outline' onClick={closeRenameDialog}>
                Cancel
              </Button>
              <Button type='submit' disabled={renameDisabled}>
                Rename
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
