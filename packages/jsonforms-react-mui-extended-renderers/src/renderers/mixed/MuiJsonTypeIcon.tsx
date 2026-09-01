import { SvgIcon, SvgIconProps } from '@mui/material';
import React from 'react';
import { JsonDataType } from './mixedTypes';

export interface MuiJsonTypeIconProps extends SvgIconProps {
  type: JsonDataType | null;
}

export const MuiJsonTypeIcon = ({ type, ...props }: MuiJsonTypeIconProps) => {
  const path = (() => {
    switch (type) {
      case 'array':
        return 'M8 4H5v16h3M16 4h3v16h-3';
      case 'object':
        return 'M8 3c-1.5 0-3 1-3 3v3c0 1.5-1 2-2 2 1 0 2 .5 2 2v3c0 2 1.5 3 3 3M16 3c1.5 0 3 1 3 3v3c0 1.5 1 2 2 2-1 0-2 .5-2 2v3c0 2-1.5 3-3 3';
      case 'string':
        return 'M4 7h16M4 12h12M4 17h8';
      case 'integer':
      case 'number':
        return 'M10 3 8 21M16 3l-2 18M4 9h16M3 15h16';
      case 'boolean':
        return 'm5 12 4 4L19 6';
      case 'null':
        return 'M4.93 4.93 19.07 19.07M22 12a10 10 0 1 1-10-10 10 10 0 0 1 10 10Z';
      default:
        return 'M8 4H5v16h3M16 4h3v16h-3';
    }
  })();

  return (
    <SvgIcon data-json-type={type ?? 'unknown'} fontSize='small' {...props}>
      <path
        d={path}
        fill='none'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='2'
      />
    </SvgIcon>
  );
};
