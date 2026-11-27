import React from 'react';
import type { ControlProps } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { ScalarCompositionControl } from '@chobantonov/jsonforms-react-renderer-common/composition/ScalarCompositionControl';
export { scalarCompositionTester } from '@chobantonov/jsonforms-react-renderer-common/composition/useScalarComposition';
const MESSAGE_STYLE: React.CSSProperties = { marginTop: -16, marginBottom: 16 };

export default withJsonFormsControlProps((props: ControlProps) => (
  <ScalarCompositionControl
    {...props}
    errorClassName='ant-form-item-explain ant-form-item-explain-error'
    errorStyle={MESSAGE_STYLE}
  />
));
