import { useEffectiveElements } from '@chobantonov/jsonforms-react-renderer-common/layoutContext';
export {
  useEffectiveElements,
  withAjvProps,
} from '@chobantonov/jsonforms-react-renderer-common/layoutContext';
export type { AjvProps } from '@chobantonov/jsonforms-react-renderer-common/layoutContext';
import isEmpty from 'lodash/isEmpty';
import { ConfigProvider } from 'antd';
import React from 'react';
import type { UISchemaElement } from '@jsonforms/core';
import {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  OwnPropsOfRenderer,
} from '@jsonforms/core';
import { JsonFormsDispatch } from '@jsonforms/react';
import {
  containerStyle,
  itemSizing,
  legacySizingDiagnostics,
  resolveGap,
  resolveGridColumns,
  type LayoutContainerOptions,
} from './layoutSizing';

export interface AntdLayoutRendererProps extends OwnPropsOfRenderer {
  elements: UISchemaElement[];
  direction: 'row' | 'column';
  /** The layout element's own flat options - the container half of the model. */
  layoutOptions?: LayoutContainerOptions;
  config?: unknown;
}

export const renderLayoutElements = (
  elements: UISchemaElement[],
  schema: JsonSchema,
  path: string,
  enabled: boolean,
  direction: 'row' | 'column',
  layoutOptions: LayoutContainerOptions | undefined,
  config: unknown,
  renderers?: JsonFormsRendererRegistryEntry[],
  cells?: JsonFormsCellRendererRegistryEntry[]
) => {
  const grid = resolveGridColumns(layoutOptions, config);
  const gap = resolveGap(layoutOptions, config, direction);
  return (
    <ConfigProvider theme={{ components: { Form: { itemMarginBottom: 0 } } }}>
      <div
        data-layout={direction}
        style={{
          ...containerStyle(layoutOptions, config, direction),
          width: '100%',
        }}
      >
        {elements.map((child, index) => {
          const { style, diagnostics } = itemSizing(
            child,
            direction,
            grid,
            gap,
            layoutOptions?.minItemWidth
          );
          const all = [...diagnostics, ...legacySizingDiagnostics(child)];
          return (
            <div
              key={`${path}-${index}`}
              style={style}
              {...(all.length
                ? { 'data-layout-diagnostic': all.join(' ') }
                : {})}
            >
              <JsonFormsDispatch
                uischema={child}
                schema={schema}
                path={path}
                enabled={enabled}
                renderers={renderers}
                cells={cells}
              />
            </div>
          );
        })}
      </div>
    </ConfigProvider>
  );
};

const AntdLayoutRendererComponent = ({
  visible,
  elements,
  schema,
  path,
  enabled,
  direction,
  layoutOptions,
  config,
  renderers,
  cells,
}: AntdLayoutRendererProps) => {
  const effective = useEffectiveElements(elements, path, config);
  if (isEmpty(effective) || !visible) {
    return null;
  }
  return renderLayoutElements(
    effective,
    schema,
    path,
    enabled,
    direction,
    layoutOptions,
    config,
    renderers,
    cells
  );
};
export const AntdLayoutRenderer = React.memo(AntdLayoutRendererComponent);

export interface AntdLabelableLayoutRendererProps
  extends AntdLayoutRendererProps {
  label?: string;
}
