import {
  getAjv,
  getConfig,
  isVisible,
  Layout,
  LayoutProps,
  RankedTester,
  rankWith,
  uiTypeIs,
} from '@jsonforms/core';
import {
  JsonFormsDispatch,
  useJsonForms,
  withJsonFormsLayoutProps,
} from '@jsonforms/react';
import React from 'react';
import { horizontalLayoutWidths } from './horizontalLayout';

// Above the base layouts, below specialized split layouts (rank 5).
export const horizontalColumnsLayoutTester: RankedTester = rankWith(
  3,
  uiTypeIs('HorizontalLayout')
);

export const HorizontalColumnsLayoutRendererComponent = (
  props: LayoutProps
) => {
  const context = useJsonForms();
  const state = { jsonforms: context };
  const elements = ((props.uischema as Layout).elements ?? [])
    .map((element, index) => ({ element, index }))
    .filter(({ element }) =>
      isVisible(
        element,
        context.core?.data,
        props.path,
        getAjv(state),
        getConfig(state)
      )
    );
  const gap = '1rem';
  const widths = horizontalLayoutWidths(
    elements.map(({ element }) => element.options?.columns),
    gap
  );
  if (!props.visible) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap,
        width: '100%',
        minWidth: 0,
      }}
    >
      {Array.from(new Set(widths.map(({ row }) => row))).map((row) => (
        <div
          key={row}
          data-columns-row={row}
          style={{ display: 'flex', gap, minWidth: 0 }}
        >
          {elements.map(({ element, index }, position) => {
            const item = widths[position];
            if (item.row !== row) return null;
            return (
              <div
                key={`${props.path}-${index}`}
                style={item.style}
                data-columns={item.columns}
                data-columns-diagnostic={item.diagnostic}
              >
                <JsonFormsDispatch
                  schema={props.schema}
                  uischema={element}
                  path={props.path}
                  enabled={props.enabled}
                  renderers={props.renderers}
                  cells={props.cells}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export const HorizontalColumnsLayoutRenderer = withJsonFormsLayoutProps(
  HorizontalColumnsLayoutRendererComponent
);
