/**
 * The marker a template layout puts on a child so the JSX engine's
 * `createElement` knows to render it.
 *
 * It lives in its own module, apart from the engine that reads it, purely so
 * that importing the marker does not import the engine. `DynamicJSXRenderer`
 * pulls in Sucrase at module scope; a renderer that only needed this symbol
 * would otherwise drag the whole compiler into the initial bundle and defeat
 * the code split around it.
 *
 * `Symbol.for` rather than `Symbol()`: the marker has to match across module
 * instances, which a duplicated dependency or a separately bundled chunk can
 * produce.
 */
export const ElementRender = Symbol.for('jsonforms.element.render');
