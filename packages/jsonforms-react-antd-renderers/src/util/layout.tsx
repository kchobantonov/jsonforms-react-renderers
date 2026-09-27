import isEmpty from 'lodash/isEmpty';
import React, { ComponentType } from 'react';
import Ajv from 'ajv';
import type { UISchemaElement } from '@jsonforms/core';
import {
  getAjv,
  isVisible,
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  OwnPropsOfRenderer,
} from '@jsonforms/core';
import { JsonFormsDispatch, useJsonForms } from '@jsonforms/react';
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

/**
 * Children that take part in layout.
 *
 * "Only effective visible UI-schema children participate. Hidden children
 * leave layout." The count matters as well as the rendering: a hidden child
 * must not consume a share or contribute a gap, which is what the previous
 * `24 / elements.length` did.
 */
export const useEffectiveElements = (
  elements: UISchemaElement[],
  path: string,
  config?: unknown
): UISchemaElement[] => {
  const ctx = useJsonForms();
  const data = ctx.core?.data;
  const ajv = ctx.core?.ajv;
  return (elements ?? []).filter((element) => {
    if (!element) return false;
    try {
      return ajv ? isVisible(element, data, path, ajv, config) : true;
    } catch {
      // A malformed rule is the author's problem, not a reason to drop a child.
      return true;
    }
  });
};

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
            {...(all.length ? { 'data-layout-diagnostic': all.join(' ') } : {})}
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

export interface AjvProps {
  ajv: Ajv;
}

// TODO fix @typescript-eslint/ban-types
// eslint-disable-next-line @typescript-eslint/ban-types
export const withAjvProps = <P extends {}>(
  Component: ComponentType<AjvProps & P>
) =>
  function WithAjvProps(props: P) {
    const ctx = useJsonForms();
    const ajv = getAjv({ jsonforms: { ...ctx } });

    return <Component {...props} ajv={ajv} />;
  };

export interface AntdLabelableLayoutRendererProps
  extends AntdLayoutRendererProps {
  label?: string;
}
