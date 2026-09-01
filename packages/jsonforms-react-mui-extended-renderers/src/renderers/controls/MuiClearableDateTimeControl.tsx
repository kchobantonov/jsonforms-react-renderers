import { rankWith } from '@jsonforms/core';
import {
  MaterialDateTimeControl,
  materialDateTimeControlTester,
} from '@jsonforms/material-renderers';
import { createMuiClearableControl } from './MuiClearableControl';

export const MuiClearableDateTimeControl = createMuiClearableControl(
  MaterialDateTimeControl
);
export const muiClearableDateTimeControlTester = rankWith(
  3,
  (uischema, schema, context) =>
    materialDateTimeControlTester(uischema, schema, context) !== -1
);
