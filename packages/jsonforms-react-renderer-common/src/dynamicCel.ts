import { Environment } from '@marcbachmann/cel-js';
const plain = (value: unknown): value is Record<string, unknown> =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype ||
    Object.getPrototypeOf(value) === null);

const compiledExpressions = new WeakMap<
  object,
  {
    source: string;
    names: string;
    evaluate: (roots: Record<string, unknown>) => unknown;
  }
>();

function celJsonValue(
  value: unknown,
  depth = 0,
  seen = new WeakSet<object>(),
  budget = { remaining: 10_000 },
): unknown {
  if (--budget.remaining < 0) throw Error('CEL result size limit exceeded');
  if (depth > 32) throw Error('CEL result depth limit exceeded');
  if (typeof value === 'bigint') {
    const number = Number(value);
    if (!Number.isSafeInteger(number))
      throw Error('CEL integer exceeds JSON safe range');
    return number;
  }
  if (Array.isArray(value) || plain(value)) {
    if (seen.has(value)) throw Error('cyclic CEL result');
    seen.add(value);
    const result = Array.isArray(value)
      ? value.map((entry) => celJsonValue(entry, depth + 1, seen, budget))
      : Object.fromEntries(
          Object.entries(value).map(([key, entry]) => [
            key,
            celJsonValue(entry, depth + 1, seen, budget),
          ]),
        );
    seen.delete(value);
    return result;
  }
  return value;
}

export function expression(
  descriptor: object,
  source: string,
  roots: Record<string, unknown>,
): unknown {
  if (source.length > 4096) throw Error('expression length limit exceeded');
  const names = Object.keys(roots).sort().join(',');
  let compiled = compiledExpressions.get(descriptor);
  if (!compiled || compiled.source !== source || compiled.names !== names) {
    const environment = new Environment({
      limits: {
        maxAstNodes: 256,
        maxDepth: 32,
        maxListElements: 128,
        maxMapEntries: 128,
        maxCallArguments: 8,
      },
    });
    for (const name of Object.keys(roots))
      environment.registerVariable(name, 'dyn');
    compiled = { source, names, evaluate: environment.parse(source) };
    compiledExpressions.set(descriptor, compiled);
  }
  return celJsonValue(compiled.evaluate(roots));
}
