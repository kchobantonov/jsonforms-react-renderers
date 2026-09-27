import type {
  CodeKeywordDefinition,
  AnySchemaObject,
  KeywordCxt,
  Code,
  Name,
} from 'ajv';
import { _, stringify, getProperty } from 'ajv/dist/compile/codegen';
import capitalizeFn from 'lodash/capitalize';
import startCaseFn from 'lodash/startCase';

/**
 * `transform`, with more transformations than `ajv-keywords` defines.
 *
 * Ported from the Vue 2 `common` package, which is the reference for what
 * forms in this organisation already author against. `ajv-keywords`' own
 * `transform` is **not extensible** - its transformation table is a module
 * constant with no registration hook - so the only way to add `capitalize`
 * and `startCase` is to remove its keyword and register this one in its place.
 * That is what `registerAjvKeywords` does, and it is why this file exists
 * rather than a three-line plugin.
 *
 * Note that `transform` **mutates the data** as a side effect of validation,
 * which is unusual for a validator and deliberate here: the legacy forms rely
 * on it to normalise input. It runs `before: 'enum'` so a transformed value is
 * what `enum` and `toEnumCase` compare against.
 */

type TransformName =
  | 'trimStart'
  | 'trimEnd'
  | 'trimLeft'
  | 'trimRight'
  | 'trim'
  | 'toLowerCase'
  | 'toUpperCase'
  | 'toEnumCase'
  | 'capitalize'
  | 'startCase';

interface TransformConfig {
  hash: Record<string, string | undefined>;
}

type Transform = (s: string, cfg?: TransformConfig) => string;

const transform: { [key in TransformName]: Transform } = {
  trimStart: (s) => s.trimStart(),
  trimEnd: (s) => s.trimEnd(),
  trimLeft: (s) => s.trimStart(),
  trimRight: (s) => s.trimEnd(),
  trim: (s) => s.trim(),
  toLowerCase: (s) => s.toLowerCase(),
  toUpperCase: (s) => s.toUpperCase(),
  toEnumCase: (s, cfg) => cfg?.hash[configKey(s)] || s,
  capitalize: (s) => capitalizeFn(s),
  startCase: (s) => startCaseFn(s),
};

const getDef: (() => CodeKeywordDefinition) & {
  transform: typeof transform;
} = Object.assign(_getDef, { transform });

function _getDef(): CodeKeywordDefinition {
  return {
    keyword: 'transform',
    schemaType: 'array',
    before: 'enum',
    code(cxt: KeywordCxt) {
      const { gen, data, schema, parentSchema, it } = cxt;
      const { parentData, parentDataProperty } = it;
      const tNames: string[] = schema;
      if (!tNames.length) return;
      let cfg: Name | undefined;
      if (tNames.includes('toEnumCase')) {
        const config = getEnumCaseCfg(parentSchema);
        cfg = gen.scopeValue('obj', { ref: config, code: stringify(config) });
      }
      gen.if(
        _`typeof ${data} == "string" && ${parentData} !== undefined`,
        () => {
          gen.assign(data, transformExpr(tNames.slice()));
          gen.assign(_`${parentData}[${parentDataProperty}]`, data);
        }
      );

      function transformExpr(ts: string[]): Code {
        if (!ts.length) return data;
        const t = ts.pop() as string;
        if (!(t in transform))
          throw new Error(`transform: unknown transformation ${t}`);
        const func = gen.scopeValue('func', {
          ref: transform[t as TransformName],
          code: _`require("ajv-keywords/dist/definitions/transform").transform${getProperty(
            t
          )}`,
        });
        const arg = transformExpr(ts);
        return cfg && t === 'toEnumCase'
          ? _`${func}(${arg}, ${cfg})`
          : _`${func}(${arg})`;
      }
    },
    metaSchema: {
      type: 'array',
      items: { type: 'string', enum: Object.keys(transform) },
    },
  };
}

function getEnumCaseCfg(parentSchema: AnySchemaObject): TransformConfig {
  // build hash table to enum values
  const cfg: TransformConfig = { hash: {} };

  // requires `enum` in the same schema as transform
  if (!parentSchema.enum)
    throw new Error('transform: "toEnumCase" requires "enum"');
  for (const v of parentSchema.enum) {
    if (typeof v !== 'string') continue;
    const k = configKey(v);
    // requires all `enum` values have unique keys
    if (cfg.hash[k]) {
      throw new Error(
        'transform: "toEnumCase" requires all lowercased "enum" values to be unique'
      );
    }
    cfg.hash[k] = v;
  }

  return cfg;
}

function configKey(s: string): string {
  return s.toLowerCase();
}

export default getDef;
