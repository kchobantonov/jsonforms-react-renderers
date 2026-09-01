import { rankWith } from '@jsonforms/core';
import {
  MaterialTextControl,
  materialTextControlTester,
} from '@jsonforms/material-renderers';
import { createMuiClearableControl } from './MuiClearableControl';

export const MuiClearableTextControl =
  createMuiClearableControl(MaterialTextControl);
export const muiClearableTextControlTester = rankWith(
  2,
  (uischema, schema, context) =>
    materialTextControlTester(uischema, schema, context) !== -1
);
