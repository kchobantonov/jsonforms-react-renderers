import React from 'react';
import { useConfirmation } from './mixed/useConfirmation';
import {
  createRecursiveTreeRenderer,
  recursiveTreeTester,
} from '@chobantonov/jsonforms-react-renderer-common/RecursiveTreeRenderer';
import { ContainerValidationIndicator } from '../layouts/ValidationIndicator';
import { MixedTree as Tree } from './mixed/MixedWidgets';
import { Button } from '@jsonforms-react-shadcn-ui/button';
export { recursiveTreeTester };
export const RecursiveTreeRenderer = createRecursiveTreeRenderer(
  Tree,
  ContainerValidationIndicator,
  ({ children, onClick }) => (
    <Button variant='link' type='button' onClick={onClick}>
      {children}
    </Button>
  ),
  useConfirmation
);
