import { rankWith } from '@jsonforms/core';
import {
  MaterialIntegerControl,
  materialIntegerControlTester,
} from '@jsonforms/material-renderers';
import { createMuiClearableControl } from './MuiClearableControl';

export const MuiClearableIntegerControl = createMuiClearableControl(
  MaterialIntegerControl
);
export const muiClearableIntegerControlTester = rankWith(
  3,
  (uischema, schema, context) =>
    materialIntegerControlTester(uischema, schema, context) !== -1
);
