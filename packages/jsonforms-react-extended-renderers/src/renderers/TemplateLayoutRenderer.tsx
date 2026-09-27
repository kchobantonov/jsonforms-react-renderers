import {
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
import type { ExtendedUISchemaElement } from '../core/uiSchema';
import { resolveChildNames } from '../util/childNames';
import { buildFormContext } from '../util/formContext';
import {
  TemplateLayoutElement,
  resolveTemplateEngine,
} from '../util/templateLang';
import { TemplateDiagnostic } from './templateEngines';
import { ElementRender } from '../components/elementRender';
import { createLazyTemplate } from '../util/lazyTemplate';
import { UrlPolicy, resolveUrlPolicy } from '../util/urlPolicy';

/*
  The JSX engine is behind its own chunk: `DynamicJSXRenderer` imports Sucrase
  at module scope, and a form with no jsx template should not download a
  compiler. Only the marker symbol is imported eagerly, which is why it lives
  in a module of its own.
*/
const DynamicJSXRenderer = createLazyTemplate<{
  jsxTemplate: string;
  props: Record<string, unknown>;
  urlPolicy: UrlPolicy;
}>(async () => (await import('../components/DynamicJSXRenderer')).default, {
  loading: 'template.loading',
  error: 'template.loadError',
  renderError: 'template.renderError',
});

export interface TemplateLayoutProps extends LayoutProps {
  uischema: TemplateLayoutElement;
  components?: Record<string, React.ComponentType<any>>;
}

type RenderableElementProps = Pick<
  TemplateLayoutProps,
  'schema' | 'enabled' | 'renderers' | 'cells'
> & {
  path?: string;
  uischema: UISchemaElement;
};

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
  config,
  components = {}, // Default to an empty object
}: TemplateLayoutProps) => {
  /*
    The `lang: "jsx"` profile. It compiles the template with Sucrase and
    evaluates it through `new Function`, which the portable contract calls
    string evaluation - so it runs only when the host has permitted it:
    "String evaluation requires
    jsonformsExtended.security.allowScriptEvaluation=true."

    Reported rather than silently skipped, because a blank region where a
    template should be is indistinguishable from a broken template.
  */
  const engine = resolveTemplateEngine(uischema, config);

  if (!visible) return null;

  const template = uischema.template;

  const renderablesRef = useRef<Record<string, React.MemoExoticComponent<any>>>(
    {}
  );

  const { names: childNames, diagnostics: nameDiagnostics } = useMemo(
    () => resolveChildNames(uischema.elements),
    [uischema.elements]
  );

  useEffect(() => {
    for (const diagnostic of nameDiagnostics) {
      // eslint-disable-next-line no-console
      console.warn(diagnostic);
    }
  }, [nameDiagnostics.join('\u0000')]);

  /*
    The array a template receives as `elements`.

    Its items are the **elements themselves**, not wrappers. A template may
    render the whole array - `{elements}` mounts every child in order - so an
    item has to be something the JSX engine's `createElement` can process,
    which means the object carrying `[ElementRender]`. Returning
    `{ element, name }` here instead made `{elements}` throw "Objects are not
    valid as a React child", and the name belongs beside the array anyway
    because `childNames` already holds it positionally.
  */
  const namedElements = useMemo(() => {
    const elements: ExtendedUISchemaElement[] = uischema.elements ?? [];

    return elements.map((element, index) => {
      /*
        The name is computed, never written back. This used to do
        `element.name = index.toString()`, which mutates the **authored** UI
        schema - section 22 forbids that, and because JSON Forms holds one
        element object, a second form sharing the same schema inherited the
        first one's generated names.
      */
      const name = childNames[index];

      /*
        A child with no resolvable name is unaddressable, not unrenderable: it
        still has a position, so `{elements}` must mount it. The renderable is
        therefore keyed by something unique per position, and only a real name
        reaches `elementsByName` below.
      */
      const key = name ?? `\u0000unnamed:${index}`;

      if (!renderablesRef.current[key]) {
        // Memoized component for this element
        renderablesRef.current[key] = React.memo(
          ({
            schema,
            path,
            enabled,
            renderers,
            cells,
            uischema,
          }: RenderableElementProps) => {
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

      /*
        The render function still rides on the element, because that is how a
        template reaches it through `elements['name']`. Recorded as a known
        mutation in its own right; the *name* no longer is one.
      */
      (element as any)[ElementRender] = () => {
        const Renderable = renderablesRef.current[
          key
        ] as React.ComponentType<RenderableElementProps>;
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
  }, [cells, enabled, renderers, schema, uischema, childNames]);

  const elementsByName = useMemo(() => {
    const map: Record<string, any> = {};
    namedElements.forEach((element, index) => {
      const name = childNames[index];
      if (name !== undefined) {
        map[name] = element;
      }
    });
    return map;
  }, [namedElements, childNames]);

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
      // Section 13's `context (extended FormContext)`, which this profile was
      // not exposing at all. The flat `locale` stays for templates using it.
      context: buildFormContext({ ctx: ctx as any, schema, uischema }),
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

  if (engine.diagnostic) {
    return (
      <TemplateDiagnostic
        uischema={uischema}
        config={config}
        visible={visible}
      />
    );
  }

  return (
    <DynamicJSXRenderer
      jsxTemplate={jsxTemplate}
      props={rendererProps}
      /*
        Section 12's policy, resolved from the form's config and handed to the
        pragma. A template's `href={data.url}` is a URL-bearing value like any
        other; it was the one that had never been checked.
      */
      urlPolicy={resolveUrlPolicy(config)}
    />
  );
};

export default withJsonFormsLayoutProps(TemplateLayoutRenderer);
