/** Shared per adapter module; loading does not evaluate authored expressions. */
let evaluator: typeof import('./dynamicCel') | undefined;
let pending: Promise<void> | undefined;
export const dynamicUiExpressionsReady = () => evaluator !== undefined;

export function loadDynamicUiExpressions(): Promise<void> {
  return (pending ??= import('./dynamicCel')
    .then((module) => {
      evaluator = module;
    })
    .catch((error) => {
      pending = undefined;
      throw error;
    }));
}

/** Low-level synchronous resolution requires preparation; form adapters do this automatically. */
export function evaluateDynamicExpression(
  descriptor: object,
  source: string,
  roots: Record<string, unknown>,
): unknown {
  if (!evaluator) throw Error('CEL evaluator is not ready');
  return evaluator.expression(descriptor, source, roots);
}
