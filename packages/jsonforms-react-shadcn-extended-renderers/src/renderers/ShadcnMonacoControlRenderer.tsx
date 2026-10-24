import { createMonacoControlRenderer } from '@chobantonov/jsonforms-react-extended-renderers';
import React from 'react';
import { Maximize, Minimize } from 'lucide-react';
import { ShadcnEditorToggleButton } from './ShadcnEditorButton';
import { ShadcnEditorFrame } from './ShadcnEditorFrame';
export const ShadcnMonacoControlRenderer = createMonacoControlRenderer({
  Frame: ShadcnEditorFrame,
  Button: ShadcnEditorToggleButton,
  MaximizeIcon: () => <Maximize aria-hidden='true' />,
  MinimizeIcon: () => <Minimize aria-hidden='true' />,
});
