import React from 'react';

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
import { InputShell } from '../controls/InputControl';
import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/translate';
import {
  TupleSchema,
  isComplexTupleSchema,
  resolveTupleSchema,
  tupleControlTester,
  tupleDefinition,
  tupleRenderSchema,
} from '@chobantonov/jsonforms-react-renderer-common/tuple';
import { TupleAdditionalItems } from './TupleAdditionalItems';
import { TupleField } from './TupleField';

export const tupleControlRendererTester: RankedTester = tupleControlTester;

const POSITION_SCOPE = /\/(?:items|prefixItems)\/(\d+)(\/.*)?$/;

interface TuplePositionContextValue {
  count: number;

  render: (index: number) => React.ReactElement | null;

  renderWithin: (index: number, scope: string) => React.ReactElement | null;
}

const TuplePositionContext = React.createContext<
  TuplePositionContextValue | undefined
>(undefined);

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

  const positionName = (index: number) =>
    tupleRenderSchema(fieldSchema(index)).title ?? positionLabel(index);

  const fieldSchema = (index: number): TupleSchema => {
    if (!definition) {
      return true;
    }
    const declared = definition.prefix[index];
    const fallback = definition.tail === false ? true : definition.tail;
    return resolveTupleSchema(declared ?? fallback, rootSchema);
  };

  const fieldUiSchema = (index: number): UISchemaElement => {
    const positionSchema = tupleRenderSchema(fieldSchema(index));
    const name = positionName(index);
    if (!isComplexTupleSchema(fieldSchema(index))) {
      return { type: 'Control', scope: '#', label: name } as ControlElement;
    }
    const found = findUISchema(
      (uischemas ?? []).filter((entry) => typeof entry?.tester === 'function'),
      positionSchema,
      '#',
      `${path}.${index}`,
      () => ({ type: 'Control', scope: '#', label: name } as ControlElement),

      { type: 'Control', scope: '#' } as ControlElement,
      rootSchema
    );
    return {
      ...found,
      label: (found as { label?: unknown }).label ?? name,
    } as UISchemaElement;
  };

  const positionLayout = positionLayoutOf(options);

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

  const shownErrors = [errors, ...hiddenPositionErrors()]
    .filter(Boolean)
    .join('\n');

  const content = !definition ? (
    <span className='text-destructive' role='alert' data-tuple-diagnostic>
      {t('tuple.configuration')}
    </span>
  ) : (
    <>
      {positionLayout ? (
        <div data-tuple-fields data-tuple-layout>
          <TuplePositionContext.Provider
            value={{
              count: definition.prefix.length,
              render: field,
              renderWithin: (index, scope) => (
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
            gap: 16,
            alignItems: vertical ? 'stretch' : 'flex-start',
          }}
        >
          {definition.prefix.map((_, index) => field(index))}
        </div>
      )}
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
    <InputShell
      {...props}
      id={props.id}
      label={label}
      required={required}
      errors={shownErrors || undefined}
    >
      {options.showBorder === false ? (
        <div data-tuple-control>{content}</div>
      ) : (
        <div data-tuple-control className='rounded-md border p-3'>
          {content}
        </div>
      )}
    </InputShell>
  );
};

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
