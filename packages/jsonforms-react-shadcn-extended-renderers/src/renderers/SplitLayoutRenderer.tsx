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

export const hasSplitLayoutVariant = (uischema: UISchemaElement): boolean =>
  String(uischema.options?.variant ?? '').toLowerCase() === 'splitter';

export const splitLayoutTester: RankedTester = rankWith(
  5,
  and(
    or(uiTypeIs('HorizontalLayout'), uiTypeIs('VerticalLayout')),
    hasSplitLayoutVariant
  )
);

const cssSize = (value: unknown): string | undefined =>
  typeof value === 'number' && value > 0
    ? `${value}px`
    : typeof value === 'string' && value.trim()
    ? value
    : undefined;

export const ShadcnSplitLayout = (props: LayoutProps) => {
  const layout = props.uischema as Layout;
  const horizontal = layout.type === 'HorizontalLayout';
  const count = layout.elements.length;
  const [sizes, setSizes] = React.useState(() =>
    Array.from({ length: count }, () => 100 / Math.max(1, count))
  );
  if (!props.visible) return null;
  const resize = (index: number, event: React.PointerEvent<HTMLDivElement>) => {
    const root = event.currentTarget.parentElement;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    const start = horizontal ? event.clientX : event.clientY;
    const total = horizontal ? rect.width : rect.height;
    const original = sizes;
    event.currentTarget.setPointerCapture(event.pointerId);
    const move = (next: PointerEvent) => {
      const delta =
        (((horizontal ? next.clientX : next.clientY) - start) / total) * 100;
      setSizes(
        original.map((size, item) =>
          item === index
            ? Math.max(1, size + delta)
            : item === index + 1
            ? Math.max(1, size - delta)
            : size
        )
      );
    };
    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  };

  return (
    <div
      className={`shadcn-jsonforms-split shadcn-jsonforms-split-${
        horizontal ? 'horizontal' : 'vertical'
      }`}
      style={{
        height: horizontal ? undefined : cssSize(layout.options?.height),
        minHeight: horizontal ? undefined : cssSize(layout.options?.minHeight),
      }}
    >
      {layout.elements.map((element, index) => (
        <React.Fragment key={index}>
          <div
            className='shadcn-jsonforms-split-pane'
            style={{ flexBasis: `${sizes[index] ?? 100 / count}%` }}
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
          {index < count - 1 ? (
            <div
              role='separator'
              aria-orientation={horizontal ? 'vertical' : 'horizontal'}
              className='shadcn-jsonforms-split-handle'
              onPointerDown={(event) => resize(index, event)}
            />
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );
};

export const SplitLayoutRenderer = withJsonFormsLayoutProps(ShadcnSplitLayout);
