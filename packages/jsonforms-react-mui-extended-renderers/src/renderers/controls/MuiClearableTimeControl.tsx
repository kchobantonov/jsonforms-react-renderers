import { rankWith } from '@jsonforms/core';
import {
  MaterialTimeControl,
  materialTimeControlTester,
} from '@jsonforms/material-renderers';
import { createMuiClearableControl } from './MuiClearableControl';

export const MuiClearableTimeControl =
  createMuiClearableControl(MaterialTimeControl);
export const muiClearableTimeControlTester = rankWith(
  5,
  (uischema, schema, context) =>
    materialTimeControlTester(uischema, schema, context) !== -1
);
