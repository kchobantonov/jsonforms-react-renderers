import { UISchemaElement } from '@jsonforms/core';
import React from 'react';

/**
 * Lets a **control** renderer serve as a **cell**.
 *
 * The two registries agree on almost everything and disagree on the one thing
 * that matters, which is why this is not a plain cast:
 *
 * - `mapStateToCellProps` reads `ownProps.path` **as the path to the value**.
 * - `mapStateToControlProps` reads `composeWithUi(uischema, ownProps.path)`,
 *   which **appends** the element's scope to that path.
 *
 * `DispatchCell` hands a column both a full path (`people.0.favoriteColor`)
 * and a scoped uischema (`#/properties/favoriteColor`), because a cell
 * ignores the second. A control does not, and reads
 * `people.0.favoriteColor.favoriteColor` - which resolves to nothing. The
 * symptom is a control that renders perfectly and is simply **empty**, and an
 * edit that writes to a path no one reads. It looks like a data problem and
 * is a registry-contract problem.
 *
 * Rewriting the scope to `#` is the fix: `composeWithUi` returns `path`
 * unchanged when the scope has no data-path segments, so the control reads and
 * writes exactly the value the column is for. The schema `DispatchCell`
 * supplies is already the field's own, so `#` is the correct scope for it.
 *
 * Nothing else is adapted, and nothing needs to be: the label and the inline
 * message are dropped by `ControlFormItem` inside a `CellModeProvider`, which
 * is what makes one component able to serve both places.
 */
/*
  Constrained on `uischema` alone, not on `ControlProps`. A renderer that has
  been through `withJsonFormsControlProps` is typed by its *own* props -
  `OwnPropsOfControl` - and requiring the full `ControlProps` here would
  reject every renderer this is meant to wrap.
*/
export const asCell = <P extends { uischema?: UISchemaElement }>(
  Control: React.ComponentType<P>
): React.ComponentType<P> => {
  const Cell = (props: P) => (
    <Control {...props} uischema={{ ...props.uischema, scope: '#' } as any} />
  );
  Cell.displayName = `asCell(${
    Control.displayName ?? Control.name ?? 'Control'
  })`;
  return Cell;
};
