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
import DynamicJSXRenderer, {
  ElementRender,
} from '../components/DynamicJSXRenderer';
import { proxy } from 'valtio';

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
 * Wrap any value (object, array, primitive) into a safe proxy container.
 */
function createSafeProxy<T>(value: T) {
  if (value && typeof value === 'object' && '__val__' in value) return value;
  return proxy({ __val__: value });
}
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
    const dataProxy = createSafeProxy(ctx.core?.data);
    const errorsProxy = createSafeProxy(ctx.core?.errors);
    const additionalErrorsProxy = createSafeProxy(ctx.core?.additionalErrors);
    return { dataProxy, errorsProxy, additionalErrorsProxy };
  }, []);

  // Update proxies efficiently
  useEffect(() => {
    const updateProxy = (proxyTarget: any, newValue: any) => {
      if (!proxyTarget || !('__val__' in proxyTarget)) return;

      const current = proxyTarget.__val__;
      const isCurrentArray = Array.isArray(current);
      const isNewArray = Array.isArray(newValue);
      const isCurrentObject =
        current && typeof current === 'object' && !isCurrentArray;
      const isNewObject =
        newValue && typeof newValue === 'object' && !isNewArray;

      // Case 1: Both are arrays.
      if (isCurrentArray && isNewArray) {
        // Update or add elements.
        for (let i = 0; i < newValue.length; i++) {
          const newElement = newValue[i];
          const currentElement = current[i];
          const isCurrentElementObject =
            currentElement && typeof currentElement === 'object';
          const isNewElementObject =
            newElement && typeof newElement === 'object';

          if (
            i < current.length &&
            isCurrentElementObject &&
            isNewElementObject
          ) {
            // If element exists and both are objects/arrays, recursively update.
            updateProxy(currentElement, newElement);
          } else {
            // Otherwise, update or add the new element.
            current[i] = newElement;
          }
        }

        // Remove excess elements.
        if (current.length > newValue.length) {
          current.splice(newValue.length);
        }
      }
      // Case 2: Both are objects.
      else if (isCurrentObject && isNewObject) {
        // 1. Remove keys from the current object that no longer exist in the new one.
        Object.keys(current).forEach((k) => {
          if (!(k in newValue)) {
            delete current[k];
          }
        });

        // 2. Recursively update existing and add new properties.
        Object.keys(newValue).forEach((k) => {
          const newProp = newValue[k];
          const currentProp = current[k];

          const isCurrentPropObject =
            currentProp && typeof currentProp === 'object';
          const isNewPropObject = newProp && typeof newProp === 'object';

          // Check if both properties are objects.
          if (isCurrentPropObject && isNewPropObject) {
            // If so, make a recursive call to update the nested object.
            updateProxy(currentProp, newProp);
          } else {
            // Otherwise, directly assign the value.
            current[k] = newProp;
          }
        });
      }
      // Case 3: The type has changed (e.g., array to object, or object to primitive).
      else {
        // Directly replace the internal value with the new value.
        proxyTarget.__val__ = newValue;
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
    .map((k) =>
      k === 'data' || k === 'errors' || k === 'additionalErrors'
        ? `${k}: _${k}`
        : k
    )
    .join(', ')} } = props;`;

  const jsxTemplate = `
function Template(props) {
  ${destructuringAssignment}

  const data = useTrackedSnapshot(_data);
  const errors = useTrackedSnapshot(_errors);
  const additionalErrors = useTrackedSnapshot(_additionalErrors);

  return (
    ${template}
  );
}
`;

  return <DynamicJSXRenderer jsxTemplate={jsxTemplate} props={rendererProps} />;
};

export default withJsonFormsLayoutProps(TemplateLayoutRenderer);
