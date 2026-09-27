import React, { useCallback } from 'react';

import {
  and,
  ArrayLayoutProps,
  isControl,
  isObjectArrayWithNesting,
  or,
  RankedTester,
  rankWith,
  schemaMatches,
} from '@jsonforms/core';
import {
  withArrayTranslationProps,
  withJsonFormsArrayLayoutProps,
  withTranslateProps,
} from '@jsonforms/react';
import { ArrayLayout } from './ArrayLayout';

export const ArrayLayoutRenderer = ({
  visible,
  addItem,
  ...props
}: ArrayLayoutProps) => {
  const addItemCb = useCallback(
    (p: string, value: any) => addItem(p, value),
    [addItem]
  );

  if (!visible) {
    return null;
  }

  return <ArrayLayout visible={visible} addItem={addItemCb} {...props} />;
};

export const arrayLayoutTester: RankedTester = rankWith(
  4,
  or(
    isObjectArrayWithNesting,
    and(
      isControl,
      schemaMatches(
        (schema) =>
          schema.type === 'array' &&
          (schema as unknown as { items?: unknown }).items === true
      )
    )
  )
);
export default withJsonFormsArrayLayoutProps(
  withTranslateProps(withArrayTranslationProps(ArrayLayoutRenderer))
);
