import React from 'react';
import { UISchemaElement } from '@jsonforms/core';

export type ActionEvent = {
  action: string;
  label: string;
  uischema: UISchemaElement;
};

export type HandleAction = (event: ActionEvent) => void;

export const HandleActionContext = React.createContext<HandleAction | undefined>(
  undefined
);

export const useHandleAction = () => React.useContext(HandleActionContext);
