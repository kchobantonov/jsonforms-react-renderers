import React from 'react';
import { ControlProps } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { createLazyControl } from '../util/lazyControl';
import { EditorRendererComponents } from './EditorControlFrame';

/**
 * @monaco-editor/react pulls in the Monaco loader; importing it here would put
 * it in the main bundle for every form, so the implementation is fetched only
 * once a code editor control is actually rendered.
 */
export const createMonacoControlRenderer = (
  components: EditorRendererComponents
) =>
  withJsonFormsControlProps(
    createLazyControl(
      async () =>
        (await import('./MonacoControlRenderer.impl')).createMonacoControl(
          components
        ) as React.ComponentType<ControlProps>,
      components,
      { loading: 'editor.loading', error: 'editor.loadError' }
    )
  );
