import { ControlElement, UISchemaElement, findUISchema } from '@jsonforms/core';

/** Editor details use upstream mode semantics and retain their caller's scope
 * and fallback. A bare elements container is the legacy vertical-layout form. */
export const findDetailUISchema: typeof findUISchema = (
  registry,
  schema,
  schemaPath,
  path,
  fallback = 'VerticalLayout',
  control,
  rootSchema
) => {
  const detail = control?.options?.detail;
  const normalized =
    detail &&
    typeof detail === 'object' &&
    !detail.type &&
    Array.isArray(detail.elements)
      ? { ...detail, type: 'VerticalLayout' }
      : detail;
  const generate =
    typeof detail === 'string' && detail.toUpperCase() === 'GENERATE';
  const guardedFallback =
    typeof fallback === 'function'
      ? () => {
          const result = fallback();
          // A fallback Control delegates again. Carry generation intent through that
          // dispatch so its object/array editor cannot pick the registry back up.
          return generate && result.type === 'Control'
            ? { ...result, options: { ...result.options, detail: 'GENERATE' } }
            : result;
        }
      : fallback;
  return findUISchema(
    registry,
    schema,
    schemaPath,
    path,
    guardedFallback,
    control
      ? { ...control, options: { ...control.options, detail: normalized } }
      : undefined,
    rootSchema
  );
};

/** Explicit editor option; absence preserves the host's existing fallback.
 * Tuple-field layouts and recursive-node defaults may already come from a registry. */
export const resolveEditorDetail = (
  detail: unknown,
  registry: Parameters<typeof findUISchema>[0],
  schema: Parameters<typeof findUISchema>[1],
  schemaPath: string,
  path: string,
  rootSchema: Parameters<typeof findUISchema>[6],
  fallback: UISchemaElement
): UISchemaElement =>
  detail === undefined
    ? fallback
    : findDetailUISchema(
        registry,
        schema,
        schemaPath,
        path,
        () => fallback,
        {
          type: 'Control',
          scope: schemaPath,
          options: { detail },
        } as ControlElement,
        rootSchema
      );
