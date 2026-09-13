import { SharedSplitLayoutRenderer, sharedSplitLayoutTester } from './renderers/SplitLayoutRenderer';
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
import { SpacerRenderer, spacerRendererTester } from './renderers/SpacerRenderer';
import { ImageViewRenderer, imageViewRendererTester } from './renderers/ImageViewRenderer';
import { SeparatorRenderer, separatorRendererTester } from './renderers/SeparatorRenderer';
import { HorizontalColumnsLayoutRenderer, horizontalColumnsLayoutTester } from './renderers/HorizontalLayoutRenderer';

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
    { tester: sharedSplitLayoutTester, renderer: SharedSplitLayoutRenderer },
    { tester: horizontalColumnsLayoutTester, renderer: HorizontalColumnsLayoutRenderer },
    { tester: spacerRendererTester, renderer: SpacerRenderer },
    { tester: imageViewRendererTester, renderer: ImageViewRenderer },
    { tester: separatorRendererTester, renderer: SeparatorRenderer },
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
