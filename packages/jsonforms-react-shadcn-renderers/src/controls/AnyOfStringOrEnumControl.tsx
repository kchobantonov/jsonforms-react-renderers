import React from 'react';
import {
  ControlProps,
  JsonSchema,
  and,
  rankWith,
  schemaMatches,
  uiTypeIs,
} from '@jsonforms/core';
import { ShadcnInputControl } from './InputControl';

export const anyOfStringOrEnumControlTester = rankWith(
  5,
  and(
    uiTypeIs('Control'),
    schemaMatches((schema) => {
      const branches = schema.anyOf as JsonSchema[] | undefined;
      return (
        Array.isArray(branches) &&
        branches.every(
          (branch) =>
            (!branch.type || branch.type === 'string') &&
            (!branch.enum ||
              branch.enum.every((value) => typeof value === 'string'))
        ) &&
        branches.some((branch) => branch.type === 'string' && !branch.enum) &&
        branches.some((branch) => Array.isArray(branch.enum))
      );
    })
  )
);

export const ShadcnAnyOfStringOrEnumControl = (props: ControlProps) => (
  <ShadcnInputControl
    {...props}
    suggestions={Array.from(
      new Set(
        (props.schema.anyOf ?? [])
          .flatMap((branch) => branch.enum ?? [])
          .filter((value): value is string => typeof value === 'string')
      )
    )}
  />
);
