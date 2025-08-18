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
  UISchemaElement,
  uiTypeIs,
} from '@jsonforms/core';
import {
  JsonFormsDispatch,
  useJsonForms,
  withJsonFormsLayoutProps,
} from '@jsonforms/react';
import React, { useEffect, useMemo, useRef } from 'react';
import { proxy } from 'valtio';
import DynamicJSXRenderer, {
  ElementRender,
} from '../components/DynamicJSXRenderer';

export interface TemplateLayoutProps extends LayoutProps {
  uischema: UISchemaElement & { template: string; name?: string };
  components?: Record<string, React.ComponentType<any>>;
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
  renderers,
  cells,
  components = {}, // Default to an empty object
}: TemplateLayoutProps) => {
  if (!visible) return null;

  const template = uischema.template;

  const renderablesRef = useRef<Record<string, React.MemoExoticComponent<any>>>(
    {}
  );

  const namedElements = useMemo(() => {
    const elements: (UISchemaElement & { name?: string })[] =
      (uischema as Layout).elements ?? [];

    return elements.map((element, index) => {
      if (!element.name) element.name = index.toString();

      if (!renderablesRef.current[element.name]) {
        // Memoized component for this element
        renderablesRef.current[element.name] = React.memo(
          ({ schema, path, enabled, renderers, cells, uischema }) => {
            return (
              <JsonFormsDispatch
                key={`${path}-${index}`}
                uischema={uischema}
                schema={schema}
                path={path}
                enabled={enabled}
                renderers={renderers}
                cells={cells}
              />
            );
          }
        );
      }

      // Attach render function to the original element
      (element as any)[ElementRender] = () => {
        const Renderable = renderablesRef.current[element.name];
        return (
          <Renderable
            schema={schema}
            enabled={enabled}
            renderers={renderers}
            cells={cells}
            uischema={element}
          />
        );
      };

      return element;
    });
  }, [uischema]);

  const elementsByName = useMemo(() => {
    const map: Record<string, any> = {};
    namedElements.forEach((el) => (map[el.name] = el));
    return map;
  }, [namedElements]);

  const proxyElements = useMemo(() => {
    return new Proxy(namedElements, {
      get(target, prop: string | symbol) {
        if (typeof prop === 'string' && elementsByName[prop]) {
          return elementsByName[prop];
        }
        return Reflect.get(target, prop);
      },
    });
  }, [namedElements, elementsByName]);

  const ctx = useJsonForms();

  // Create a stable proxy that gets updated with new data
  const { dataProxy, errorsProxy, additionalErrorsProxy } = useMemo(() => {
    const dataProxy = proxy({ __val__: ctx.core?.data });
    const errorsProxy = proxy({ __val__: ctx.core?.errors });
    const additionalErrorsProxy = proxy({
      __val__: ctx.core?.additionalErrors,
    });
    return { dataProxy, errorsProxy, additionalErrorsProxy };
  }, []);

  // Update proxies efficiently
  useEffect(() => {
    const updateProxy = (proxyTarget: any, newValue: any) => {
      if (newValue === null || newValue === undefined) {
        proxyTarget.__val__ = newValue;
        return;
      }

      if (proxyTarget.__val__ === null || proxyTarget.__val__ === undefined) {
        proxyTarget.__val__ = newValue;
        return;
      }

      const deepMerge = (target: any, source: any) => {
        if (source === null || source === undefined) {
          return;
        }

        if (Array.isArray(source)) {
          if (!Array.isArray(target)) {
            // Replace with new array if target isn't an array
            return source;
          }
          // For arrays, properly merge without initially truncating
          source.forEach((item: any, index: number) => {
            if (item && typeof item === 'object' && !Array.isArray(item)) {
              // For objects in arrays, preserve existing object if it exists and is an object
              if (
                !target[index] ||
                typeof target[index] !== 'object' ||
                Array.isArray(target[index])
              ) {
                target[index] = {};
              }
              const result = deepMerge(target[index], item);
              if (result !== undefined) {
                target[index] = result;
              }
            } else if (Array.isArray(item)) {
              // For nested arrays, preserve existing array if it exists and is an array
              if (!Array.isArray(target[index])) {
                target[index] = [];
              }
              const result = deepMerge(target[index], item);
              if (result !== undefined) {
                target[index] = result;
              }
            } else {
              // For primitives, just assign
              target[index] = item;
            }
          });

          // Remove extra items from target array to match source length
          if (target.length > source.length) {
            target.splice(source.length);
          }
          return;
        }

        if (typeof source === 'object' && !Array.isArray(source)) {
          if (typeof target !== 'object' || Array.isArray(target)) {
            // Replace with new object if target isn't an object
            return source;
          }

          Object.keys(source).forEach((key) => {
            if (
              source[key] &&
              typeof source[key] === 'object' &&
              !Array.isArray(source[key])
            ) {
              // Preserve existing object if it exists and is an object (not array)
              if (
                !target[key] ||
                typeof target[key] !== 'object' ||
                Array.isArray(target[key])
              ) {
                target[key] = {};
              }
              const result = deepMerge(target[key], source[key]);
              if (result !== undefined) {
                target[key] = result;
              }
            } else {
              target[key] = source[key];
            }
          });
          return;
        }

        // For primitives, just return the new value
        return source;
      };

      const result = deepMerge(proxyTarget.__val__, newValue);
      if (result !== undefined) {
        proxyTarget.__val__ = result;
      }
    };

    updateProxy(dataProxy, ctx.core?.data);
    updateProxy(errorsProxy, ctx.core?.errors);
    updateProxy(additionalErrorsProxy, ctx.core?.additionalErrors);
  }, [
    ctx.core?.data,
    ctx.core?.errors,
    ctx.core?.additionalErrors,
    dataProxy,
    errorsProxy,
    additionalErrorsProxy,
  ]);

  const rendererProps = useMemo(
    () => ({
      elements: proxyElements,
      schema: schema,
      uischema: uischema,
      data: dataProxy,
      errors: errorsProxy,
      additionalErrors: additionalErrorsProxy,
      translate: ctx.i18n?.translate,
      locale: ctx.i18n?.locale,
      // Pass the generic components prop to the renderer
      ...components,
    }),
    [
      proxyElements,
      schema,
      uischema,
      dataProxy,
      errorsProxy,
      additionalErrorsProxy,
      ctx.i18n,
      components,
    ]
  );

  // Dynamically destructure based on passed props
  const destructuringAssignment = `const { ${Object.keys(rendererProps)
    .filter((k) => !['data', 'errors', 'additionalErrors'].includes(k)) // remove these
    .join(', ')} } = props;`;

  const jsxTemplate = `
function Template(props) {
  ${destructuringAssignment}

  console.log("Template render", uischema.name);

  const data = useTrackedSnapshot(props.data);
  const errors = useTrackedSnapshot(props.errors);
  const additionalErrors = useTrackedSnapshot(props.additionalErrors);

  return (
    <React.Fragment>
      ${template.replace(/<\s*\/\s*React\.Fragment\s*>/g, '')}
    </React.Fragment>
  );
}
`;

  return <DynamicJSXRenderer jsxTemplate={jsxTemplate} props={rendererProps} />;
};

export default withJsonFormsLayoutProps(TemplateLayoutRenderer);
