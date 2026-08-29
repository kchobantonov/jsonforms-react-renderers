import { LayoutProps, RankedTester, UISchemaElement, rankWith, uiTypeIs } from '@jsonforms/core';
import { JsonFormsDispatch, withJsonFormsLayoutProps } from '@jsonforms/react';
import React from 'react';
import { NamedElement, TemplateSlotsContext } from './TemplateRenderer';

export const slotRendererTester: RankedTester = rankWith(2, uiTypeIs('Slot'));

export const SlotRendererComponent = (props: LayoutProps) => {
  const slots = React.useContext(TemplateSlotsContext);
  const element = props.uischema as NamedElement;
  const fallback = element.elements?.[0];
  const contents: UISchemaElement | undefined = element.name ? slots[element.name] ?? fallback : fallback;
  if (!props.visible || !contents) return null;
  return <JsonFormsDispatch schema={props.schema} uischema={contents} path={props.path} enabled={props.enabled} renderers={props.renderers} cells={props.cells} />;
};

export const SlotRenderer = withJsonFormsLayoutProps(SlotRendererComponent);
