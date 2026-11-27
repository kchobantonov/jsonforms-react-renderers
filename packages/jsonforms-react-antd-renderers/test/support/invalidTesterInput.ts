import type { RankedTester } from '@jsonforms/core';

/** Exercise the runtime guard with inputs outside the JSON Forms contract. */
export function testInvalidInput(tester: RankedTester, uischema: unknown) {
  // @ts-expect-error These cases intentionally omit the schema and tester context.
  return tester(uischema, undefined, undefined);
}
