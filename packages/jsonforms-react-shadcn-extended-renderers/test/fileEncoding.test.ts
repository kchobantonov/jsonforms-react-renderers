import { createAjv } from '@jsonforms/core';
import { expect, it } from 'vitest';
import { readFile } from '../src/renderers/FileControlRenderer';

it('preserves a complete data URI for the supplier logo and passes URI validation', async () => {
  const file = new File(['logo'], 'logo.png', { type: 'image/png' });
  const schema = {
    type: 'string',
    format: 'uri',
    contentEncoding: 'base64',
    contentMediaType: 'image/*',
  } as const;
  const value = await readFile(file, schema);
  expect(value).toBe('data:image/png;base64,bG9nbw==');
  const validate = createAjv().compile(schema);
  expect(validate(value)).toBe(true);
  expect(validate('bG9nbw==')).toBe(false);
});

it('retains the distinct filename-bearing and raw base64 encodings', async () => {
  const file = new File(['logo'], 'my logo.png', { type: 'image/png' });
  expect(await readFile(file, { type: 'string', format: 'binary' })).toBe(
    'data:image/png;filename=my%20logo.png;base64,bG9nbw=='
  );
  expect(
    await readFile(file, { type: 'string', contentEncoding: 'base64' })
  ).toBe('bG9nbw==');
  expect(await readFile(file, { type: 'string', format: 'byte' })).toBe(
    'bG9nbw=='
  );
});
