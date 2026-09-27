import React, { ComponentType } from 'react';
import Ajv from 'ajv';
import { getAjv, isVisible, UISchemaElement } from '@jsonforms/core';
import { useJsonForms } from '@jsonforms/react';

/**
 * Children that take part in layout.
 *
 * "Only effective visible UI-schema children participate. Hidden children
 * leave layout." The count matters as well as the rendering: a hidden child
 * must not consume a share or contribute a gap, which is what the previous
 * `24 / elements.length` did.
 */
export const useEffectiveElements = (
  elements: UISchemaElement[],
  path: string,
  config?: unknown
): UISchemaElement[] => {
  const ctx = useJsonForms();
  const data = ctx.core?.data;
  const ajv = ctx.core?.ajv;
  return (elements ?? []).filter((element) => {
    if (!element) return false;
    try {
      return ajv ? isVisible(element, data, path, ajv, config) : true;
    } catch {
      // A malformed rule is the author's problem, not a reason to drop a child.
      return true;
    }
  });
};

export interface AjvProps {
  ajv: Ajv;
}

// TODO fix @typescript-eslint/ban-types
// eslint-disable-next-line @typescript-eslint/ban-types
export const withAjvProps = <P extends {}>(
  Component: ComponentType<AjvProps & P>
) =>
  function WithAjvProps(props: P) {
    const ctx = useJsonForms();
    const ajv = getAjv({ jsonforms: { ...ctx } });

    return <Component {...props} ajv={ajv} />;
  };
