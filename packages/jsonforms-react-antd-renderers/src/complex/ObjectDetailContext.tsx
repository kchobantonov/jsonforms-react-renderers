import React from 'react';
import { UISchemaElement } from '@jsonforms/core';
export const ObjectDetailContext = React.createContext<
  { uischema: UISchemaElement; additional: React.ReactNode } | undefined
>(undefined);
