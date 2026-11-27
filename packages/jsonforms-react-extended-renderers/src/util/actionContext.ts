import React from 'react';
import { UISchemaElement } from '@jsonforms/core';

export type ActionEvent = {
  action: string;
  label: string;
  /**
   * `params` from the element, passed through untouched.
   *
   * Section 14 makes this a top-level field on `Button`, and it is how one
   * command serves several buttons - `setLocale` with `{ "locale": "bg" }`
   * rather than a `setLocaleBg` action per language.
   */
  params?: Record<string, unknown>;
  /** The UI schema element that triggered the action. */
  element: UISchemaElement;
  /**
   * The JSON Forms context, reachable from a `script` as `this.context`.
   */
  context?: unknown;
};

export type HandleAction = (event: ActionEvent) => void | Promise<void>;

export const HandleActionContext = React.createContext<
  HandleAction | undefined
>(undefined);

export const useHandleAction = () => React.useContext(HandleActionContext);
