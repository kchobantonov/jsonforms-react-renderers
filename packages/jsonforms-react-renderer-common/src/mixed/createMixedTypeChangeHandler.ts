import { createDefaultValue, type ControlProps } from '@jsonforms/core';
import type { Dispatch, SetStateAction } from 'react';
import { schemaForType, type JsonDataType } from './mixedSchema';
import type { MixedTreePath } from './mixedTree';

import type { ConfirmationRequest } from '../interaction/confirmation';

type MixedTypeChangeOptions = Pick<
  ControlProps,
  | 'data'
  | 'path'
  | 'schema'
  | 'rootSchema'
  | 'uischema'
  | 'config'
  | 'handleChange'
> & {
  arrayElement: boolean;
  selectedType: JsonDataType | null;
  selectNumericType: (type: JsonDataType) => void;
  setSelectedPath: Dispatch<SetStateAction<MixedTreePath>>;
  setExpanded: (expanded: boolean) => void;
  requestConfirmation: (request: ConfirmationRequest) => void;
};

/** Shared type changes keep array positions intact and confirm discarded values. */
export const createMixedTypeChangeHandler = ({
  data,
  path,
  schema,
  rootSchema,
  uischema,
  config,
  handleChange,
  arrayElement,
  selectedType,
  selectNumericType,
  setSelectedPath,
  setExpanded,
  requestConfirmation,
}: MixedTypeChangeOptions) => {
  const requestTypeChange = (perform: () => void) =>
    requestConfirmation({
      operation: 'typeChange',
      catalogId: 'mixed',
      discarded: [data],
      options: uischema?.options,
      config,
      perform,
    });
  return (nextType?: JsonDataType) => {
    if (!nextType) {
      if (arrayElement) return;
      requestTypeChange(() => {
        handleChange(path, undefined);
        setSelectedPath([]);
      });
      return;
    }
    if (nextType === selectedType) return;
    if (
      typeof data === 'number' &&
      (nextType === 'number' || nextType === 'integer')
    ) {
      selectNumericType(nextType);
      return;
    }
    const nextSchema = schemaForType(schema, nextType, rootSchema);
    requestTypeChange(() => {
      if (nextType === 'number' || nextType === 'integer')
        selectNumericType(nextType);
      handleChange(path, createDefaultValue(nextSchema, rootSchema));
      setSelectedPath([]);
      if (nextType === 'object' || nextType === 'array') setExpanded(true);
    });
  };
};
