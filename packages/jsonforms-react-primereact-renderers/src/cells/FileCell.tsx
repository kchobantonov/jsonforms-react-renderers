import { withJsonFormsCellProps, withTranslateProps } from '@jsonforms/react';
import { PrimeFile } from '../prime-controls/PrimeFile';

export const FileCell = withJsonFormsCellProps(withTranslateProps(PrimeFile));
