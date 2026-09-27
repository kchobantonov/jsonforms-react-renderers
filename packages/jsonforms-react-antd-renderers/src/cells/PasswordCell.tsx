import { CellProps, RankedTester, WithClassname } from '@jsonforms/core';
import { withJsonFormsCellProps } from '@jsonforms/react';
import React from 'react';
import { AntdPassword } from '../antd-controls/AntdPassword';
import { passwordControlTester } from '../controls/PasswordControl';

/**
 * Masking has to survive delegation to a cell.
 *
 * The shared table-cell contract requires that "password masking, multiline
 * input, radio choices, switches, sliders, masks, and temporal controls must
 * not lose their meaning merely because the editor appears in a table" -
 * without this, a password column fell through to the plain text cell and
 * showed the value to anyone looking at the screen.
 */
export const PasswordCell = (props: CellProps & WithClassname) => (
  <AntdPassword {...props} />
);

export const passwordCellTester: RankedTester = passwordControlTester;

export default withJsonFormsCellProps(PasswordCell);
