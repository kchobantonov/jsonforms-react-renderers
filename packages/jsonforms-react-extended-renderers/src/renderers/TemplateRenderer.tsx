import { LayoutProps, RankedTester, UISchemaElement, and, rankWith, uiTypeIs } from '@jsonforms/core';
import { JsonFormsDispatch, useJsonForms, withJsonFormsLayoutProps } from '@jsonforms/react';
import React from 'react';

export type NamedElement = UISchemaElement & { name?: string; elements?: UISchemaElement[] };
export type TemplateSlots = Record<string, UISchemaElement>;
export const TemplateSlotsContext = React.createContext<TemplateSlots>({});

export const hasTemplateName = (uischema: UISchemaElement): boolean =>
  typeof (uischema as NamedElement).name === 'string';

export const namedTemplateTester: RankedTester = rankWith(
  2,
  and(uiTypeIs('Template'), hasTemplateName)
);

export const TemplateRendererComponent = (props: LayoutProps) => {
  const context = useJsonForms();
  const inherited = React.useContext(TemplateSlotsContext);
  const element = props.uischema as NamedElement;
  const slots = React.useMemo(
    () => ({
      ...inherited,
      ...(element.elements ?? []).reduce<TemplateSlots>((result, child) => {
        const name = (child as NamedElement).name;
        if (name) result[name] = child;
        return result;
      }, {}),
    }),
    [element.elements, inherited]
  );
  const template = context.uischemas?.find(
    (entry) => (entry.uischema as NamedElement).name === element.name
  )?.uischema;
  if (!props.visible || !template) return null;
  return (
    <TemplateSlotsContext.Provider value={slots}>
      <JsonFormsDispatch schema={props.schema} uischema={template} path={props.path} enabled={props.enabled} renderers={props.renderers} cells={props.cells} />
    </TemplateSlotsContext.Provider>
  );
};

export const TemplateRenderer = withJsonFormsLayoutProps(TemplateRendererComponent);
