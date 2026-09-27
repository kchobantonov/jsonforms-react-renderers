import React, { useMemo } from 'react';
import { EnumCellProps, WithClassname } from '@jsonforms/core';

import { Select } from 'antd';
import merge from 'lodash/merge';
import { useI18nDefault } from '../util';
import { TranslateProps } from '@jsonforms/react';

export const AntdSelect = (
  props: EnumCellProps &
    WithClassname &
    TranslateProps & { inputProps?: React.ComponentProps<typeof Select> }
) => {
  const {
    data,
    className,
    id,
    enabled,
    schema,
    uischema,
    path,
    handleChange,
    options,
    config,
    inputProps,
    t,
  } = props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  /*
    The default message carries the locale bundle (§6.5), so it must not be
    read straight out of the English table.
  */
  const d = useI18nDefault();
  const noneOptionLabel = useMemo(
    () => t('enum.none', d('enum.none'), { schema, uischema, path }),
    [t, d, schema, uischema, path]
  );

  const selectStyle = { width: '100%' };

  /*
    `options.autocomplete` is the portable encoding for searchable finite
    choices. **This family defaults to off**, which the specification permits -
    "preserves the renderer family's documented default. No universal default
    is imposed" - and which differs from Material, where searching is the
    default. See Adjustment 16.

    Only `true` turns it on, so `false` and absence behave alike; the
    distinction matters only against a global config that switched it on.
  */
  const searchable = appliedUiSchemaOptions.autocomplete === true;

  return (
    <Select
      className={className}
      id={id}
      disabled={!enabled}
      autoFocus={appliedUiSchemaOptions.focus}
      value={data}
      onChange={(value) => handleChange(path, value)}
      style={selectStyle}
      placeholder={appliedUiSchemaOptions.placeholder ?? noneOptionLabel}
      allowClear={enabled}
      /*
        The specification requires a searchable renderer to say how the query
        filters: here, a case-insensitive substring of the **label** - what the
        reader can actually see, which for a constant-based `oneOf` is the
        branch title rather than the stored constant. Matching the value would
        mean searching for `eng` to find "Engineering".

        Configured through the `showSearch` object; antd 6 deprecated the flat
        `optionFilterProp` / `filterOption` props in favour of it.
      */
      showSearch={
        searchable
          ? {
              optionFilterProp: 'label',
              filterOption: (input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase()),
            }
          : false
      }
      notFoundContent={
        searchable
          ? t('enum.noMatches', d('enum.noMatches'), {
              schema,
              uischema,
              path,
            })
          : undefined
      }
      // `options` rather than `<Select.Option>` children: the component form is
      // deprecated in antd 6, and it also keyed each entry by its value, which
      // collides when two choices share one.
      options={options.map(({ value, label }) => ({ value, label }))}
      {...inputProps}
    />
  );
};
