/*
  The MIT License
  
  Copyright (c) 2022 STMicroelectronics and others.
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
import { registerExamples } from '../register';

export const schema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 3,
      description: 'Please enter your name',
      i18n: 'name',
    },
    vegetarian: {
      type: 'boolean',
      i18n: 'vegetarian',
    },
    birthDate: {
      type: 'string',
      format: 'date',
      i18n: 'birth',
    },
    nationality: {
      type: 'string',
      enum: ['US', 'BG', 'DE', 'JP', 'RU', 'Other'],
      i18n: 'nationality',
    },
    personalData: {
      type: 'object',
      properties: {
        age: {
          type: 'integer',
          description: 'Please enter your age.',
          i18n: 'personal-data.age',
        },
        height: {
          type: 'number',
          i18n: 'height',
        },
        drivingSkill: {
          type: 'number',
          maximum: 10,
          minimum: 1,
          default: 7,
          i18n: 'personal-data.driving',
        },
      },
      required: ['age', 'height'],
    },
    occupation: {
      type: 'string',
      i18n: 'occupation',
    },
    postalCode: {
      type: 'string',
      maxLength: 5,
      i18n: 'postal-code',
    },
  },
  required: ['occupation', 'nationality'],
};

export const uischema = {
  type: 'TemplateLayout',
  template:
    '<div>{elements.map(element => (<div key={element.name}>{children[element.name]}</div>))}</div>',
  elements: [
    {
      type: 'TemplateLayout',
      template: 'Hello {data.name}',
    },
    {
      type: 'VerticalLayout',
      elements: [
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/name',
            },
            {
              type: 'Control',
              scope: '#/properties/personalData/properties/age',
            },
            {
              type: 'Control',
              scope: '#/properties/birthDate',
            },
          ],
        },
        {
          type: 'TemplateLayout',
          template:
            '<div>Additional Information For <strong>{ data.name }</strong></div>',
        },
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/personalData/properties/height',
            },
            {
              type: 'Control',
              scope: '#/properties/nationality',
            },
            {
              type: 'Control',
              scope: '#/properties/occupation',
              options: {
                suggestion: [
                  'Accountant',
                  'Engineer',
                  'Freelancer',
                  'Journalism',
                  'Physician',
                  'Student',
                  'Teacher',
                  'Other',
                ],
              },
            },
          ],
        },
      ],
    },
    {
      type: 'TemplateLayout',
      template: 'Footer',
    },
  ],
};

export const data = {
  name: 'John Doe',
  vegetarian: false,
  birthDate: '1985-06-02',
  personalData: {
    age: 34,
    drivingSkill: 7,
  },
  postalCode: '12345',
};

registerExamples([
  {
    name: 'template-renderers',
    label: 'Template Layout Renderer',
    data,
    schema,
    uischema,
  },
]);
