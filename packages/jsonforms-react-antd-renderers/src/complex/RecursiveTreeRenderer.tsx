import React from 'react';
import { useConfirmation } from '../util/useConfirmation';
import {
  createRecursiveTreeRenderer,
  recursiveTreeTester,
} from '@chobantonov/jsonforms-react-renderer-common/RecursiveTreeRenderer';
import { ContainerValidationIndicator } from '../layouts/ValidationIndicator';
import { AntdMixedTree as Tree } from './mixed/AntdMixedTree';
import { Button } from 'antd';
export { recursiveTreeTester };
export const RecursiveTreeRenderer = createRecursiveTreeRenderer(
  Tree,
  ContainerValidationIndicator,
  ({ children, onClick }) => (
    <Button type='link' onClick={onClick}>
      {children}
    </Button>
  ),
  useConfirmation
);
