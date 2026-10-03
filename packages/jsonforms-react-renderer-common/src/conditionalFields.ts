import { JsonSchema, Resolve, UISchemaElement } from '@jsonforms/core';
import type Ajv from 'ajv';
import cloneDeep from 'lodash/cloneDeep';
import { useMemo } from 'react';
import { useJsonForms } from '@jsonforms/react';
import { literalPropertySchema } from './literalPropertySchema';

export const conditionalFieldsEnabled = (ui: any, config: any): boolean =>
  (ui.options?.conditionalFields ??
    config?.jsonformsExtended?.conditionalFields) === true;

export const hasConditionalFields = (
  schema: any,
  seen = new Set<any>()
): boolean => {
  if (!schema || typeof schema !== 'object' || seen.has(schema)) return false;
  seen.add(schema);
  return (
    (schema.if !== undefined &&
      (schema.then !== undefined || schema.else !== undefined)) ||
    Object.keys(schema.dependencies ?? {}).length > 0 ||
    (schema.allOf ?? []).some((part: any) => hasConditionalFields(part, seen))
  );
};

const validators = new WeakMap<
  Ajv,
  WeakMap<object, WeakMap<object, ReturnType<Ajv['compile']>>>
>();
const evaluate = (
  ajv: Ajv,
  condition: any,
  root: JsonSchema,
  data: unknown
) => {
  if (typeof condition === 'boolean') return condition;
  let roots = validators.get(ajv);
  if (!roots) validators.set(ajv, (roots = new WeakMap()));
  let conditions = roots.get(root);
  if (!conditions) roots.set(root, (conditions = new WeakMap()));
  let validate = conditions.get(condition);
  if (!validate) {
    validate = ajv.compile(literalPropertySchema(condition, root));
    conditions.set(condition, validate);
  }
  return Boolean(validate(cloneDeep(data)));
};

/** Presentation projection only. The host still validates the original schema. */
export const projectConditionalFields = (
  schema: JsonSchema,
  rootSchema: JsonSchema,
  data: unknown,
  ajv: Ajv
) => {
  const properties: Record<string, any> = Object.create(null);
  const known = new Set<string>();
  const required = new Set<string>();
  const diagnostics: string[] = [];
  const seen = new Set<any>();
  const visit = (input: any, active: boolean) => {
    if (!input || typeof input !== 'object' || seen.has(input)) return;
    seen.add(input);
    if (input.$ref) {
      try {
        visit(Resolve.schema(rootSchema, input.$ref, rootSchema), active);
      } catch {
        diagnostics.push(
          'A conditional schema reference could not be resolved.'
        );
      }
    }
    for (const [key, value] of Object.entries(input.properties ?? {})) {
      known.add(key);
      if (active) {
        const previous = properties[key];
        // Preserve every constraint; top-level annotations guide editor selection.
        properties[key] =
          previous === undefined
            ? value
            : {
                ...(typeof previous === 'object' ? previous : {}),
                ...(typeof value === 'object' ? value : {}),
                allOf: [previous, value],
              };
      }
    }
    if (active) for (const key of input.required ?? []) required.add(key);
    for (const part of input.allOf ?? []) visit(part, active);
    if (input.if !== undefined) {
      let matches: boolean | undefined;
      if (active) {
        try {
          matches = evaluate(ajv, input.if, rootSchema, data);
        } catch {
          diagnostics.push(
            'A conditional field condition could not be evaluated.'
          );
        }
      }
      visit(input.then, active && matches === true);
      visit(input.else, active && matches === false);
    }
    for (const [key, dependency] of Object.entries(input.dependencies ?? {})) {
      const present =
        active &&
        data !== null &&
        typeof data === 'object' &&
        Object.prototype.hasOwnProperty.call(data, key);
      if (Array.isArray(dependency)) {
        if (present) for (const field of dependency) required.add(field);
      } else visit(dependency, present);
    }
    seen.delete(input);
  };
  visit(schema, true);
  const projected = { ...schema, properties, required: [...required] } as any;
  // These have already contributed to this object's presentation. Retaining them
  // here would redispatch the same branch or duplicate its fields.
  for (const key of ['$ref', 'if', 'then', 'else', 'dependencies', 'allOf'])
    delete projected[key];
  return { schema: projected as JsonSchema, known, diagnostics };
};

export const useConditionalFields = (
  schema: JsonSchema,
  root: JsonSchema,
  data: unknown,
  ui: any,
  config: any
) => {
  const context = useJsonForms();
  const enabled =
    conditionalFieldsEnabled(ui, config) && hasConditionalFields(schema);
  return useMemo(
    () =>
      enabled && context.core?.ajv
        ? projectConditionalFields(schema, root, data, context.core.ajv)
        : { schema, known: new Set<string>(), diagnostics: [] as string[] },
    [enabled, schema, root, data, context.core?.ajv]
  );
};

/** Explicit details retain authored order and groups. Only inactive branch-only
 * bindings are omitted; base fields stay visible even if conditionally required. */
export const conditionalLayout = (
  ui: UISchemaElement,
  schema: JsonSchema,
  known: Set<string>
): UISchemaElement => {
  if (known.size === 0) return ui;
  const visit = (element: any): any => {
    const key =
      element.type === 'Control' &&
      /^#\/properties\/([^/]*)(?:\/|$)/.exec(element.scope ?? '');
    const name = key?.[1]?.replace(/~1/g, '/').replace(/~0/g, '~');
    if (
      name !== undefined &&
      known.has(name) &&
      !Object.prototype.hasOwnProperty.call(schema.properties ?? {}, name)
    )
      return undefined;
    return Array.isArray(element.elements)
      ? { ...element, elements: element.elements.map(visit).filter(Boolean) }
      : element;
  };
  return visit(ui) ?? { type: 'VerticalLayout', elements: [] };
};
