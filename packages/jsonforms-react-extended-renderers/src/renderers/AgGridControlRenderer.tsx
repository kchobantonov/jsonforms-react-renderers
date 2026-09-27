import React from 'react';
import { ControlProps } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { createLazyControl } from '../util/lazyControl';
import { EditorRendererComponents } from './EditorControlFrame';

/**
 * ag-grid-community + ag-grid-react are ~1MB; importing them here would put
 * them in the main bundle for every form, so the implementation is fetched
 * only once a grid control is actually rendered.
 */
export const createAgGridControl = (components: EditorRendererComponents) =>
  createLazyControl(
    async () =>
      (await import('./AgGridControlRenderer.impl')).createAgGridControl(
        components
      ) as React.ComponentType<ControlProps>,
    components,
    { loading: 'grid.loading', error: 'grid.loadError' }
  );

export const createAgGridControlRenderer = (
  components: EditorRendererComponents
) => withJsonFormsControlProps(createAgGridControl(components));
