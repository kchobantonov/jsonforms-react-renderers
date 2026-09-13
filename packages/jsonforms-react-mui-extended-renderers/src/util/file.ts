import { JsonSchema } from '@jsonforms/core';
export type FileSchema = JsonSchema & {
  contentEncoding?: string;
  contentMediaType?: string;
  formatMinimum?: number | string;
  formatMaximum?: number | string;
  formatExclusiveMinimum?: number | string;
  formatExclusiveMaximum?: number | string;
};
export const isFileSchema = (schema: JsonSchema) =>
  schema.type === 'string' &&
  ((schema as FileSchema).contentEncoding === 'base64' ||
    schema.format === 'binary' ||
    schema.format === 'byte');
const nonNegative = (value: unknown) => {
  if (typeof value !== 'number' && typeof value !== 'string') return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
};
export const fileSizeLimit = (
  schema: FileSchema,
  options: Record<string, unknown>,
  kind: 'Minimum' | 'Maximum'
) => {
  for (const source of [schema, options]) {
    for (const exclusive of [false, true]) {
      const key = `format${exclusive ? 'Exclusive' : ''}${kind}`;
      const value = nonNegative((source as Record<string, unknown>)[key]);
      if (value !== undefined) return { value, exclusive, key };
    }
  }
  return undefined;
};
export const encodeFileResult = (
  url: string,
  name: string,
  format?: string
) => {
  if (format === 'uri') return url;
  if (format === 'binary') {
    const marker = url.indexOf(';base64,');
    return marker < 0
      ? url
      : `${url.slice(0, marker)};filename=${encodeURIComponent(
          name
        )}${url.slice(marker)}`;
  }
  return url.slice(url.indexOf(',') + 1);
};
export const encodedFileName = (value: unknown) => {
  if (typeof value !== 'string') return '';
  const name = /^data:[^,]*;filename=([^;,]*)[;,]/.exec(value)?.[1];
  try {
    return name ? decodeURIComponent(name) : '';
  } catch {
    return '';
  }
};
