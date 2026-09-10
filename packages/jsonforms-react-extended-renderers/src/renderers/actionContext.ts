import React from 'react';
import { UISchemaElement } from '@jsonforms/core';

export type ActionEvent = {
  action: string;
  label: string;
  params?: Record<string, unknown>;
  /** The UI schema element that triggered the action. */
  element: UISchemaElement;
};

export type HandleAction = (event: ActionEvent) => void | Promise<void>;

export const HandleActionContext = React.createContext<HandleAction | undefined>(
  undefined
);

export const useHandleAction = () => React.useContext(HandleActionContext);
