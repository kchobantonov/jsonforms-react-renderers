/*
  The MIT License
  
  Copyright (c) 2017-2019 EclipseSource Munich
  https://github.com/eclipsesource/jsonforms
  
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:
  
  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.
  
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
*/
import { type JsonSchema } from '@jsonforms/core';
import { registerExamples } from '@jsonforms/examples';

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

registerExamples([
  {
    name: 'file',
    label: 'File',
    data,
    schema: schema as any as JsonSchema,
    uischema,
  },
]);
