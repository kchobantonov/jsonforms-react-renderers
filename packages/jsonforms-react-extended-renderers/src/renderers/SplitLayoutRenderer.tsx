import { useEffectiveElements } from '@chobantonov/jsonforms-react-renderer-common/layoutContext';
import {
  Layout,
  LayoutProps,
  RankedTester,
  UISchemaElement,
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

/**
 * The initial share of each pane.
 *
 * "Initial sizes use normal sizing" - so a pane's `options.layout.weight`
 * decides its share, exactly as it would in an ordinary layout, and equal
 * shares are what Auto produces rather than a rule of their own.
 *
 * "Span SHOULD NOT be used" with a splitter, so it is ignored here; a pane
 * asking for one falls back to Auto rather than being sized against a grid
 * that a draggable pane does not have.
 */
export const initialSplitSizes = (elements: UISchemaElement[]): number[] => {
  const weights = elements.map((element) => {
    const weight = (element as any)?.options?.layout?.weight;
    return typeof weight === 'number' && Number.isFinite(weight) && weight > 0
      ? weight
      : 1;
  });
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return weights.map((weight) => (weight / total) * 100);
};

export const SharedSplitLayout = (props: LayoutProps) => {
  const layout = props.uischema as Layout;
  const horizontal = layout.type === 'HorizontalLayout';
  /*
    "Only effective visible UI-schema children participate. Hidden children
    leave layout." A hidden pane used to keep its share and its separator.
  */
  const elements = useEffectiveElements(
    layout.elements,
    props.path,
    props.config
  );
  const count = elements.length;
  const [stored, setSizes] = React.useState<number[]>([]);
  const sizes = stored.length === count ? stored : initialSplitSizes(elements);
  /* "`resizable` defaults true"; false disables dragging without hiding panes. */
  const resizable =
    ({ ...props.config, ...layout.options } as any).resizable !== false;
  /*
    "splitter+wrap unsupported". Panes divide a single axis and a separator
    sits between neighbours, so there is no meaningful second row to wrap on
    to. Reported rather than ignored, because the author asked for something
    that will not happen.
  */
  const wrapRequested = (layout.options as any)?.wrap === true;
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
      {...(wrapRequested
        ? {
            'data-layout-diagnostic':
              '`wrap` is not supported together with the splitter variant; ignored.',
          }
        : {})}
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
      {elements.map((element, index) => (
        <React.Fragment key={index}>
          <div
            /* See the antd splitter: padding outside the basis overflows. */
            style={{
              boxSizing: 'border-box',
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
              /*
                "`resizable` defaults true." When false the separator still
                marks the boundary - it is a real separator either way - but it
                stops being focusable and stops responding to keys or pointers.
              */
              {...(resizable ? { tabIndex: 0 } : { 'aria-disabled': true })}
              aria-label={`Resize pane ${index + 1}`}
              aria-orientation={horizontal ? 'vertical' : 'horizontal'}
              aria-valuemin={1}
              aria-valuemax={sizes[index] + sizes[index + 1] - 1}
              aria-valuenow={Math.round(sizes[index])}
              style={{
                flex: '0 0 6px',
                background: 'rgba(128,128,128,0.3)',
                cursor: resizable
                  ? horizontal
                    ? 'col-resize'
                    : 'row-resize'
                  : 'default',
                touchAction: 'none',
              }}
              onKeyDown={(event) => {
                if (!resizable) return;
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
                if (!resizable) return;
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
