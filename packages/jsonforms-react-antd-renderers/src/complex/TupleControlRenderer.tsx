import React from 'react';
import { Typography, theme as antTheme } from 'antd';
import {
  ControlElement,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  getControlPath,
  StatePropsOfControlWithDetail,
  RankedTester,
  UISchemaElement,
  findUISchema,
} from '@jsonforms/core';
import {
  JsonFormsDispatch,
  JsonFormsStateContext,
  useJsonForms,
  ctxDispatchToControlProps,
  ctxToControlWithDetailProps,
  withJsonFormsContext,
} from '@jsonforms/react';
import { ControlFormItem } from '../util/cellMode';
import { useI18n } from '../util/translate';
import {
  TupleSchema,
  isComplexTupleSchema,
  resolveTupleSchema,
  tupleControlTester,
  tupleDefinition,
  tupleRenderSchema,
} from '../util/tuple';
import { TupleAdditionalItems } from './TupleAdditionalItems';
import { TupleField } from './TupleField';

export const tupleControlRendererTester: RankedTester = tupleControlTester;

/**
 * A Control addressing a fixed position, by index.
 *
 * `toDataPath` already understands both spellings - `#/items/0` resolves to
 * `"0"` and `#/prefixItems/1` to `"1"` - so a position scope needs no special
 * handling to reach the right data. What it needs is a renderer, below.
 */
const POSITION_SCOPE = /\/(?:items|prefixItems)\/(\d+)(\/.*)?$/;

interface TuplePositionContextValue {
  count: number;
  /** The whole position, through `TupleField`. */
  render: (index: number) => React.ReactElement | null;
  /** A path *inside* a position: `#/items/0/properties/city`. */
  renderWithin: (index: number, scope: string) => React.ReactElement | null;
}

const TuplePositionContext = React.createContext<
  TuplePositionContextValue | undefined
>(undefined);

/**
 * Renders one fixed position inside a custom `options.detail`.
 *
 * Declared at module scope **on purpose**. A renderer defined inside
 * `TupleControl` would be a new component type on every render, so React would
 * unmount and remount the input underneath it - and whoever was typing would
 * lose the caret. The per-render values it needs travel by context instead.
 */
const TuplePositionRenderer = (props: { uischema: UISchemaElement }) => {
  const ctx = React.useContext(TuplePositionContext);
  const scope = (props.uischema as ControlElement)?.scope;
  const match = typeof scope === 'string' ? POSITION_SCOPE.exec(scope) : null;
  if (!ctx || !match) {
    return null;
  }
  const index = Number(match[1]);
  // A layout naming a position the schema does not declare renders nothing,
  // rather than inventing one.
  if (index < 0 || index >= ctx.count) {
    return null;
  }
  const within = match[2];
  return within ? ctx.renderWithin(index, `#${within}`) : ctx.render(index);
};

const positionEntry: JsonFormsRendererRegistryEntry = {
  tester: (uischema) => {
    const scope = (uischema as ControlElement)?.scope;
    return uischema?.type === 'Control' &&
      typeof scope === 'string' &&
      POSITION_SCOPE.test(scope)
      ? 9999
      : -1;
  },
  renderer: TuplePositionRenderer as any,
};

/** Every position index a layout names, at any depth. */
const namedPositions = (element: unknown, found = new Set<number>()) => {
  if (!element || typeof element !== 'object') {
    return found;
  }
  const node = element as UISchemaElement & {
    scope?: string;
    elements?: unknown[];
  };
  const match =
    typeof node.scope === 'string' ? POSITION_SCOPE.exec(node.scope) : null;
  if (match) {
    found.add(Number(match[1]));
  }
  if (Array.isArray(node.elements)) {
    for (const child of node.elements) {
      namedPositions(child, found);
    }
  }
  return found;
};

/**
 * The layout a control supplies for its fixed positions, when it supplies one.
 *
 * `options.detail`, the same name every other container control uses, and with
 * the same meaning: a UI schema whose scopes resolve against **this control's
 * own schema**. For an object that is `#/properties/city`; for a tuple it is
 * `#/items/0`, or `#/items/0/properties/city` to reach inside a position.
 *
 * Not `options.layout`: the specification reserves that for how a control
 * participates in **its parent's** layout (`span`, `weight`, `width`), and a
 * tuple sitting in a HorizontalLayout may legitimately carry it.
 */
const positionLayoutOf = (
  options: Record<string, any>
): UISchemaElement | undefined => {
  const layout = options.detail;
  return layout &&
    typeof layout === 'object' &&
    typeof (layout as UISchemaElement).type === 'string'
    ? (layout as UISchemaElement)
    : undefined;
};

type Props = StatePropsOfControlWithDetail & {
  handleChange: (path: string, value: unknown) => void;
};

/**
 * A positional array: one editor per declared position, in a row by default.
 *
 * It is a **Control bound to array data**, not a layout - its children come
 * from the schema's positions, not from UI-schema elements - which is why there
 * is no Add, Delete or Reorder affordance for the declared positions. Only the
 * Additional items section, when the schema permits a tail, may add or remove,
 * and only past the prefix.
 */
export const TupleControl = (props: Props) => {
  const {
    data,
    enabled,
    errors,
    label,
    path,
    required,
    rootSchema,
    schema,
    uischema,
    uischemas,
    visible,
  } = props;
  const { token } = antTheme.useToken();
  const t = useI18n();
  const jsonforms = useJsonForms();

  const options = {
    ...props.config,
    ...(uischema.options ?? {}),
  } as Record<string, any>;
  const vertical =
    (uischema.options?.vertical ??
      props.config?.jsonformsExtended?.tuple?.vertical ??
      false) === true;
  const definition = tupleDefinition(schema, options.variant === 'tuple');
  const values: unknown[] = Array.isArray(data) ? data : [];
  const editable = enabled !== false;

  if (!visible) {
    return null;
  }

  const positionLabel = (index: number) =>
    t('tuple.position', { position: index + 1 });

  /** A position's displayed name: its schema title, else the localized label. */
  const positionName = (index: number) =>
    tupleRenderSchema(fieldSchema(index)).title ?? positionLabel(index);

  /** The schema at a position: declared, or the tail for a trailing value. */
  const fieldSchema = (index: number): TupleSchema => {
    if (!definition) {
      return true;
    }
    const declared = definition.prefix[index];
    const fallback = definition.tail === false ? true : definition.tail;
    return resolveTupleSchema(declared ?? fallback, rootSchema);
  };

  /**
   * The UI schema for a position.
   *
   * A complex position goes through the ranked registry, so a host can supply a
   * Control carrying `summary` and `detail` for it - the mechanism section 18
   * names, rather than a tuple-specific per-index option map. A scalar position
   * needs nothing but a label.
   */
  const fieldUiSchema = (index: number): UISchemaElement => {
    const positionSchema = tupleRenderSchema(fieldSchema(index));
    const name = positionName(index);
    if (!isComplexTupleSchema(fieldSchema(index))) {
      return { type: 'Control', scope: '#', label: name } as ControlElement;
    }
    const found = findUISchema(
      /*
        Entries without a callable tester are dropped rather than handed to
        core, which calls every tester unguarded. A registry is host code, so a
        malformed entry is a host mistake - but one that would otherwise take
        the whole form down with a TypeError instead of just failing to match.
        The demo's UI-schema editor produces exactly this shape, because
        `JSON.stringify` cannot carry a function.
      */
      (uischemas ?? []).filter((entry) => typeof entry?.tester === 'function'),
      positionSchema,
      '#',
      `${path}.${index}`,
      () => ({ type: 'Control', scope: '#', label: name } as ControlElement),
      /*
        Deliberately carries **no** `detail`. On a tuple, `options.detail` is
        the layout of the positions, scoped against the tuple - forwarding it
        here would hand a position a UI schema whose scopes resolve somewhere
        else entirely.

        A position's own dialog comes from the registry, which is what the
        specification recommends anyway ("omit it when selecting individual
        registry entries") and what every caller already does. The forwarded
        form applied one dialog layout to every complex position regardless of
        its schema, and crashed outright on an array-typed one.
      */
      { type: 'Control', scope: '#' } as ControlElement,
      rootSchema
    );
    return {
      ...found,
      label: (found as { label?: unknown }).label ?? name,
    } as UISchemaElement;
  };

  const positionLayout = positionLayoutOf(options);

  /**
   * Messages for positions the layout leaves out.
   *
   * A layout may show part of a tuple, but the data it hides is still
   * validated: "hiding a control does not discard its underlying errors or
   * exempt its data from validation. Ensure eligible errors remain
   * discoverable without forcing hidden controls visible merely to show them."
   *
   * Without this the form is simply invalid with nothing on screen saying so -
   * the position that failed is the one the author chose not to draw. Each
   * message is prefixed with the position's name, because the field it belongs
   * to is not there to identify it.
   */
  const hiddenPositionErrors = (): string[] => {
    if (!positionLayout || !definition) {
      return [];
    }
    const named = namedPositions(positionLayout);
    const messages: string[] = [];
    definition.prefix.forEach((_, index) => {
      if (named.has(index)) {
        return;
      }
      const target = `${path}.${index}`;
      const own = (jsonforms.core?.errors ?? []).filter((error) => {
        const at = getControlPath(error);
        // The position itself, or anything under it when it is complex.
        return at === target || at.startsWith(`${target}.`);
      });
      for (const error of own) {
        messages.push(`${positionName(index)}: ${error.message}`);
      }
    });
    return messages;
  };

  const field = (index: number) => (
    <TupleField
      key={index}
      schema={fieldSchema(index)}
      prefix={definition?.prefix ?? []}
      index={index}
      arrayPath={path}
      rootSchema={rootSchema}
      uischema={fieldUiSchema(index)}
      enabled={editable}
      options={options}
    />
  );

  /*
    What the tuple itself reports: its own array-level errors, plus anything
    belonging to a position the layout left out.
  */
  const shownErrors = [errors, ...hiddenPositionErrors()]
    .filter(Boolean)
    .join('\n');

  /*
    The specification's diagnostic for a configuration that cannot be a tuple -
    `variant: "tuple"` on a uniform array without equal non-negative bounds, or
    on something that is not an array at all. Reported rather than guessed at,
    and rendered in place of the fields so the request is visibly unmet instead
    of silently ignored.
  */
  const content = !definition ? (
    <Typography.Text type='danger' role='alert' data-tuple-diagnostic>
      {t('tuple.configuration')}
    </Typography.Text>
  ) : (
    <>
      {positionLayout ? (
        /*
          A supplied layout replaces the default row or column, and `vertical`
          no longer applies - the layout decides. Positions are still rendered
          by `TupleField`, through `positionEntry`, so a position keeps its
          label, its complex-value summary and its dialog wherever the layout
          puts it.

          Dispatching the real layout rather than interpreting it means a Group
          here is the ordinary Group renderer, with its collapse state,
          validation indicator and everything else it already does.
        */
        <div data-tuple-fields data-tuple-layout>
          <TuplePositionContext.Provider
            value={{
              count: definition.prefix.length,
              render: field,
              renderWithin: (index, scope) => (
                /*
                  A scope reaching *into* a position - `#/items/0/properties/
                  city` - is dispatched against that position's own schema,
                  with the remainder as the scope.

                  **TODO: delete this once JSON Forms core is fixed.** It is a
                  workaround for an upstream defect, not a design: a tester
                  resolves a scope only when the enclosing schema is an object
                  (`schemaMatches` guards on `hasType(schema, 'object')`), and
                  a tuple's is an array - so the control is offered the whole
                  array schema, matches nothing, and renders blank with no
                  error. Re-rooting at the position puts an object back in the
                  slot the tester inspects.

                  The upstream fix is two lines, and Adjustment 20.6 carries it
                  with the reproduction and the evidence it is safe. When it
                  lands: narrow `positionEntry`'s tester to a bare position
                  scope and delete `renderWithin` - the deep-scope tests in
                  `tupleControl.test.tsx` passing unchanged is the signal that
                  the removal was safe.
                */
                <JsonFormsDispatch
                  schema={tupleRenderSchema(fieldSchema(index)) as JsonSchema}
                  uischema={{ type: 'Control', scope } as ControlElement}
                  path={`${path}.${index}`}
                  renderers={props.renderers}
                  cells={props.cells}
                  enabled={editable}
                />
              ),
            }}
          >
            <JsonFormsDispatch
              schema={schema as JsonSchema}
              uischema={positionLayout}
              path={path}
              renderers={[...(props.renderers ?? []), positionEntry]}
              cells={props.cells}
              enabled={editable}
            />
          </TuplePositionContext.Provider>
        </div>
      ) : (
        <div
          data-tuple-fields
          style={{
            display: 'flex',
            flexDirection: vertical ? 'column' : 'row',
            flexWrap: vertical ? 'nowrap' : 'wrap',
            gap: token.margin,
            alignItems: vertical ? 'stretch' : 'flex-start',
          }}
        >
          {definition.prefix.map((_, index) => field(index))}
        </div>
      )}
      {/*
        The section is shown when the schema permits a tail, and also when it
        does not but the data already has trailing values - those must be
        preserved and given "an explicit corrective removal action", never
        truncated on load.
      */}
      {(definition.tail !== false ||
        values.length > definition.prefix.length) && (
        <TupleAdditionalItems
          definition={definition}
          config={props.config}
          path={path}
          data={values}
          schema={schema}
          rootSchema={rootSchema}
          options={options}
          enabled={editable}
          onChange={(next) => props.handleChange(path, next)}
          renderItem={field}
          positionLabel={positionLabel}
        />
      )}
    </>
  );

  return (
    /*
      Array-level errors - minItems, maxItems, uniqueItems - belong to the tuple
      as a whole and appear here, beneath it. `props.errors` on an array control
      carries only errors at the array's own path, so a position's error stays
      beside that position and never marks the others invalid.

      The exception is a position a supplied layout does not draw: its error
      has no field to sit beside, so it is reported here instead, named.
    */
    <ControlFormItem
      hideRequiredAsterisk={uischema.options?.hideRequiredAsterisk}
      id={props.id}
      label={label}
      required={required}
      errors={shownErrors || undefined}
      help={shownErrors || props.description}
    >
      {options.showBorder === false ? (
        <div data-tuple-control>{content}</div>
      ) : (
        /*
          `showBorder` defaults to true: one subtle boundary around the heading,
          the positions, the additional items and the array-level errors, so a
          tuple reads as one value rather than as several loose fields.
        */
        <div
          data-tuple-control
          style={{
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: token.borderRadius,
            padding: token.paddingSM,
          }}
        >
          {content}
        </div>
      )}
    </ControlFormItem>
  );
};

/**
 * State props come from the *detail* mapping, because a complex position
 * resolves its editor through the UI-schema registry and only that mapping
 * supplies `uischemas`. Dispatch props are added by hand, because
 * `withJsonFormsDetailProps` supplies none at all - it is built for renderers
 * whose children do their own writing, and the Additional items section writes
 * the array itself.
 */
const withTupleProps = (Component: React.ComponentType<Props>) =>
  function WithTupleProps({
    ctx,
    props,
  }: {
    ctx: JsonFormsStateContext;
    props: any;
  }) {
    return (
      <Component
        {...props}
        {...ctxToControlWithDetailProps(ctx, props)}
        {...ctxDispatchToControlProps(ctx.dispatch)}
      />
    );
  };

export const TupleControlRenderer = withJsonFormsContext(
  withTupleProps(React.memo(TupleControl)) as any
);

export default TupleControlRenderer;
