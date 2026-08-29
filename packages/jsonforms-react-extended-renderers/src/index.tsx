import { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { withJsonFormsLayoutProps } from '@jsonforms/react';
import React from 'react';
import {
  TemplateLayoutProps,
  TemplateLayoutRenderer,
  templateRendererTester,
} from './renderers/TemplateLayoutRenderer';
import { ButtonRenderer, buttonRendererTester } from './renderers/ButtonRenderer';
import { TemplateRenderer, namedTemplateTester } from './renderers/TemplateRenderer';
import { SlotRenderer, slotRendererTester } from './renderers/SlotRenderer';

export type CreateExtendedRenderersOptions = {
  components?: Record<string, React.ComponentType<any>>;
  includeButtonRenderer?: boolean;
};

export const createExtendedRenderers = (
  componentsOrOptions?:
    | Record<string, React.ComponentType<any>>
    | CreateExtendedRenderersOptions
): JsonFormsRendererRegistryEntry[] => {
  const options: CreateExtendedRenderersOptions =
    componentsOrOptions && 'components' in componentsOrOptions
      ? (componentsOrOptions as CreateExtendedRenderersOptions)
      : {
          components: componentsOrOptions as
            | Record<string, React.ComponentType<any>>
            | undefined,
        };
  const components = options.components;
  const includeButtonRenderer = options.includeButtonRenderer ?? true;

  // Wrap the TemplateLayoutRenderer with JSON Forms props
  const WrappedTemplateLayoutRenderer = withJsonFormsLayoutProps(
    (props: TemplateLayoutProps) => (
      <TemplateLayoutRenderer {...props} components={components} />
    )
  );

  return [
    ...(includeButtonRenderer
      ? [
          {
            tester: buttonRendererTester,
            renderer: ButtonRenderer,
          },
        ]
      : []),
    {
      tester: templateRendererTester,
      renderer: WrappedTemplateLayoutRenderer,
    },
    {
      tester: namedTemplateTester,
      renderer: TemplateRenderer,
    },
    {
      tester: slotRendererTester,
      renderer: SlotRenderer,
    },
  ];
};
export * from './renderers';
