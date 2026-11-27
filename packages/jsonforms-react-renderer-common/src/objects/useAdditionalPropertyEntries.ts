import { useMemo } from 'react';
import {
  createDefaultValue,
  type ControlElement,
  type JsonSchema,
  type JsonFormsCellRendererRegistryEntry,
  type JsonFormsRendererRegistryEntry,
  type JsonFormsUISchemaRegistryEntry,
} from '@jsonforms/core';
import { useCollectionDelete } from '../collections/useCollectionDelete';
import { assignOwnProperty } from './additionalPropertyName';

import { useCollectionPagination } from '../collections/collectionPagination';
import {
  hasAdditionalProperties,
  toAdditionalPropertyItem,
  toObjectSchema,
} from './additionalProperties';

export type AdditionalPropertiesProps = {
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
  uischemas?: JsonFormsUISchemaRegistryEntry[];
  embedded?: boolean;
};

type AdditionalPropertyEntriesInput = Pick<
  AdditionalPropertiesProps,
  'data' | 'schema' | 'rootSchema' | 'path' | 'uischema' | 'config'
>;

/** Shared property discovery and pagination; renderers own editors and actions. */
export const useAdditionalPropertyItems = ({
  data,
  schema,
  rootSchema,
  path,
  uischema,
  config,
}: AdditionalPropertyEntriesInput) => {
  const objectSchema = toObjectSchema(schema);
  const appliedOptions = { ...config, ...uischema.options };
  const objectData =
    typeof data === 'object' && data !== null && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : undefined;
  const allowIfMissing =
    appliedOptions.allowAdditionalPropertiesIfMissing === true &&
    objectSchema.additionalProperties === undefined;
  const reservedPropertyNames = Object.keys(objectSchema.properties ?? {});
  const additionalKeys = Object.keys(objectData ?? {}).filter(
    (key) => !reservedPropertyNames.includes(key),
  );
  const additionalKeySnapshot = JSON.stringify(additionalKeys);
  const additionalPropertyItems = useMemo(
    () =>
      (JSON.parse(additionalKeySnapshot) as string[]).map((propertyName) =>
        toAdditionalPropertyItem(
          propertyName,
          path,
          schema,
          rootSchema,
          allowIfMissing,
        ),
      ),
    [additionalKeySnapshot, allowIfMissing, path, rootSchema, schema],
  );
  const shouldShow =
    hasAdditionalProperties(schema) ||
    allowIfMissing ||
    additionalKeys.length > 0;
  const count = Object.keys(objectData ?? {}).length;
  const maxPropertiesReached =
    objectSchema.maxProperties !== undefined &&
    count >= objectSchema.maxProperties &&
    Boolean(objectData);
  const minPropertiesReached =
    objectSchema.minProperties !== undefined &&
    count <= objectSchema.minProperties &&
    Boolean(objectData);
  return {
    maxPropertiesReached,
    minPropertiesReached,
    objectSchema,
    appliedOptions,
    objectData,
    allowIfMissing,
    reservedPropertyNames,
    additionalKeys,
    additionalPropertyItems,
    shouldShow,
  };
};

export const useAdditionalPropertyEntries = (
  input: AdditionalPropertyEntriesInput,
) => {
  const items = useAdditionalPropertyItems(input);
  const page = useCollectionPagination(
    items.additionalKeys,
    input.uischema.options?.additionalProperties?.pagination,
    input.config,
    'additionalProperties',
  );
  return { ...items, page };
};

export function useAdditionalPropertyActions(
  props: AdditionalPropertiesProps,
  entries: ReturnType<typeof useAdditionalPropertyEntries>,
  {
    restrict,
    propertyName,
    propertyNameError,
    setNewPropertyName,
  }: {
    restrict: boolean;
    propertyName: string;
    propertyNameError?: string;
    setNewPropertyName: (name: string) => void;
  },
) {
  const {
    enabled,
    readonly,
    path,
    rootSchema,
    schema,
    uischema,
    config,
    handleChange,
  } = props;
  const {
    objectData,
    objectSchema,
    reservedPropertyNames,
    appliedOptions,
    allowIfMissing,
  } = entries;
  const addDisabled =
    !enabled || Boolean(readonly) || (restrict && entries.maxPropertiesReached);
  const removePropertyDisabled =
    !enabled || Boolean(readonly) || (restrict && entries.minPropertiesReached);
  const deletion = useCollectionDelete<string>({
    data: objectData,
    identity: path,
    catalogId: 'additionalProperties',
    options: uischema.options,
    config,
    canRemove: (key) =>
      !removePropertyDisabled &&
      !appliedOptions.disableRemove &&
      !!objectData &&
      Object.prototype.hasOwnProperty.call(objectData, key) &&
      !reservedPropertyNames.includes(key) &&
      !(
        appliedOptions.restrict !== false &&
        objectSchema.required?.includes(key)
      ),
    value: (key) => objectData?.[key],
    remove: (key) => {
      const updatedData = { ...objectData };
      delete updatedData[key];
      handleChange(path, updatedData);
    },
  });
  const addPropertyDisabled = addDisabled || Boolean(propertyNameError);
  function addProperty() {
    if (addPropertyDisabled) return;
    const item = toAdditionalPropertyItem(
      propertyName,
      path,
      schema,
      rootSchema,
      allowIfMissing,
    );
    handleChange(
      path,
      assignOwnProperty(
        { ...objectData },
        propertyName,
        createDefaultValue(item.schema, rootSchema),
      ),
    );
    setNewPropertyName('');
  }
  return {
    addPropertyDisabled,
    removePropertyDisabled,
    deletion,
    addProperty,
    removeProperty: deletion.request,
  };
}
