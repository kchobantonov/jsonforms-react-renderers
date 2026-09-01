import { rankWith } from '@jsonforms/core';
import {
  MaterialOneOfEnumControl,
  materialOneOfEnumControlTester,
} from '@jsonforms/material-renderers';
import { createMuiClearableControl } from './MuiClearableControl';

export const MuiClearableOneOfEnumControl = createMuiClearableControl(
  MaterialOneOfEnumControl
);
export const muiClearableOneOfEnumControlTester = rankWith(
  6,
  (uischema, schema, context) =>
    materialOneOfEnumControlTester(uischema, schema, context) !== -1
);
