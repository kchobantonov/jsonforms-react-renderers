import { EnzymePropSelector, mount, ReactWrapper } from 'enzyme';
import {
  arrayDefaultTranslations,
  ArrayTranslationEnum,
  ControlElement,
  JsonSchema,
} from '@jsonforms/core';
import { JsonForms } from '@jsonforms/react';
import { antdRenderers } from '../../src';
import { Tooltip } from '@mui/material';
import * as React from 'react';

export const checkTooltip = (
  schema: JsonSchema,
  uiSchema: ControlElement,
  wrapper: ReactWrapper<any, any>,
  findTooltipWrapper: (
    wrapper: ReactWrapper<any, any>
  ) => ReactWrapper<any, any>,
  tooltipEnum: ArrayTranslationEnum,
  tooltipFilter: EnzymePropSelector | string,
  data?: any
): ReactWrapper<any, any> => {
  wrapper = mount(
    <JsonForms
      data={data}
      schema={schema}
      uischema={uiSchema}
      renderers={antdRenderers}
    />
  );

  expect(
    findTooltipWrapper(wrapper).find(Tooltip).filter(tooltipFilter).props()[
      'title'
    ]
  ).toBe(
    arrayDefaultTranslations.find((ar) => ar.key == tooltipEnum).default()
  );
  return wrapper;
};

export const checkTooltipTranslation = (
  schema: JsonSchema,
  uiSchema: ControlElement,
  wrapper: ReactWrapper<any, any>,
  findTooltipWrapper: (
    wrapper: ReactWrapper<any, any>
  ) => ReactWrapper<any, any>,
  tooltipFilter: EnzymePropSelector | string,
  data?: any
): ReactWrapper<any, any> => {
  const translate = () => 'Translated';
  wrapper = mount(
    <JsonForms
      data={data}
      schema={schema}
      uischema={uiSchema}
      renderers={antdRenderers}
      i18n={{ locale: 'en', translate: translate }}
    />
  );

  expect(
    findTooltipWrapper(wrapper).find(Tooltip).filter(tooltipFilter).props()[
      'title'
    ]
  ).toBe('Translated');
  return wrapper;
};
