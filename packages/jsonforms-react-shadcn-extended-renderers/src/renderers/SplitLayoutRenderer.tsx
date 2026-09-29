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

export const hasSplitLayoutVariant = (uischema: UISchemaElement): boolean =>
  String(uischema.options?.variant ?? '').toLowerCase() === 'splitter';

export const splitLayoutTester: RankedTester = rankWith(
  5,
  and(
    or(uiTypeIs('HorizontalLayout'), uiTypeIs('VerticalLayout')),
    hasSplitLayoutVariant
  )
);

import React from 'react';
import { JsonFormsDispatch, withJsonFormsLayoutProps } from '@jsonforms/react';
import { useEffectiveElements } from '@chobantonov/jsonforms-react-renderer-common/layoutContext';
import {
  initialSplitSizes,
  splitCssSize,
} from '@chobantonov/jsonforms-react-extended-renderers';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@jsonforms-react-shadcn-ui/resizable';

export const ShadcnSplitLayout = (props: LayoutProps) => {
  const layout = props.uischema as Layout;
  const elements = useEffectiveElements(
    layout.elements,
    props.path,
    props.config
  );
  const horizontal = layout.type === 'HorizontalLayout';
  const options = { ...props.config, ...layout.options };
  const sizes = initialSplitSizes(elements);
  if (!props.visible || !elements.length) return null;
  return (
    <ResizablePanelGroup
      orientation={horizontal ? 'horizontal' : 'vertical'}
      disabled={options.resizable === false}
      data-layout-diagnostic={
        options.wrap
          ? '`wrap` is not supported together with the splitter variant; ignored.'
          : undefined
      }
      style={{
        width: '100%',
        minWidth: 0,
        height: horizontal
          ? undefined
          : splitCssSize(options.height) ?? '20rem',
      }}
    >
      {elements.map((element, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ResizableHandle
              withHandle
              aria-label={`Resize pane ${index}`}
              disabled={options.resizable === false}
            />
          )}
          <ResizablePanel
            defaultSize={`${sizes[index]}%`}
            minSize='1%'
            style={{ overflow: 'auto', padding: 8 }}
          >
            <JsonFormsDispatch
              schema={props.schema}
              uischema={element}
              path={props.path}
              enabled={props.enabled}
              renderers={props.renderers}
              cells={props.cells}
            />
          </ResizablePanel>
        </React.Fragment>
      ))}
    </ResizablePanelGroup>
  );
};
export const SplitLayoutRenderer = withJsonFormsLayoutProps(ShadcnSplitLayout);
