import { discriminatorBranch } from '../src/discriminatorBranch';
import schema from '@chobantonov/jsonforms-extended-spec/examples/recursive-tree/schema.json';

it('recognizes a recursive folder even when a descendant is invalid', () => {
  expect(
    discriminatorBranch(schema.definitions.node, schema, 'oneOf', {
      kind: 'folder',
      children: [{ kind: 'file', name: '' }],
    })
  ).toBe(1);
  expect(
    discriminatorBranch(schema.definitions.node, schema, 'oneOf', {
      kind: 'file',
    })
  ).toBe(0);
});
it('does not infer ambiguous or optional discriminator values', () => {
  const branch = {
    type: 'object' as const,
    properties: { kind: { const: 'x' } },
  };
  expect(
    discriminatorBranch({ oneOf: [branch, branch] }, {}, 'oneOf', { kind: 'x' })
  ).toBeUndefined();
  expect(
    discriminatorBranch(schema.definitions.node, schema, 'oneOf', {
      kind: 'unknown',
    })
  ).toBeUndefined();
});
