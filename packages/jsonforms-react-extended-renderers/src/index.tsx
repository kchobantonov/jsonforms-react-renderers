import {
  SharedSplitLayoutRenderer,
  sharedSplitLayoutTester,
} from './renderers/SplitLayoutRenderer';
import { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { withJsonFormsLayoutProps } from '@jsonforms/react';
import React from 'react';
import {
  TemplateLayoutProps,
  TemplateLayoutRenderer,
} from './renderers/TemplateLayoutRenderer';
import { RactiveTemplateLayoutRenderer } from './renderers/RactiveTemplateLayoutRenderer';
import {
  TsxTemplateLayoutRenderer,
  tsxTemplateLayoutTester,
} from './renderers/TsxTemplateLayoutRenderer';
import {
  TemplateDiagnostic,
  templateLangTester,
  unsupportedTemplateLangTester,
} from './renderers/templateEngines';
import {
  ButtonRenderer,
  buttonRendererTester,
} from './renderers/ButtonRenderer';
import {
  TemplateRenderer,
  namedTemplateTester,
} from './renderers/TemplateRenderer';
import { SlotRenderer, slotRendererTester } from './renderers/SlotRenderer';
import {
  SpacerRenderer,
  spacerRendererTester,
} from './renderers/SpacerRenderer';
import {
  ImageViewRenderer,
  imageViewRendererTester,
} from './renderers/ImageViewRenderer';
import {
  SeparatorRenderer,
  separatorRendererTester,
} from './renderers/SeparatorRenderer';
import { LinkRenderer, linkRendererTester } from './renderers/LinkRenderer';
import {
  MarkupLabelRenderer,
  markupLabelTester,
} from './renderers/MarkupLabelRenderer';

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
    /*
      The `columns` layout renderer is no longer registered. It encoded child
      width as `options.columns`, an integer from 2 to 16 against a fixed
      16-column grid - the encoding the Svelte and Vuetify renderer families
      use, and one the portable contract replaces with `options.layout.span`
      against a configurable `gridColumns`.

      Registering it would have kept overriding the base HorizontalLayout at
      rank 3, so the sizing model could never take effect. The renderer and its
      tester are still exported for a host that wants the old behaviour back;
      a `columns` option now draws a diagnostic instead of silently sizing
      nothing. See Adjustment 21.
    */
    { tester: spacerRendererTester, renderer: SpacerRenderer },
    { tester: imageViewRendererTester, renderer: ImageViewRenderer },
    { tester: separatorRendererTester, renderer: SeparatorRenderer },
    { tester: linkRendererTester, renderer: LinkRenderer },
    /*
      A `Label` that asks for markup. Registered without typography slots: a
      renderer set that has them binds its own entry ahead of this one, and
      ties go to the earlier registration.
    */
    { tester: markupLabelTester, renderer: MarkupLabelRenderer },
    ...(includeButtonRenderer
      ? [
          {
            tester: buttonRendererTester,
            renderer: ButtonRenderer,
          },
        ]
      : []),
    /*
      One entry per template language. The engine is chosen in the **tester**,
      which sees the form-wide `config` and therefore `defaultTemplateLang`;
      resolution is explicit `lang`, then that config key, then `ractive`.
    */
    /*
      Above the string engines: a function template is selected by the shape
      of `template`, not by `lang`, and must win over them.
    */
    {
      tester: tsxTemplateLayoutTester,
      renderer: TsxTemplateLayoutRenderer,
    },
    {
      tester: templateLangTester('jsx'),
      renderer: WrappedTemplateLayoutRenderer,
    },
    {
      tester: templateLangTester('ractive'),
      renderer: withJsonFormsLayoutProps(RactiveTemplateLayoutRenderer),
    },
    /*
      Lower-ranked, so it only wins when neither engine claimed the element:
      "unknown or unsupported languages must be diagnosed rather than
      interpreted as another engine".
    */
    {
      tester: unsupportedTemplateLangTester,
      renderer: withJsonFormsLayoutProps(TemplateDiagnostic as any),
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

export * from './core/ajv';
export * from './core/keywords';
export * from './core/dynamicDefaults';
export * from './core/ajvI18n';
export { default as extendedTransformKeyword } from './core/transform';
/*
  `./core/ajvI18n/localizers` is deliberately **not** re-exported: it imports
  every language `ajv-i18n` ships, and re-exporting it here would put them in
  the bundle of every form that touches this package. It is imported by path.
*/
export * from './core/uiSchema';
export * from './util/configNamespaces';
export * from './util/urlPolicy';
export * from './util/templateUrls';
export * from './util/additionalErrors';
export * from './components/ExtendedJsonForms';
export * from './util/editorDiagnostics';
export * from './util/extendedControls';
export * from './util/maskControls';
export * from './util/cron';
export * from './util/useDurationControl';
export * from './util/editorControls';
export * from './renderers/EditorControlFrame';
export * from './util/useEditorAppearance';
export * from './util/i18nDefaults';
export * from './util/useExtendedTranslator';
export * from './util/extendedLocale';
export * from './util/markup';
export * from './util/interpolate';
export * from './util/markdownEscape';
/*
  `./util/markdown` is deliberately **not** re-exported, for the same reason
  as `./core/ajvI18n/localizers` above: it imports markdown-it statically, so
  naming it here would put the parser in the entry chunk of every form and
  undo the dynamic import in `MarkupLabelRenderer`. It is imported by path.
*/
export * from './authoring/cssLength';
export * from './authoring/schemaTypes';
export * from './authoring/forSchema';
export * from './locale/bg';
export * from './locale/de';
export * from './renderers/MonacoControlRenderer';
export * from './renderers/AgGridControlRenderer';
