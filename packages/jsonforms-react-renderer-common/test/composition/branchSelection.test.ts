import { expect, it } from 'vite-plus/test';
import { isUnselectedBranchValue } from '../../src/composition/combinators';

it.each([
  [undefined, 0, true],
  [{}, undefined, true],
  [{}, null, true],
  [{}, -1, true],
  [{}, 0, false],
  [{ kind: 'post' }, -1, false],
  [null, -1, false],
  [[], -1, false],
  ['', -1, false],
  [0, -1, false],
  [false, -1, false],
])(
  'distinguishes cleared branch values from invalid existing values %#',
  (data, fittingIndex, expected) => {
    expect(isUnselectedBranchValue(data, fittingIndex as number)).toBe(
      expected,
    );
  },
);
