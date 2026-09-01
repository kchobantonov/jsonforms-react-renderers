import { rankWith } from '@jsonforms/core';
import {
  MaterialDateControl,
  materialDateControlTester,
} from '@jsonforms/material-renderers';
import { createMuiClearableControl } from './MuiClearableControl';

export const MuiClearableDateControl =
  createMuiClearableControl(MaterialDateControl);
export const muiClearableDateControlTester = rankWith(
  5,
  (uischema, schema, context) =>
    materialDateControlTester(uischema, schema, context) !== -1
);
