# JSON Forms - More Forms. Less Code

_Complex forms in the blink of an eye_

JSON Forms eliminates the tedious task of writing fully-featured forms by hand by leveraging the capabilities of JSON, JSON Schema and Javascript.

## PrimeReact Renderers Package

This is the JSON Forms PrimeReact Renderers Package. This package only contains renderers and must be combined with [JSON Forms React](https://github.com/eclipsesource/jsonforms/blob/master/packages/react).

See the official [documentation](https://jsonforms.io/docs/integrations/react/) and the JSON Forms React [seed repository](https://github.com/eclipsesource/jsonforms-react-seed) for examples on how to integrate JSON Forms with your application.

You can combine [JSON Forms React](https://github.com/eclipsesource/jsonforms/blob/master/packages/react) with other renderers too, for example with the [Vanilla Renderers](https://github.com/eclipsesource/jsonforms/tree/master/packages/vanilla).

Check <https://www.npmjs.com/search?q=%40jsonforms> for all published JSONForms packages.

### Quick start

Install JSON Forms Core, React and React PrimeReact Renderers

```bash
npm i --save @jsonforms/core @jsonforms/react @chobantonov/jsonforms-react-primereact-renderers
```

Use the `JsonForms` component for each form you want to render and hand over the renderer set.

```ts
import React, { useState } from 'react';
import {
  primereactRenderers,
  primereactCells,
} from '@chobantonov/jsonforms-react-primereact-renderers';
import { JsonForms } from '@jsonforms/react';

const schema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 1,
    },
    done: {
      type: 'boolean',
    },
    due_date: {
      type: 'string',
      format: 'date',
    },
    recurrence: {
      type: 'string',
      enum: ['Never', 'Daily', 'Weekly', 'Monthly'],
    },
  },
  required: ['name', 'due_date'],
};

const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      label: false,
      scope: '#/properties/done',
    },
    {
      type: 'Control',
      scope: '#/properties/name',
    },
    {
      type: 'HorizontalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/due_date',
        },
        {
          type: 'Control',
          scope: '#/properties/recurrence',
        },
      ],
    },
  ],
};

const initialData = {};

function App() {
  const [data, setData] = useState(initialData);
  return (
    <JsonForms
      schema={schema}
      uischema={uischema}
      data={data}
      renderers={primereactRenderers}
      cells={primereactCells}
      onChange={({ data, _errors }) => setData(data)}
    />
  );
}
```

## License

The JSON Forms project is licensed under the MIT License. See the [LICENSE file](./LICENSE) for more information.