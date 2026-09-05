import React from 'react';

export interface WebComponentLogoProps {
  active?: boolean;
  dark?: boolean;
}

export const WebComponentLogo = ({
  active = false,
  dark = false,
}: WebComponentLogoProps) => (
  <svg
    aria-hidden='true'
    className={`renderer-demo-webcomponent-icon${active ? ' active' : ''}`}
    data-name='WebComponent Logo'
    viewBox='0 0 161 132'
    xmlns='http://www.w3.org/2000/svg'
  >
    <g fill='none' fillRule='evenodd'>
      <path fill='#890000' d='M160.6 65.9l-17.4 29.3-24.4-29.7 24.4-28.9z' />
      <path fill='#B4D44E' d='M141.3 100.2l-26.5-31.7-15.9 26.6 24.7 36.1z' />
      <path fill='#890000' d='M141 31.4l-26.2 31.8-15.9-26.6L123.6.9z' />
      <path fill='#EF562F' d='M61.1 31.4H141L123.4.9H78.7z' />
      <path fill='#EF562F' d='M114.8 63.3H159l-15.9-26.8H98.8' />
      <path fill='#B4D44E' d='M141.3 100.3H61l17.6 30.5h45z' />
      <path
        fill={dark ? '#F9FAFB' : '#111827'}
        d='M78.6 130.8L41 65.8 79.1.8H37.9L.4 65.8l37.5 65z'
      />
      <path fill='#B4D44E' d='M114.8 68.4H159l-15.9 26.8H98.8' />
    </g>
  </svg>
);
