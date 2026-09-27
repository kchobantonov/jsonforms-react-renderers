import {
  initialSplitSizes,
  splitCssSize,
} from '@chobantonov/jsonforms-react-extended-renderers';
import {
  and,
  Layout,
  LayoutProps,
  or,
  RankedTester,
  isVisible,
  rankWith,
  UISchemaElement,
  uiTypeIs,
} from '@jsonforms/core';
import {
  JsonFormsDispatch,
  useJsonForms,
  withJsonFormsLayoutProps,
} from '@jsonforms/react';
import { Splitter } from 'antd';
import React from 'react';

export const hasAntdSplitLayoutVariant = (uischema: UISchemaElement) =>
  String(uischema.options?.variant ?? '').toLowerCase() === 'splitter';

export const antdSplitLayoutTester: RankedTester = rankWith(
  5,
  and(
    or(uiTypeIs('HorizontalLayout'), uiTypeIs('VerticalLayout')),
    hasAntdSplitLayoutVariant
  )
);

export const AntdSplitLayout = (props: LayoutProps) => {
  const ctx = useJsonForms();
  const layout = props.uischema as Layout;
  const vertical = layout.type === 'VerticalLayout';
  const options = { ...props.config, ...layout.options };
  /*
    "Only effective visible UI-schema children participate. Hidden children
    leave layout." A hidden pane used to keep its share and its separator.
  */
  const elements = (layout.elements ?? []).filter((element) => {
    const ajv = ctx.core?.ajv;
    try {
      return ajv
        ? isVisible(element, ctx.core?.data, props.path, ajv, props.config)
        : true;
    } catch {
      // A malformed rule is the author's problem, not a reason to drop a pane.
      return true;
    }
  });
  /* "Initial sizes use normal sizing", not equal shares. */
  const shares = initialSplitSizes(elements);
  /* "`resizable` defaults true." */
  const resizable = (options as any).resizable !== false;
  if (!props.visible) return null;
  return (
    <Splitter
      /*
        Remount when the number of panes changes.

        antd applies `defaultSize` once, on mount. A pane revealed by a rule
        therefore arrives beside siblings whose sizes were resolved without it
        - the previous single pane stays at `flex-basis: 100%` and the new one
        falls back to `auto`, so it is squeezed to nothing and looks as though
        it never rendered. It did; it just had no width.

        The cost is that the panes remount, losing focus and any local state
        inside them at that moment. That is the better trade: the set of panes
        just changed, so the old sizes no longer describe this layout, and a
        pane you cannot see is worse than one that re-mounts.

        The shared splitter needs none of this - it recomputes whenever the
        stored size count stops matching the pane count.
      */
      key={elements.length}
      orientation={vertical ? 'vertical' : 'horizontal'}
      {...((options as any)?.wrap === true
        ? {
            'data-layout-diagnostic':
              '`wrap` is not supported together with the splitter variant; ignored.',
          }
        : {})}
      style={{
        height: vertical ? splitCssSize(options.height) ?? '20rem' : undefined,
        minHeight: vertical ? splitCssSize(options.minHeight) : undefined,
      }}
    >
      {elements.map((element, index) => (
        <Splitter.Panel
          defaultSize={`${shares[index]}%`}
          key={index}
          min='10%'
          resizable={resizable}
        >
          <div
            /*
              `border-box` is load-bearing, not tidiness: this pane is sized to
              the full height of its slot and then given padding. Under the
              default `content-box` the padding is added *outside* that height,
              so every pane overflows by exactly its padding and shows a
              scrollbar over content that fits.
            */
            style={{
              boxSizing: 'border-box',
              height: '100%',
              minWidth: 0,
              overflow: 'auto',
              padding: 12,
            }}
          >
            <JsonFormsDispatch
              cells={props.cells}
              enabled={props.enabled}
              path={props.path}
              renderers={props.renderers}
              schema={props.schema}
              uischema={element}
            />
          </div>
        </Splitter.Panel>
      ))}
    </Splitter>
  );
};

export const AntdSplitLayoutRenderer =
  withJsonFormsLayoutProps(AntdSplitLayout);
