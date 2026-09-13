import {
  Layout,
  LayoutProps,
  RankedTester,
  and,
  or,
  rankWith,
  uiTypeIs,
} from '@jsonforms/core';
import { JsonFormsDispatch, withJsonFormsLayoutProps } from '@jsonforms/react';
import React from 'react';

export const sharedSplitLayoutTester: RankedTester = rankWith(
  4,
  and(
    or(uiTypeIs('HorizontalLayout'), uiTypeIs('VerticalLayout')),
    (ui) => String(ui.options?.variant ?? '').toLowerCase() === 'splitter'
  )
);

export const splitCssSize = (value: unknown): string | undefined =>
  typeof value === 'number' && Number.isFinite(value) && value > 0
    ? `${value}px`
    : typeof value === 'string' && value.trim()
    ? value.trim()
    : undefined;

export const SharedSplitLayout = (props: LayoutProps) => {
  const layout = props.uischema as Layout;
  const horizontal = layout.type === 'HorizontalLayout';
  const count = layout.elements.length;
  const [stored, setSizes] = React.useState<number[]>([]);
  const sizes =
    stored.length === count
      ? stored
      : Array.from({ length: count }, () => 100 / count);
  const drag = React.useRef<{
    index: number;
    start: number;
    total: number;
    sizes: number[];
  }>();
  const options = { ...props.config, ...layout.options };
  const adjust = (index: number, delta: number, original = sizes) => {
    const limited = Math.max(
      1 - original[index],
      Math.min(original[index + 1] - 1, delta)
    );
    setSizes(
      original.map((size, i) =>
        i === index ? size + limited : i === index + 1 ? size - limited : size
      )
    );
  };
  if (!props.visible) return null;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: horizontal ? 'row' : 'column',
        width: '100%',
        minWidth: 0,
        height: horizontal
          ? undefined
          : splitCssSize(options.height) ?? '20rem',
        minHeight: horizontal ? undefined : splitCssSize(options.minHeight),
      }}
    >
      {layout.elements.map((element, index) => (
        <React.Fragment key={index}>
          <div
            style={{
              flex: `${sizes[index]} 1 0`,
              minWidth: 0,
              minHeight: 0,
              overflow: 'auto',
              padding: 8,
            }}
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
          {index < count - 1 && (
            <div
              role='separator'
              tabIndex={0}
              aria-label={`Resize pane ${index + 1}`}
              aria-orientation={horizontal ? 'vertical' : 'horizontal'}
              aria-valuemin={1}
              aria-valuemax={sizes[index] + sizes[index + 1] - 1}
              aria-valuenow={Math.round(sizes[index])}
              style={{
                flex: '0 0 6px',
                background: 'rgba(128,128,128,0.3)',
                cursor: horizontal ? 'col-resize' : 'row-resize',
                touchAction: 'none',
              }}
              onKeyDown={(event) => {
                const delta =
                  event.key === (horizontal ? 'ArrowRight' : 'ArrowDown')
                    ? 2
                    : event.key === (horizontal ? 'ArrowLeft' : 'ArrowUp')
                    ? -2
                    : 0;
                if (delta) {
                  event.preventDefault();
                  adjust(index, delta);
                }
              }}
              onPointerDown={(event) => {
                const rect =
                  event.currentTarget.parentElement!.getBoundingClientRect();
                const total = horizontal ? rect.width : rect.height;
                if (!total) return;
                event.preventDefault();
                drag.current = {
                  index,
                  start: horizontal ? event.clientX : event.clientY,
                  total,
                  sizes,
                };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                const current = drag.current;
                if (current)
                  adjust(
                    current.index,
                    (((horizontal ? event.clientX : event.clientY) -
                      current.start) /
                      current.total) *
                      100,
                    current.sizes
                  );
              }}
              onPointerUp={() => {
                drag.current = undefined;
              }}
              onPointerCancel={() => {
                drag.current = undefined;
              }}
              onLostPointerCapture={() => {
                drag.current = undefined;
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
export const SharedSplitLayoutRenderer =
  withJsonFormsLayoutProps(SharedSplitLayout);
