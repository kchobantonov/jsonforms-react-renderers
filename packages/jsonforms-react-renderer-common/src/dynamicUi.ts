// Framework-neutral resolution for experimental spec §11. Keep parity with the Svelte resolver.
import {
  evaluateDynamicExpression as expression,
  dynamicUiExpressionsReady,
} from './dynamicRuntime';
import isEqual from 'lodash/isEqual';
import type { UISchemaElement } from '@jsonforms/core';
import { scopeDataSegments } from './dynamicScope';

/** Explicit opt-in; replacing external with a new immutable snapshot reevaluates overlays. */
export interface DynamicUiOptions {
  external?: Readonly<Record<string, unknown>>;
  /** Admit synchronous function leaves from trusted in-process UI schemas. */
  trustedFunctions?: boolean;
}
export interface DynamicUiEnvironment {
  data: unknown;
  external?: Readonly<Record<string, unknown>>;
  config?: Readonly<Record<string, unknown>>;
  locale?: string;
  path: string;
  value?: unknown;
  item?: unknown;
  errors?: readonly unknown[];
  trustedFunctions?: boolean;
}

export interface DynamicUiResult {
  element: UISchemaElement;
  failures: readonly string[];
}

/** The value root is fixed at the authored scope for one resolution pass. */
export function dynamicBoundValue(
  authored: UISchemaElement,
  data: unknown,
  pathSegments: readonly string[],
): unknown {
  if (!('scope' in authored) || typeof authored.scope !== 'string')
    return undefined;
  return dynamicCellValue(data, [
    ...pathSegments,
    ...scopeDataSegments(authored.scope),
  ]);
}

/** Cells already receive their complete bound data path. */
export function dynamicCellValue(
  data: unknown,
  pathSegments: readonly string[],
): unknown {
  return pathSegments.reduce<unknown>(
    (current, key) =>
      current &&
      typeof current === 'object' &&
      Object.prototype.hasOwnProperty.call(current, key)
        ? (current as Record<string, unknown>)[key]
        : undefined,
    data,
  );
}

const forbidden = new Set(['__proto__', 'prototype', 'constructor']);
const plain = (value: unknown): value is Record<string, unknown> =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype ||
    Object.getPrototypeOf(value) === null);

/** Read array data without invoking indexed accessors or accepting sparse entries. */
function arrayData<T>(
  value: readonly unknown[],
  read: (entry: unknown) => T,
): T[] {
  if (value.length > 10_000) throw Error('array size limit exceeded');
  return Array.from({ length: value.length }, (_, index) => {
    const property = Object.getOwnPropertyDescriptor(value, String(index));
    if (!property || !('value' in property))
      throw Error('array contains a getter or hole');
    return read(property.value);
  });
}

function safeSnapshot(
  value: unknown,
  depth = 0,
  seen = new WeakSet<object>(),
  budget = { remaining: 10_000 },
): unknown {
  if (--budget.remaining < 0) throw Error('environment size limit exceeded');
  if (depth > 32) throw Error('environment depth limit exceeded');
  if (
    value === undefined ||
    value === null ||
    ['string', 'boolean', 'number'].includes(typeof value)
  )
    return value;
  if (Array.isArray(value)) {
    if (seen.has(value)) throw Error('cyclic environment');
    seen.add(value);
    const result = arrayData(value, (child) =>
      safeSnapshot(child, depth + 1, seen, budget),
    );
    seen.delete(value);
    return Object.freeze(result);
  }
  if (!plain(value)) throw Error('environment contains a non-data value');
  if (seen.has(value)) throw Error('cyclic environment');
  seen.add(value);
  const result: Record<string, unknown> = Object.create(null);
  for (const key of Object.keys(value)) {
    if (forbidden.has(key)) continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !('value' in descriptor))
      throw Error('environment contains a getter');
    result[key] = safeSnapshot(descriptor.value, depth + 1, seen, budget);
  }
  seen.delete(value);
  return Object.freeze(result);
}

const validatedSnapshots = new WeakMap<
  object,
  { value: unknown; nodes: number }
>();
const permittedConfigSnapshots = new WeakMap<
  object,
  { value: unknown; nodes: number }
>();

/** A new immutable root is validated once, even when many occurrences read it. */
function validatedSnapshot(value: unknown): { value: unknown; nodes: number } {
  if (value !== null && typeof value === 'object') {
    const cached = validatedSnapshots.get(value);
    if (cached) return cached;
  }
  const budget = { remaining: 10_000 };
  const result = {
    value: safeSnapshot(value, 0, new WeakSet<object>(), budget),
    nodes: 10_000 - budget.remaining,
  };
  if (value !== null && typeof value === 'object')
    validatedSnapshots.set(value, result);
  return result;
}

function permittedConfigSnapshot(config: Readonly<Record<string, unknown>>): {
  value: unknown;
  nodes: number;
} {
  const cached = permittedConfigSnapshots.get(config);
  if (cached) return cached;
  const permitted: Record<string, unknown> = Object.create(null);
  for (const key of Object.keys(config)) {
    if (key === 'jsonformsExtended') continue;
    const property = Object.getOwnPropertyDescriptor(config, key);
    if (!property || !('value' in property))
      throw Error('configuration contains a getter');
    permitted[key] = property.value;
  }
  const result = validatedSnapshot(permitted);
  permittedConfigSnapshots.set(config, result);
  return result;
}

/** Restricted own-property path grammar: roots, dotted keys, quoted keys and array indices. */
export function dynamicPath(
  source: string,
  roots: Record<string, unknown>,
): unknown {
  const parts: string[] = [];
  let index = 0;
  const first = /^[A-Za-z_][\w]*/.exec(source);
  if (!first) throw Error('invalid path');
  parts.push(first[0]);
  index += first[0].length;
  while (index < source.length) {
    const rest = source.slice(index);
    if (rest.startsWith('.')) {
      const match = /^[A-Za-z_][\w]*/.exec(rest.slice(1));
      if (!match) throw Error('invalid path');
      parts.push(match[0]);
      index += match[0].length + 1;
    } else if (rest.startsWith('[')) {
      const match = /^\[(\d+)\]/.exec(rest);
      if (match) {
        parts.push(match[1]);
        index += match[0].length;
        continue;
      }
      const quoted = /^\[(['"])((?:\\.|(?!\1)[^\\])*)\1\]/.exec(rest);
      if (!quoted) throw Error('invalid path');
      parts.push(quoted[2].replace(/\\(['"\\])/g, '$1'));
      index += quoted[0].length;
    } else throw Error('invalid path');
  }
  let current: unknown = roots;
  for (const part of parts) {
    if (forbidden.has(part)) throw Error('forbidden path');
    if (
      part === 'length' &&
      (typeof current === 'string' || Array.isArray(current))
    ) {
      current = current.length;
      continue;
    }
    if (
      current === null ||
      typeof current !== 'object' ||
      !Object.prototype.hasOwnProperty.call(current, part)
    )
      return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function template(source: string, roots: Record<string, unknown>): string {
  let result = '';
  for (let i = 0; i < source.length;) {
    if (source.startsWith('{{', i)) {
      result += '{';
      i += 2;
      continue;
    }
    if (source.startsWith('}}', i)) {
      result += '}';
      i += 2;
      continue;
    }
    if (source[i] !== '{') {
      result += source[i++];
      continue;
    }
    let close = i + 1;
    let quote: "'" | '"' | undefined;
    let escaped = false;
    for (; close < source.length; close++) {
      const char = source[close];
      if (quote) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === quote) quote = undefined;
      } else if (char === "'" || char === '"') quote = char;
      else if (char === '}') break;
    }
    if (close === source.length) throw Error('unclosed template path');
    const value = dynamicPath(source.slice(i + 1, close), roots);
    if (value === undefined || value === null || typeof value === 'object')
      throw Error('unresolved template path');
    result += String(value);
    i = close + 1;
  }
  return result;
}

function leaf(
  value: unknown,
  roots: Record<string, unknown>,
  trustedFunctions = false,
): unknown {
  if (typeof value === 'function') {
    if (!trustedFunctions) throw Error('trusted functions are disabled');
    const result = value(roots);
    if (result instanceof Promise) throw Error('asynchronous dynamic function');
    return result;
  }
  if (!plain(value)) return value;
  const keys = Object.keys(value);
  if (keys.length !== 1) return value;
  const key = keys[0];
  const property = Object.getOwnPropertyDescriptor(value, key);
  if (!property || !('value' in property))
    throw Error('descriptor contains a getter');
  if (key === 'literal') return property.value;
  if (!['bind', 'expression', 'template'].includes(key)) return value;
  if (typeof property.value !== 'string')
    throw Error('descriptor source must be a string');
  if (key === 'bind') return dynamicPath(property.value, roots);
  if (key === 'template') return template(property.value, roots);
  return expression(value, property.value, roots);
}

const descriptorKey = (value: unknown): string | undefined => {
  if (!plain(value)) return undefined;
  const keys = Object.keys(value);
  return keys.length === 1 &&
    ['bind', 'expression', 'template', 'literal'].includes(keys[0])
    ? keys[0]
    : undefined;
};

const environmentRoots = [
  'data',
  'item',
  'value',
  'path',
  'locale',
  'external',
  'errors',
  'config',
] as const;
const rootReference =
  /(?:^|[^\w])(data|item|value|path|locale|external|errors|config)(?=$|[^\w])/g;
const descriptorRoots = new WeakMap<object, ReadonlySet<string>>();

/** Conservative root inventory: false positives cost work; false negatives would hide inputs. */
function usedEnvironmentRoots(descriptor: unknown): ReadonlySet<string> {
  if (descriptor === null || typeof descriptor !== 'object') return new Set();
  const cached = descriptorRoots.get(descriptor);
  if (cached) return cached;
  const used = new Set<string>();
  const seen = new WeakSet<object>();
  const visit = (value: unknown) => {
    if (typeof value === 'function') {
      environmentRoots.forEach((root) => used.add(root));
      return;
    }
    if (value === null || typeof value !== 'object' || seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) {
      for (const property of Object.values(
        Object.getOwnPropertyDescriptors(value),
      ))
        if ('value' in property) visit(property.value);
      return;
    }
    if (!plain(value)) return;
    const key = descriptorKey(value);
    if (key === 'literal') return;
    if (key === 'bind' || key === 'expression' || key === 'template') {
      const property = Object.getOwnPropertyDescriptor(value, key);
      const source =
        property && 'value' in property ? property.value : undefined;
      if (typeof source === 'string') {
        for (const match of source.matchAll(rootReference)) used.add(match[1]);
      }
      return;
    }
    for (const [name, child] of Object.entries(
      Object.getOwnPropertyDescriptors(value),
    ))
      if (name !== '$dynamic' && 'value' in child) visit(child.value);
  };
  visit(descriptor);
  descriptorRoots.set(descriptor, used);
  return used;
}

/** Validate and copy a JSON value before it reaches an arbitrary extension renderer. */
function jsonValue(
  value: unknown,
  depth = 0,
  seen = new WeakSet<object>(),
  budget = { remaining: 10_000 },
  trustedMetadata = false,
): unknown {
  if (trustedMetadata && typeof value === 'function') return value;
  if (--budget.remaining < 0) throw Error('overlay size limit exceeded');
  if (depth > 32) throw Error('overlay depth limit exceeded');
  if (value === null || typeof value === 'string' || typeof value === 'boolean')
    return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (!value || typeof value !== 'object')
    throw Error('overlay must resolve to JSON');
  if (seen.has(value)) throw Error('cyclic overlay');
  seen.add(value);
  if (Array.isArray(value)) {
    const result = arrayData(value, (entry) =>
      jsonValue(entry, depth + 1, seen, budget, trustedMetadata),
    );
    seen.delete(value);
    return result;
  }
  if (!plain(value)) throw Error('overlay must resolve to plain data');
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    if (forbidden.has(key)) throw Error('forbidden overlay key');
    const property = Object.getOwnPropertyDescriptor(value, key);
    if (!property || !('value' in property))
      throw Error('overlay contains a getter');
    result[key] = jsonValue(
      property.value,
      depth + 1,
      seen,
      budget,
      trustedMetadata,
    );
  }
  seen.delete(value);
  return result;
}

function assertAcyclic(
  value: unknown,
  depth = 0,
  active = new WeakSet<object>(),
): void {
  if (depth > 32) throw Error('overlay depth limit exceeded');
  if (value === null || typeof value !== 'object') return;
  if (active.has(value)) throw Error('cyclic overlay');
  active.add(value);
  for (const key of Object.keys(value)) {
    const property = Object.getOwnPropertyDescriptor(value, key);
    if (property && 'value' in property)
      assertAcyclic(property.value, depth + 1, active);
  }
  active.delete(value);
}

/** Resolve descriptors inside an array before replacing it as one unit. */
function arrayValue(
  value: unknown,
  roots: Record<string, unknown>,
  trustedFunctions: boolean,
  depth = 0,
): unknown {
  if (depth > 32) throw Error('overlay depth limit exceeded');
  if (descriptorKey(value) || typeof value === 'function')
    return jsonValue(leaf(value, roots, trustedFunctions));
  if (Array.isArray(value))
    return arrayData(value, (entry) =>
      arrayValue(entry, roots, trustedFunctions, depth + 1),
    );
  if (plain(value)) {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      if (forbidden.has(key)) throw Error('forbidden overlay key');
      const property = Object.getOwnPropertyDescriptor(value, key);
      if (!property || !('value' in property))
        throw Error('overlay contains a getter');
      result[key] =
        key === '$dynamic'
          ? jsonValue(
              property.value,
              depth + 1,
              new WeakSet(),
              { remaining: 10_000 },
              trustedFunctions,
            )
          : arrayValue(property.value, roots, trustedFunctions, depth + 1);
    }
    return result;
  }
  return jsonValue(value);
}

/** Resolve only the current element. Descendants retain their own descriptors. */
export function resolveDynamicUi(
  authored: UISchemaElement,
  input: DynamicUiEnvironment,
): DynamicUiResult {
  const descriptor = (authored as UISchemaElement & { $dynamic?: unknown })
    .$dynamic;
  if (descriptor === undefined) return { element: authored, failures: [] };
  const { $dynamic: _dynamic, ...base } = authored as UISchemaElement & {
    $dynamic: unknown;
  };
  const failures: string[] = [];
  let roots: Record<string, unknown>;
  try {
    const referenced = usedEnvironmentRoots(descriptor);
    roots = Object.create(null) as Record<string, unknown>;
    let nodes = 1;
    for (const key of environmentRoots) {
      if (!referenced.has(key)) continue;
      const value = input[key];
      if (value === undefined) continue;
      const snapshot =
        key === 'config'
          ? permittedConfigSnapshot(value as Readonly<Record<string, unknown>>)
          : validatedSnapshot(value);
      nodes += snapshot.nodes;
      if (nodes > 10_000) throw Error('environment size limit exceeded');
      roots[key] = snapshot.value;
    }
    Object.freeze(roots);
  } catch {
    return {
      element: base as UISchemaElement,
      failures: ['invalid environment'],
    };
  }
  const rules = Array.isArray(descriptor)
    ? descriptor
    : [{ overlay: descriptor }];
  let effective: Record<string, unknown> = base;
  rules.forEach((rule, ruleIndex) => {
    if (!plain(rule)) {
      failures.push(`rule ${ruleIndex}: invalid rule`);
      return;
    }
    if ('when' in rule) {
      try {
        if (
          typeof rule.when !== 'boolean' &&
          typeof rule.when !== 'function' &&
          descriptorKey(rule.when) !== 'expression'
        )
          throw Error('unsupported condition');
        const condition = leaf(rule.when, roots, input.trustedFunctions);
        if (typeof condition !== 'boolean')
          throw Error('condition must be boolean');
        if (!condition) return;
      } catch {
        failures.push(`rule ${ruleIndex}: invalid condition`);
        return;
      }
    }
    if (!plain(rule.overlay)) {
      failures.push(`rule ${ruleIndex}: invalid overlay`);
      return;
    }
    const active = new WeakSet<object>();
    const visit = (
      target: Record<string, unknown>,
      overlay: Record<string, unknown>,
      prefix: string[],
      interpretDescriptors = true,
      depth = 0,
    ): Record<string, unknown> => {
      if (depth > 32) throw Error('overlay depth limit exceeded');
      if (active.has(overlay)) throw Error('cyclic overlay');
      active.add(overlay);
      let next = target;
      try {
        for (const key of Object.keys(overlay)) {
          const path = [...prefix, key];
          // The current element's descriptor is metadata for this pass. Nested
          // elements keep their own descriptors until their dispatch boundary.
          if (forbidden.has(key) || (!prefix.length && key === '$dynamic')) {
            failures.push(
              `rule ${ruleIndex}: unsupported target ${path.join('.')}`,
            );
            continue;
          }
          try {
            const property = Object.getOwnPropertyDescriptor(overlay, key);
            if (!property || !('value' in property))
              throw Error('overlay contains a getter');
            const source = property.value;
            if (key === '$dynamic') {
              // Nested metadata belongs to a later UI-element dispatch. Never
              // interpret it using this occurrence's roots, even in object slots.
              const metadata = jsonValue(
                source,
                depth + 1,
                new WeakSet(),
                { remaining: 10_000 },
                !!input.trustedFunctions,
              );
              next = { ...next, [key]: metadata };
              continue;
            }
            const isDescriptor =
              interpretDescriptors &&
              (typeof source === 'function' || !!descriptorKey(source));
            const resolved = isDescriptor
              ? leaf(source, roots, input.trustedFunctions)
              : source;
            if (resolved === undefined) throw Error('missing target value');
            if (plain(resolved) && !isDescriptor) {
              // Authored objects are patches; descriptor results are complete values.
              assertAcyclic(resolved);
              const value = resolved;
              const merged = visit(
                plain(next[key]) ? next[key] : {},
                value as Record<string, unknown>,
                path,
                !isDescriptor && interpretDescriptors,
                depth + 1,
              );
              if (merged !== next[key]) next = { ...next, [key]: merged };
            } else {
              const value =
                Array.isArray(resolved) && interpretDescriptors && !isDescriptor
                  ? arrayValue(resolved, roots, !!input.trustedFunctions)
                  : jsonValue(resolved);
              if (!Object.is(next[key], value))
                next = { ...next, [key]: value };
            }
          } catch {
            failures.push(
              `rule ${ruleIndex}: invalid target ${path.join('.')}`,
            );
          }
        }
        return next;
      } finally {
        active.delete(overlay);
      }
    };
    effective = visit(effective, rule.overlay, []);
  });
  return { element: effective as unknown as UISchemaElement, failures };
}

/** Stabilize equivalent resolutions for a mounted authored occurrence. */
export function createDynamicUiMemo() {
  let previous: UISchemaElement | undefined;
  return (result: DynamicUiResult): DynamicUiResult => {
    if (previous && isEqual(previous, result.element))
      return { ...result, element: previous };
    const share = (old: unknown, next: unknown): unknown => {
      if (Object.is(old, next) || isEqual(old, next)) return old;
      if (Array.isArray(old) && Array.isArray(next))
        return next.map((entry, index) => share(old[index], entry));
      if (plain(old) && plain(next))
        return Object.fromEntries(
          Object.entries(next).map(([key, value]) => [
            key,
            share(old[key], value),
          ]),
        );
      return next;
    };
    previous = share(previous, result.element) as UISchemaElement;
    return { ...result, element: previous };
  };
}

/** Pure, form-owned reuse across dispatch and parent consumers. One entry per authored element. */
export function createDynamicUiCache() {
  const entries = new WeakMap<
    UISchemaElement,
    { inputs: readonly unknown[]; result: DynamicUiResult }
  >();
  return (
    element: UISchemaElement,
    inputs: readonly unknown[],
    evaluate: () => DynamicUiResult,
  ): DynamicUiResult => {
    const cached = entries.get(element);
    if (cached && sameInputs(cached.inputs, inputs)) return cached.result;
    const result = evaluate();
    entries.set(element, { inputs, result });
    return result;
  };
}
export type DynamicUiCache = ReturnType<typeof createDynamicUiCache>;

const sameInputs = (left: readonly unknown[], right: readonly unknown[]) =>
  left.length === right.length &&
  left.every((value, index) => Object.is(value, right[index]));

/** One mounted occurrence: cache evaluation by the immutable roots it actually reads. */
export function createDynamicUiResolver(shared?: DynamicUiCache) {
  const stabilize = createDynamicUiMemo();
  let previousElement: UISchemaElement | undefined;
  let previousInputs: readonly unknown[] = [];
  let previousResult: DynamicUiResult | undefined;
  return (
    element: UISchemaElement,
    input: DynamicUiEnvironment,
  ): DynamicUiResult => {
    const descriptor = (element as UISchemaElement & { $dynamic?: unknown })
      .$dynamic;
    const roots = usedEnvironmentRoots(descriptor);
    const values: DynamicUiEnvironment = {
      data: undefined,
      path: '',
      trustedFunctions: input.trustedFunctions,
    };
    const inputs: unknown[] = [
      input.trustedFunctions,
      dynamicUiExpressionsReady(),
    ];
    for (const key of environmentRoots) {
      if (!roots.has(key)) continue;
      const value = input[key];
      Object.defineProperty(values, key, {
        value,
        enumerable: true,
        configurable: true,
      });
      inputs.push(value);
    }
    if (
      previousElement === element &&
      previousResult &&
      inputs.length === previousInputs.length &&
      inputs.every((value, index) => Object.is(value, previousInputs[index]))
    )
      return previousResult;
    previousElement = element;
    previousInputs = inputs;
    previousResult = stabilize(
      shared
        ? shared(element, inputs, () => resolveDynamicUi(element, values))
        : resolveDynamicUi(element, values),
    );
    return previousResult;
  };
}

/** Nearest array entry on the dispatch path; numeric object keys are not items. */
export function dynamicItemAt(
  data: unknown,
  segments: readonly string[],
  fallback?: unknown,
): unknown {
  let current = data;
  let item: unknown = fallback;
  for (const segment of segments) {
    if (
      current === null ||
      typeof current !== 'object' ||
      !Object.prototype.hasOwnProperty.call(current, segment)
    )
      break;
    const parent = current;
    current = (current as Record<string, unknown>)[segment];
    if (Array.isArray(parent) && /^(0|[1-9][0-9]*)$/.test(segment))
      item = current;
  }
  return item;
}
