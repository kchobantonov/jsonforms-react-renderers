import { CombinatorBranch } from '@chobantonov/jsonforms-react-renderer-common/CombinatorBranch';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  CombinatorRendererProps,
  createCombinatorRenderInfos,
  isAnyOfControl,
  JsonSchema,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { JsonFormsDispatch, withJsonFormsAnyOfProps } from '@jsonforms/react';
import { Tabs } from 'antd';
import CombinatorProperties from './CombinatorProperties';

/**
 * `anyOf` - tabs over one value.
 *
 * Section 18: "Tabs selecting the branch form to display over the same bound
 * value… Tab navigation alone preserves data; one or more branches may
 * validate. These are editor views, not checkboxes enabling schema branches."
 * And of the worked example: "Switching tabs does not delete email or phone.
 * A value containing both can satisfy anyOf; the active tab is presentation
 * state only."
 *
 * So changing tab writes nothing at all - no generated defaults, and
 * therefore nothing to confirm.
 *
 * That holds even for a branch whose type the current value is not, such as
 * an object branch over a string. It looks as though those inputs would have
 * nowhere to write, but JSON Forms' `update` builds the containers along the
 * path: a child write of `note` against a string value yields
 * `{ "note": "…" }`, replacing the string. The branch becomes real when the
 * user edits it, which is the moment they actually chose it - not when they
 * looked at it.
 *
 * `oneOf` is the opposite case and must write on selection: its branches
 * carry generated defaults, typically a `const` discriminator, that no amount
 * of typing in the visible fields would produce.
 */
export const AnyOfRenderer = ({
  schema,
  rootSchema,
  indexOfFittingSchema,
  visible,
  enabled,
  path,
  renderers,
  cells,
  uischema,
  uischemas,
}: CombinatorRendererProps) => {
  const [selectedAnyOf, setSelectedAnyOf] = useState(
    indexOfFittingSchema ?? -1
  );

  /*
    Which tab opens is derived from the data only until the user picks one.
    Afterwards the choice is theirs: re-deriving it moved the tab out from
    under them as soon as their editing changed which branch fits - emptying
    the value while on a chosen tab left no tab selected and the panel blank,
    mid-edit. Section 22 counts the selected tab as runtime state.
  */
  const chosen = useRef(false);
  useEffect(() => {
    if (!chosen.current) {
      setSelectedAnyOf(indexOfFittingSchema ?? -1);
    }
  }, [indexOfFittingSchema]);

  const handleTabChange = useCallback((value: string) => {
    chosen.current = true;
    setSelectedAnyOf(parseInt(value, 10));
  }, []);

  const anyOf = 'anyOf';
  const anyOfRenderInfos = createCombinatorRenderInfos(
    (schema as JsonSchema).anyOf,
    rootSchema,
    anyOf,
    uischema,
    path,
    uischemas
  );

  if (!visible) {
    return null;
  }

  if (anyOfRenderInfos.length === 1) {
    const branch = anyOfRenderInfos[0];
    return (
      <>
        <CombinatorProperties
          schema={schema}
          combinatorKeyword={'anyOf'}
          path={path}
          rootSchema={rootSchema}
        />
        <CombinatorBranch
          options={uischema.options}
          schema={branch.schema}
          path={path}
        >
          <JsonFormsDispatch
            schema={branch.schema}
            uischema={branch.uischema}
            path={path}
            renderers={renderers}
            cells={cells}
            enabled={enabled}
          />
        </CombinatorBranch>
      </>
    );
  }

  return (
    <>
      <CombinatorProperties
        schema={schema}
        combinatorKeyword={anyOf}
        path={path}
        rootSchema={rootSchema}
      />
      <Tabs
        activeKey={selectedAnyOf >= 0 ? selectedAnyOf.toString() : ''}
        onChange={handleTabChange}
        items={anyOfRenderInfos.map(
          (anyOfRenderInfo, anyOfIndex) =>
            ({
              label: anyOfRenderInfo.label,
              key: String(anyOfIndex),
              children: selectedAnyOf === anyOfIndex && (
                <CombinatorBranch
                  options={uischema.options}
                  schema={anyOfRenderInfo.schema}
                  path={path}
                >
                  <JsonFormsDispatch
                    schema={anyOfRenderInfo.schema}
                    uischema={anyOfRenderInfo.uischema}
                    path={path}
                    renderers={renderers}
                    cells={cells}
                  />
                </CombinatorBranch>
              ),
            } as any)
        )}
      ></Tabs>
    </>
  );
};

export const anyOfControlTester: RankedTester = rankWith(3, isAnyOfControl);

export default withJsonFormsAnyOfProps(AnyOfRenderer);
