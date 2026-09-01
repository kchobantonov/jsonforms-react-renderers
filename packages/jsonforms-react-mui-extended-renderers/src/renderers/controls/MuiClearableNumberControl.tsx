import { rankWith } from '@jsonforms/core';
import {
  MaterialNumberControl,
  materialNumberControlTester,
} from '@jsonforms/material-renderers';
import { createMuiClearableControl } from './MuiClearableControl';

export const MuiClearableNumberControl = createMuiClearableControl(
  MaterialNumberControl
);
export const muiClearableNumberControlTester = rankWith(
  3,
  (uischema, schema, context) =>
    materialNumberControlTester(uischema, schema, context) !== -1
);
