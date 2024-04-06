/*
  The MIT License

  Copyright (c) 2017-2019 EclipseSource Munich
  https://github.com/eclipsesource/jsonforms

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
*/
import {
  Layout,
  LayoutProps,
  RankedTester,
  rankWith,
  uiTypeIs,
} from '@jsonforms/core';
import {
  JsonFormsDispatch,
  useJsonForms,
  withJsonFormsLayoutProps,
} from '@jsonforms/react';
import React, { useMemo } from 'react';
import JsxParser from '../jsx/JsxParser';

export interface TemplateLayoutProps extends LayoutProps {
  template: string;
}

/**
 * Default tester for a template layout.
 * @type {RankedTester}
 */
export const templateRendererTester: RankedTester = rankWith(
  1,
  uiTypeIs('TemplateLayout')
);

/**
 * Default renderer for a template layout.
 */
export const TemplateLayoutRenderer = ({
  enabled,
  schema,
  uischema,
  visible,
  path,
  renderers,
  cells,
}: TemplateLayoutProps) => {
  const ctx = useJsonForms();

  const template = (uischema as any).template;
  const namedElements = useMemo(() => {
    const elements = (uischema as Layout).elements ?? [];
    return elements.map((element, index) => {
      if ((element as any).name === undefined) {
        (element as any).name = index;
      }
      return element;
    });
  }, [uischema]);

  const children = Object.fromEntries(
    namedElements.map((element, index) => [
      (element as any).name,

      <JsonFormsDispatch
        key={`${path}-${index}`}
        uischema={element}
        schema={schema}
        path={path}
        enabled={enabled}
        renderers={renderers}
        cells={cells}
      />,
    ])
  );

  return useMemo(() => {
    if (!visible) return null;

    return (
      <JsxParser
        bindings={{
          jsonforms: ctx,
          locale: ctx.i18n?.locale,
          translate: ctx.i18n?.translate,

          children: children,
          elements: namedElements,

          data: ctx.core?.data,
          schema: ctx.core?.schema,
          uischema: ctx.core?.uischema,
          errors: ctx.core?.errors,
          additionalErrors: ctx.core?.additionalErrors,
        }}
        components={{}}
        jsx={template}
        renderInWrapper={false}
      />
    );
  }, [
    visible,
    template,
    ctx.i18n?.locale,
    namedElements,
    ctx.core?.data,
    ctx.core?.errors,
    ctx.core?.additionalErrors,
  ]);
};

export default withJsonFormsLayoutProps(TemplateLayoutRenderer);
