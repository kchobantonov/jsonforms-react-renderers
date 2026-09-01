import { rankWith } from '@jsonforms/core';
import {
  MaterialEnumControl,
  materialEnumControlTester,
} from '@jsonforms/material-renderers';
import { createMuiClearableControl } from './MuiClearableControl';

export const MuiClearableEnumControl =
  createMuiClearableControl(MaterialEnumControl);
export const muiClearableEnumControlTester = rankWith(
  3,
  (uischema, schema, context) =>
    materialEnumControlTester(uischema, schema, context) !== -1
);
