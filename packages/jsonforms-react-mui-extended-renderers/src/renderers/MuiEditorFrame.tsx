import React from 'react';
import { EditorControlFrameProps } from '@chobantonov/jsonforms-react-extended-renderers';
import { FormControl, FormLabel, FormHelperText } from '@mui/material';
export const MuiEditorFrame = ({
  children,
  ...props
}: EditorControlFrameProps) => (
  <FormControl fullWidth error={Boolean(props.errors)}>
    <FormLabel required={props.required}>{props.label}</FormLabel>
    {children}
    <FormHelperText>{props.errors || props.description}</FormHelperText>
  </FormControl>
);
