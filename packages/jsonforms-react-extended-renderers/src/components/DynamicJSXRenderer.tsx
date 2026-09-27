import * as Sucrase from 'sucrase';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { subscribe } from 'valtio';
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
  const accessedKeys = useRef(new Set<string>());
  const previousValues = useRef(new Map<string, any>());
  const [, forceUpdate] = useState({});
  const isTracking = useRef(false);
  const subscriptionRef = useRef<null | (() => void)>(null);

  const getValueAtPath = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const trackingProxy = useMemo(() => {
    // Unwrap the proxy right here, before creating the tracking proxy.
    const unwrapped = unwrapSafeProxy(proxy);

    function createTrackingProxy(obj: any, path = '') {
      if (!obj || (typeof obj !== 'object' && !Array.isArray(obj))) return obj;

      return new Proxy(obj, {
        get(target, prop, receiver) {
          if (isTracking.current) {
            const fullPath = path ? `${path}.${String(prop)}` : String(prop);
            accessedKeys.current.add(fullPath);

            const currentValue = Reflect.get(target, prop, receiver);
            previousValues.current.set(fullPath, currentValue);
          }

          const value = Reflect.get(target, prop, receiver);

          if (value && typeof value === 'object') {
            const fullPath = path ? `${path}.${String(prop)}` : String(prop);
            return createTrackingProxy(value, fullPath);
          }

          return value;
        },
      });
    }

    return createTrackingProxy(unwrapped);
  }, [proxy]);

  useEffect(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current();
      subscriptionRef.current = null;
    }

    if (accessedKeys.current.size === 0) return;

    const unsubscribe = subscribe(proxy, () => {
      let hasRelevantChange = false;

      accessedKeys.current.forEach((path) => {
        const currentValue = getValueAtPath(proxy.__val__, path);
        const previousValue = previousValues.current.get(path);
        if (currentValue !== previousValue) {
          hasRelevantChange = true;
          previousValues.current.set(path, currentValue);
        }
      });

      if (hasRelevantChange) forceUpdate({});
    });

    subscriptionRef.current = unsubscribe;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
    };
  }, [proxy]);

  // Enable tracking during render
  isTracking.current = true;
  const result = trackingProxy;

  // Disable tracking after render (microtask)
  Promise.resolve().then(() => (isTracking.current = false));

  return result;
}

/**
 * Custom createElement: calls .render() if any child object has it
 */
// Re-exported for compatibility; defined apart so importing it does not pull
// Sucrase into the initial bundle. See ./elementRender.
export { ElementRender } from './elementRender';

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
export const makeCreateElement = (getPolicy: () => UrlPolicy) =>
  function createElement(type: any, props: any, ...children: any[]) {
    return createElementWithPolicy(getPolicy(), type, props, ...children);
  };

/**
 * Custom createElement: automatically renders objects with [ElementRender],
 * and applies the URL policy to whatever the template produced.
 */
export function createElement(type: any, props: any, ...children: any[]) {
  return createElementWithPolicy(defaultUrlPolicy, type, props, ...children);
}

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
        ...(child.children || [])
      );
      if (!React.isValidElement(result)) {
        throw new Error(
          `[ElementRender] must return a valid React element, got ${typeof result}`
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

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  template: string;
  availableVariables?: string[];
}

// Error Boundary Component
class TemplateErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  /*
    `componentDidCatch` alone is not a boundary. Without this, `hasError` was
    never set, so `render` went on returning the same children that had just
    thrown; React retried, they threw again, and the error escaped to whatever
    boundary sat above - which is how a template that threw while React was
    reconciling its children reported itself as "The template engine could not
    be loaded."
  */
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error('template.renderError:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            color: 'red',
            border: '2px solid red',
            padding: '15px',
            margin: '10px',
            backgroundColor: '#fff5f5',
            borderRadius: '4px',
          }}
        >
          <h3 style={{ margin: '0 0 10px 0' }}>Template Runtime Error</h3>
          <div style={{ marginBottom: '10px' }}>
            <strong>Error:</strong> {this.state.error?.message}
          </div>
          <details>
            <summary style={{ cursor: 'pointer' }}>Error Details</summary>
            <pre
              style={{
                fontSize: '11px',
                backgroundColor: '#f0f0f0',
                padding: '8px',
                marginTop: '8px',
                overflow: 'auto',
              }}
            >
              {this.state.error?.stack}
            </pre>
          </details>
          <details>
            <summary style={{ cursor: 'pointer' }}>Template Source</summary>
            <pre
              style={{
                fontSize: '10px',
                backgroundColor: '#f5f5f5',
                padding: '8px',
                marginTop: '8px',
                overflow: 'auto',
              }}
            >
              {this.props.template}
            </pre>
          </details>
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            Available variables:{' '}
            {this.props.availableVariables?.join(', ') || 'none'}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Define the type for the props received by the dynamic component
export default function DynamicJSXRenderer({
  jsxTemplate,
  props,
  urlPolicy,
}: any) {
  /*
    Refreshed on every render, not captured once: `config` can change, and a
    policy captured at mount would go on permitting what the host has since
    forbidden. The pragma below reads through the ref, so it stays stable.
  */
  const policyRef = useRef<UrlPolicy>(urlPolicy ?? defaultUrlPolicy);
  policyRef.current = urlPolicy ?? defaultUrlPolicy;
  const pragma = useMemo(() => makeCreateElement(() => policyRef.current), []);
  // Compile once when jsxTemplate changes
  const Component = useMemo(() => {
    try {
      // Compile JSX to JS code
      // const { code } = Babel.transform(jsxTemplate, {
      //   presets: [['react', { runtime: 'classic', pragma: 'createElement' }]],
      // });

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
        `
        "use strict";
        try {
          ${code}
          
          // Wrap the original Template function to catch render errors
          const OriginalTemplate = Template;
          function SafeTemplateWrapper(props) {
            try {
              return OriginalTemplate(props);
            } catch (renderError) {
              console.error('Template render error:', renderError);
              return React.createElement('div', {
                style: { color: 'red', border: '2px solid red', padding: '15px', margin: '10px', backgroundColor: '#fff5f5', borderRadius: '4px' }
              }, [
                React.createElement('h4', { key: 'title', style: { margin: '0 0 10px 0' } }, 'Template Runtime Error'),
                React.createElement('div', { key: 'message', style: { marginBottom: '10px' } }, [
                  React.createElement('strong', { key: 'label' }, 'Error: '),
                  React.createElement('span', { key: 'text' }, renderError.message)
                ]),
                React.createElement('div', { key: 'help', style: { fontSize: '12px', color: '#666', marginTop: '10px' } },
                  'Available variables: ' + Object.keys(props).join(', ')
                )
              ]);
            }
          }

          return SafeTemplateWrapper;
        } catch (error) {
          console.error('Template function creation error:', error);
          return function ErrorTemplate(props) {
            return React.createElement('div', {
              style: { 
                color: 'red', 
                border: '1px solid red', 
                padding: '10px', 
                margin: '10px',
                backgroundColor: '#fff5f5' 
              }
            }, 'Template function error: ' + error.message);
          };
        }
        `
      );

      const TemplateComponent = fn(React, pragma, useTrackedSnapshot);

      // Wrap in memo so React handles props changes
      if (typeof TemplateComponent !== 'function') {
        throw new Error('Template must export a function component');
      }

      // Wrap the component to catch runtime errors
      const SafeTemplate = React.memo((templateProps) => {
        try {
          return React.createElement(TemplateComponent, templateProps);
        } catch (error) {
          console.error('Template render error:', error);
          return React.createElement(
            'div',
            {
              style: {
                color: 'red',
                border: '1px solid red',
                padding: '10px',
                margin: '10px',
                backgroundColor: '#fff5f5',
              },
            },
            [
              React.createElement(
                'strong',
                { key: 'title' },
                'Template Runtime Error: '
              ),
              React.createElement('span', { key: 'message' }, error.message),
              React.createElement(
                'details',
                { key: 'details', style: { marginTop: '10px' } },
                [
                  React.createElement(
                    'summary',
                    { key: 'summary' },
                    'Available Variables'
                  ),
                  React.createElement(
                    'div',
                    {
                      key: 'vars',
                      style: { fontSize: '12px', marginTop: '5px' },
                    },
                    'data, errorsData, additionalErrorsData, elements, schema, uischema, translate, locale, path'
                  ),
                ]
              ),
            ]
          );
        }
      });

      return SafeTemplate;
    } catch (err) {
      console.error('JSX compile error:', err);
      // Fallback component if compile fails
      return React.memo((_props) => (
        <div
          style={{
            color: 'red',
            border: '1px solid red',
            padding: '10px',
            margin: '10px',
            backgroundColor: '#fff5f5',
          }}
        >
          <strong>Template Compilation Error:</strong>
          <pre style={{ fontSize: '12px', marginTop: '5px' }}>
            {err.message}
          </pre>
          <details style={{ marginTop: '10px' }}>
            <summary>Template Source</summary>
            <pre
              style={{
                fontSize: '10px',
                backgroundColor: '#f5f5f5',
                padding: '5px',
              }}
            >
              {jsxTemplate}
            </pre>
          </details>
        </div>
      ));
    }
  }, [jsxTemplate, pragma]);

  return (
    <TemplateErrorBoundary
      template={jsxTemplate}
      availableVariables={Object.keys(props)}
    >
      <Component {...props} />
    </TemplateErrorBoundary>
  );
}
