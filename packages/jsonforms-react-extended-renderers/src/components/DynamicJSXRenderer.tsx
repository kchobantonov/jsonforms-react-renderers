import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/locale/translate';
import * as Sucrase from 'sucrase';
import React, { useMemo } from 'react';

import { useSnapshot } from 'valtio';
import { ElementRender } from './elementRender';
import { sanitizeUrlProps } from '../util/templateUrls';
import { UrlPolicy, defaultUrlPolicy } from '../util/urlPolicy';

/**
 * Unwrap the proxy container for templates
 */
function unwrapSafeProxy(proxyObj: any) {
  // If it's a special proxy wrapper, return the inner value
  if (proxyObj && typeof proxyObj === 'object' && '__val__' in proxyObj) {
    return proxyObj.__val__;
  }
  return proxyObj;
}

/**
 * Custom hook that only re-renders when accessed properties change.
 * Supports special proxies: objects, arrays, or { _value: primitive }.
 */
export function useTrackedSnapshot(proxy: any) {
  return unwrapSafeProxy(useSnapshot(proxy));
}

/**
 * Builds the JSX pragma, bound to a URL policy.
 *
 * A factory rather than a module-level "current policy" cell, because two
 * templates with different `config` can be on screen at once and a shared cell
 * would hand one of them the other's policy. Reading through `getPolicy` also
 * means the pragma itself stays identity-stable, so the compiled component is
 * not rebuilt - and the controls it slots are not remounted - when config
 * changes.
 */
const makeCreateElement = (getPolicy: () => UrlPolicy) =>
  function createElement(type: any, props: any, ...children: any[]) {
    return createElementWithPolicy(getPolicy(), type, props, ...children);
  };

/**
 * Custom createElement: automatically renders objects with [ElementRender],
 * and applies the URL policy to whatever the template produced.
 */
function createElementWithPolicy(
  policy: UrlPolicy,
  type: any,
  props: any,
  ...children: any[]
) {
  /*
    Section 12's policy, applied here rather than in the engine: every element
    a template produces passes through this pragma, so an `href`, `src` or
    `srcSet` carrying `javascript:` is dropped before the element exists.
    Doing it per engine would mean doing it three times, and forgetting it
    once.
  */
  props = sanitizeUrlProps(type, props, policy) as any;
  // Recursively process children
  function processChild(child: any, fallbackKey?: string | number): any {
    if (Array.isArray(child)) {
      return child.map((c, i) => processChild(c, i));
    }

    if (React.isValidElement(child)) {
      // Assign key if missing
      if (child.key == null && fallbackKey != null) {
        return React.cloneElement(child, { key: fallbackKey });
      }
      return child;
    }

    // If child has [ElementRender], process it
    if (
      child &&
      typeof child === 'object' &&
      typeof child[ElementRender] === 'function'
    ) {
      const result = processReactType(
        child,
        child.props || {},
        ...(child.children || []),
      );
      if (!React.isValidElement(result)) {
        throw new Error(
          `[ElementRender] must return a valid React element, got ${typeof result}`,
        );
      }
      if (result.key == null && fallbackKey != null) {
        return React.cloneElement(result, { key: fallbackKey });
      }
      return result;
    }

    return child;
  }

  // Recursively process the type
  function processReactType(
    reactType: any,
    typeProps: any = {},
    ...typeChildren: any[]
  ): any {
    // If the object has ElementRender, call it
    if (
      reactType &&
      typeof reactType === 'object' &&
      typeof reactType[ElementRender] === 'function'
    ) {
      const elementResult = reactType[ElementRender]({
        ...typeProps,
        children: typeChildren,
      });
      if (!React.isValidElement(elementResult)) {
        throw new Error(`[ElementRender] must return a valid React element`);
      }
      return elementResult;
    }

    // Standard React element
    return React.createElement(reactType, typeProps, ...typeChildren);
  }

  // Process children
  const processedChildren = children.map(processChild);

  // Process main type
  return processReactType(type, props, ...processedChildren);
}

interface TemplateDiagnosticProps {
  error: unknown;
  template: string;
  availableVariables?: string[];
  compilation?: boolean;
}

function TemplateDiagnostic({
  error,
  template,
  availableVariables = [],
  compilation = false,
}: TemplateDiagnosticProps) {
  const t = useI18n();
  return (
    <div
      role='alert'
      style={{
        color: 'red',
        border: '1px solid currentColor',
        padding: 15,
        margin: 10,
        overflowWrap: 'anywhere',
      }}
    >
      <h3>
        {t(compilation ? 'template.compileTitle' : 'template.runtimeTitle')}
      </h3>
      <p>
        <strong>{t('template.errorLabel')}</strong>{' '}
        {error instanceof Error ? error.message : String(error)}
      </p>
      {error instanceof Error && error.stack && (
        <details>
          <summary>{t('template.errorDetails')}</summary>
          <pre>{error.stack}</pre>
        </details>
      )}
      <details>
        <summary>{t('template.source')}</summary>
        <pre>{template}</pre>
      </details>
      <p>
        {t('template.availableVariables', {
          names: availableVariables.join(', ') || t('template.noVariables'),
        })}
      </p>
    </div>
  );
}

class TemplateErrorBoundary extends React.Component<
  React.PropsWithChildren<{ template: string; availableVariables: string[] }>,
  { error?: Error }
> {
  state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <TemplateDiagnostic {...this.props} error={this.state.error} />
    ) : (
      this.props.children
    );
  }
}

interface CompiledTemplateProps {
  runtimePragma: ReturnType<typeof makeCreateElement>;
  bindings: Record<string, unknown>;
}

// Define the type for the props received by the dynamic component
export default function DynamicJSXRenderer({
  jsxTemplate,
  props,
  urlPolicy,
}: any) {
  // Policy changes update the compiled template's runtime bindings without
  // replacing its component type or discarding a child's draft.
  const policy = urlPolicy ?? defaultUrlPolicy;
  const pragma = useMemo(() => makeCreateElement(() => policy), [policy]);
  // Compile once when jsxTemplate changes
  const Component = useMemo<React.ComponentType<CompiledTemplateProps>>(() => {
    try {
      // Compile JSX with the custom element pragma.
      const { code } = Sucrase.transform(jsxTemplate, {
        transforms: ['jsx'],
        jsxPragma: 'createElement',
      });

      // Create a new function that takes React and props as arguments
      // It must return the component "Template"
      // We expect the template string to define a function named Template
      // e.g. function Template(props) { return <div>Hello {props.name}</div>; }
      const fn = new Function(
        'React',
        'createElement',
        'useTrackedSnapshot',
        `"use strict"; ${code}; return Template;`,
      );
      // The compiled component remains stable across locale and data changes.
      const SafeTemplate = React.memo(function SafeTemplate({
        runtimePragma,
        bindings,
      }: CompiledTemplateProps) {
        const RenderTemplate = useMemo(
          () => fn(React, runtimePragma, useTrackedSnapshot),
          [runtimePragma],
        );
        return RenderTemplate(bindings);
      });
      SafeTemplate.displayName = 'SafeTemplate';
      return SafeTemplate;
    } catch (err) {
      console.error('JSX compile error:', err);
      // Fallback component if compile fails
      const CompileError = React.memo<CompiledTemplateProps>(({ bindings }) => (
        <TemplateDiagnostic
          error={err}
          template={jsxTemplate}
          availableVariables={Object.keys(bindings)}
          compilation
        />
      ));
      CompileError.displayName = 'TemplateCompileError';
      return CompileError;
    }
  }, [jsxTemplate]);

  return (
    <TemplateErrorBoundary
      template={jsxTemplate}
      availableVariables={Object.keys(props)}
    >
      {/* eslint-disable-next-line react/static-components -- Runtime templates must be compiled; the component type is memoized until its source changes. */}
      <Component runtimePragma={pragma} bindings={props} />
    </TemplateErrorBoundary>
  );
}
