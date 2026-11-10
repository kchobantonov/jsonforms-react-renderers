/** In-process capability; JSON and lookalike symbols cannot grant trust. */
export const TRUST_DYNAMIC_FUNCTIONS: unique symbol = Symbol(
  'TRUST_DYNAMIC_FUNCTIONS',
);

/** Activation is exclusively controlled by config; external is independent. */
export function dynamicUiOptions(
  config: unknown,
  external?: Readonly<Record<string, unknown>>,
) {
  const settings = (
    config as
      | {
          jsonformsExtended?: {
            dynamic?: { enabled?: unknown; trusted?: unknown };
          };
        }
      | undefined
  )?.jsonformsExtended?.dynamic;
  return settings?.enabled === true
    ? {
        external,
        trustedFunctions: settings.trusted === TRUST_DYNAMIC_FUNCTIONS,
      }
    : undefined;
}
