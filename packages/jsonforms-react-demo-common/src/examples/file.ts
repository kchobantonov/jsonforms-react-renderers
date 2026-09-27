import { type JsonSchema } from '@jsonforms/core';
import { registerProjectExamples } from './registry';

export const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    imageDataUri: {
      type: 'string',
      format: 'uri',
      contentEncoding: 'base64',
      contentMediaType: 'image/*',
      description: 'Image with maximum size of 1MB encoded as data URI',
    },
    fileDataUriWithFileName: {
      type: 'string',
      format: 'binary',
      formatMaximum: '1048576',
      description:
        'File with maximum size of 1MB encoded as data URI and including the file name',
    },
    base64String: {
      type: 'string',
      contentEncoding: 'base64',
      description: 'File with maximum size of 1MB encoded as base64',
    },
  },
};

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/imageDataUri',
      options: {
        showUnfocusedDescription: true,
        formatMaximum: '1048576',
      },
    },
    {
      type: 'Control',
      scope: '#/properties/fileDataUriWithFileName',
      options: {
        showUnfocusedDescription: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/base64String',
      options: {
        showUnfocusedDescription: true,
        formatMaximum: 1048576,
      },
    },
  ],
};

export const data: any = {};

registerProjectExamples([
  {
    name: 'file',
    label: 'File',
    data,
    schema: schema as any as JsonSchema,
    uischema,
  },
]);
