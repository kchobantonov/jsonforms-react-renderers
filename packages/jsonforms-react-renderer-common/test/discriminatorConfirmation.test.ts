import { expect, it } from 'vitest';
import { discardedByBranchChange } from '../src/combinators';
import { confirmationRequired } from '../src/confirmation';
const schema = {
  oneOf: [
    { properties: { kind: { const: 'email' } } },
    { properties: { kind: { const: 'postal' } } },
  ],
};
it('does not prompt for discriminator-only complex changes', () => {
  expect(
    confirmationRequired('complex', [
      discardedByBranchChange({ kind: 'email' }, schema, true),
    ])
  ).toBe(false);
});
it('still prompts for details, invalid discriminator data, and always policy', () => {
  expect(
    confirmationRequired('complex', [
      discardedByBranchChange({ kind: 'email', address: 'a' }, schema, true),
    ])
  ).toBe(true);
  expect(
    confirmationRequired('complex', [
      discardedByBranchChange({ kind: 'unknown' }, schema, true),
    ])
  ).toBe(true);
  expect(
    confirmationRequired('always', [
      discardedByBranchChange({ kind: 'email' }, schema),
    ])
  ).toBe(true);
});
