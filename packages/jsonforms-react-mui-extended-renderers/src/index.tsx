import {
  MuiFileRenderer,
  muiFileRendererTester,
} from './renderers/MuiFileRenderer';
import { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { createExtendedRenderers } from '@chobantonov/jsonforms-react-extended-renderers';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import React from 'react';
import { MuiGroupRenderer, muiGroupTester } from './renderers/MuiGroupRenderer';
import {
  MuiAdditionalPropertiesObjectRenderer,
  muiAdditionalPropertiesObjectTester,
} from './renderers/MuiAdditionalPropertiesObjectRenderer';
import {
  MuiButtonRenderer,
  muiButtonRendererTester,
} from './renderers/MuiButtonRenderer';
import {
  MuiMixedRenderer,
  muiMixedControlTester,
} from './renderers/MuiMixedRenderer';
import {
  MuiClearableDateControl,
  muiClearableDateControlTester,
} from './renderers/controls/MuiClearableDateControl';
import {
  MuiClearableDateTimeControl,
  muiClearableDateTimeControlTester,
} from './renderers/controls/MuiClearableDateTimeControl';
import {
  MuiClearableEnumControl,
  muiClearableEnumControlTester,
} from './renderers/controls/MuiClearableEnumControl';
import {
  MuiClearableIntegerControl,
  muiClearableIntegerControlTester,
} from './renderers/controls/MuiClearableIntegerControl';
import {
  MuiClearableNumberControl,
  muiClearableNumberControlTester,
} from './renderers/controls/MuiClearableNumberControl';
import {
  MuiClearableOneOfEnumControl,
  muiClearableOneOfEnumControlTester,
} from './renderers/controls/MuiClearableOneOfEnumControl';
import {
  MuiClearableTextControl,
  muiClearableTextControlTester,
} from './renderers/controls/MuiClearableTextControl';
import {
  MuiClearableTimeControl,
  muiClearableTimeControlTester,
} from './renderers/controls/MuiClearableTimeControl';

export type MuiExtendedRendererOptions = {
  components?: Record<string, React.ComponentType<any>>;
};

export const createMuiExtendedRenderers = (
  options: MuiExtendedRendererOptions = {}
): JsonFormsRendererRegistryEntry[] => {
  return [
    { tester: muiFileRendererTester, renderer: MuiFileRenderer },
    { tester: muiGroupTester, renderer: MuiGroupRenderer },
    {
      tester: muiClearableDateControlTester,
      renderer: MuiClearableDateControl,
    },
    {
      tester: muiClearableDateTimeControlTester,
      renderer: MuiClearableDateTimeControl,
    },
    {
      tester: muiClearableEnumControlTester,
      renderer: MuiClearableEnumControl,
    },
    {
      tester: muiClearableIntegerControlTester,
      renderer: MuiClearableIntegerControl,
    },
    {
      tester: muiClearableNumberControlTester,
      renderer: MuiClearableNumberControl,
    },
    {
      tester: muiClearableOneOfEnumControlTester,
      renderer: MuiClearableOneOfEnumControl,
    },
    {
      tester: muiClearableTextControlTester,
      renderer: MuiClearableTextControl,
    },
    {
      tester: muiClearableTimeControlTester,
      renderer: MuiClearableTimeControl,
    },
    {
      tester: muiMixedControlTester,
      renderer: MuiMixedRenderer,
    },
    {
      tester: muiButtonRendererTester,
      renderer: MuiButtonRenderer,
    },
    {
      tester: muiAdditionalPropertiesObjectTester,
      renderer: MuiAdditionalPropertiesObjectRenderer,
    },
    ...createExtendedRenderers({
      components: {
        Alert,
        Box,
        Button,
        Chip,
        Divider,
        Paper,
        Stack,
        Typography,
        ...(options.components ?? {}),
      },
      includeButtonRenderer: false,
    }),
  ];
};

export const muiExtendedRenderers = createMuiExtendedRenderers();
export const advancedMuiRenderers = muiExtendedRenderers;

export * from './theme';
export * from './renderers/MuiGroupRenderer';
export * from './renderers/MuiAdditionalPropertiesObjectRenderer';
export * from './renderers/MuiButtonRenderer';
export * from './renderers/MuiMixedRenderer';
export * from './renderers/controls/MuiClearableControl';
export * from './renderers/controls/MuiClearableDateControl';
export * from './renderers/controls/MuiClearableDateTimeControl';
export * from './renderers/controls/MuiClearableEnumControl';
export * from './renderers/controls/MuiClearableIntegerControl';
export * from './renderers/controls/MuiClearableNumberControl';
export * from './renderers/controls/MuiClearableOneOfEnumControl';
export * from './renderers/controls/MuiClearableTextControl';
export * from './renderers/controls/MuiClearableTimeControl';
export * from '@chobantonov/jsonforms-react-extended-renderers';

export * from './renderers/MuiFileRenderer';
