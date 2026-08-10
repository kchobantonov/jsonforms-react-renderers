import {
  JsonFormsRendererRegistryEntry,
  RankedTester,
} from '@jsonforms/core';
import {
  buttonRendererTester,
  createButtonRenderer,
  createExtendedRenderers,
} from '@chobantonov/jsonforms-react-extended-renderers';
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

export type MuiExtendedRendererOptions = {
  components?: Record<string, React.ComponentType<any>>;
};

export const createMuiExtendedRenderers = (
  options: MuiExtendedRendererOptions = {}
): JsonFormsRendererRegistryEntry[] => {
  const buttonRenderer = createButtonRenderer({
    ButtonComponent: Button,
    buttonProps: {
      variant: 'contained',
      size: 'small',
    },
  });

  return [
    {
      tester: buttonRendererTester as RankedTester,
      renderer: buttonRenderer,
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
export * from '@chobantonov/jsonforms-react-extended-renderers';
