import { RuleEffect } from '@jsonforms/core';
import { registerExamples } from '@jsonforms/examples';

const logo = new URL('../logo.svg', import.meta.url).href;
const imageView = {
  type: 'ImageView',
  options: { src: logo, alt: 'JSON Forms logo' },
  rule: {
    effect: RuleEffect.SHOW,
    condition: { scope: '#/properties/showImage', schema: { const: true } },
  },
};

export const schema = {
  type: 'object',
  properties: {
    showImage: { type: 'boolean', title: 'Show image' },
  },
};

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Label', text: 'Presentation elements' },
    { type: 'Spacer' },
    { type: 'Separator' },
    { type: 'Control', scope: '#/properties/showImage' },
    { type: 'Spacer', options: { height: 48 } },
    imageView,
  ],
};

export const data = { showImage: true };

registerExamples([
  {
    name: 'spacer',
    label: 'Spacer',
    schema: { type: 'object', properties: {} },
    data: {},
    uischema: {
      type: 'VerticalLayout',
      elements: [
        { type: 'Label', text: 'Default spacing (32 pixels)' },
        { type: 'Spacer' },
        { type: 'Separator' },
        { type: 'Label', text: 'Custom spacing (64 pixels)' },
        { type: 'Spacer', options: { height: 64 } },
        { type: 'Separator' },
        { type: 'Label', text: 'Zero spacing' },
        { type: 'Spacer', options: { height: 0 } },
        { type: 'Separator' },
      ],
    },
  },
  {
    name: 'image-view',
    label: 'ImageView',
    schema,
    data,
    uischema: {
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Label',
          text: 'Resize the preview to see the image fit its container.',
        },
        { type: 'Control', scope: '#/properties/showImage' },
        imageView,
      ],
    },
  },
  {
    name: 'separator',
    label: 'Separator',
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string', format: 'email' },
      },
    },
    data: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' },
    uischema: {
      type: 'VerticalLayout',
      elements: [
        { type: 'Label', text: 'Personal details' },
        { type: 'Control', scope: '#/properties/firstName' },
        { type: 'Control', scope: '#/properties/lastName' },
        { type: 'Separator' },
        { type: 'Label', text: 'Contact details' },
        { type: 'Control', scope: '#/properties/email' },
      ],
    },
  },
  {
    name: 'presentation',
    label: 'Spacer, ImageView and Separator',
    schema,
    uischema,
    data,
  },
]);
