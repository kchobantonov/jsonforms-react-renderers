import { expect, it } from 'vitest';
import { fileFilterValue } from '../src/util/fileFilterValue';

const file = { type: 'string', format: 'binary' };
const value = 'data:text/plain;filename=Meeting%20notes.txt;base64,c2VjcmV0';
it('searches decoded filenames without exposing MIME types or payloads', () => {
  expect(fileFilterValue(value, file, {})).toBe('Meeting notes.txt');
  expect(fileFilterValue('data:text/plain;base64,c2VjcmV0', file, {})).toBe('');
  expect(
    fileFilterValue('c2VjcmV0', { type: 'string', format: 'byte' }, {})
  ).toBe('');
  expect(fileFilterValue(undefined, file, {})).toBe('');
});
it('searches all filenames in referenced file arrays', () => {
  const root = { definitions: { file } };
  const schema = { type: 'array', items: { $ref: '#/definitions/file' } };
  expect(
    fileFilterValue(
      [value, value.replace('Meeting%20notes', 'Receipt')],
      schema,
      root
    )
  ).toBe('Meeting notes.txt Receipt.txt');
  expect(fileFilterValue([], schema, root)).toBe('');
  expect(
    fileFilterValue('ordinary text', { type: 'string' }, {})
  ).toBeUndefined();
});
