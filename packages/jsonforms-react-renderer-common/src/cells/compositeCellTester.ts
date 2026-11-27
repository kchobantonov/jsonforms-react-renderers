import type { RankedTester } from '@jsonforms/core';
import { isMixedSchema } from '../mixed/mixedSchema';
export const compositeCellTester: RankedTester = (_ui, schema, context) =>
  _ui.options?.summary?.type === 'Label'
    ? 6
    : schema?.type === 'object' ||
        schema?.type === 'array' ||
        Boolean(
          schema?.anyOf?.length ||
          schema?.oneOf?.length ||
          schema?.allOf?.length,
        ) ||
        isMixedSchema({ ..._ui, scope: '#' }, schema, context)
      ? 1
      : -1;
