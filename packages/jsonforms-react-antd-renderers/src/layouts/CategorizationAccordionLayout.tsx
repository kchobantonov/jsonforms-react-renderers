import React, { useEffect, useId, useMemo, useRef } from 'react';
import { Collapse } from 'antd';
import {
  and,
  Categorization,
  categorizationHasCategory,
  Category,
  deriveLabelForUISchemaElement,
  optionIs,
  RankedTester,
  rankWith,
  StatePropsOfLayout,
  uiTypeIs,
} from '@jsonforms/core';
import {
  TranslateProps,
  withJsonFormsLayoutProps,
  withTranslateProps,
} from '@jsonforms/react';
import { CategoryIndicators } from './CategoryHeader';
import { categoryKey, useCategorySelection } from '../util/categoryState';
import {
  AjvProps,
  AntdLayoutRenderer,
  AntdLayoutRendererProps,
  withAjvProps,
} from '../util/layout';

/**
 * Rank 3, above the stepper at 2 and the generic tabs renderer at 1, because
 * the specification requires this explicit match to "take precedence over the
 * generic Categorization renderer". Before this existed, `variant: "accordion"`
 * fell through to tabs and the request was silently ignored.
 *
 * No schema type requirement, no scope, no array binding: categories are
 * structural UI sections and may hold unbound content or be used with an empty
 * data object.
 */
export const categorizationAccordionTester: RankedTester = rankWith(
  3,
  and(
    uiTypeIs('Categorization'),
    categorizationHasCategory,
    optionIs('variant', 'accordion')
  )
);

export interface CategorizationAccordionLayoutRendererProps
  extends StatePropsOfLayout,
    AjvProps,
    TranslateProps {
  data?: unknown;
}

export const CategorizationAccordionLayoutRenderer = (
  props: CategorizationAccordionLayoutRendererProps
) => {
  const {
    data,
    path,
    renderers,
    cells,
    schema,
    uischema,
    visible,
    enabled,
    ajv,
    config,
    t,
  } = props;
  const categorization = uischema as Categorization;
  const { categories, active, select, close } = useCategorySelection(
    categorization,
    data,
    ajv,
    config,
    undefined,
    // Closable: an accordion here may be closed entirely. This is the one
    // place the project differs from section 8; see Adjustment 10.2.
    true
  );

  const labels = useMemo(
    () =>
      categories.map((category) => deriveLabelForUISchemaElement(category, t)),
    [categories, t]
  );

  /*
    The panel relationship section 8 asks for ("accessible accordion headings
    and controls with expanded-state and panel relationships").

    rc-collapse supplies `role="button"` and `aria-expanded` but never
    `aria-controls`, and gives the panel no role or label at all, so a screen
    reader is told a header can be expanded without being told what it expands.
    There is no prop for it - extra item props land on the item wrapper, not on
    the header - so the two are tied together here, after render. The selectors
    are antd's stable panel structure, and `accordionAccessibility` in the tests
    fails loudly if that changes.
  */
  const rootRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  useEffect(() => {
    const items = rootRef.current?.querySelectorAll<HTMLElement>(
      ':scope > .ant-collapse > .ant-collapse-item'
    );
    items?.forEach((item, index) => {
      const header = item.querySelector<HTMLElement>(
        ':scope > .ant-collapse-header'
      );
      // `-panel` in antd 6, `-content` in 5. Accepting both means a version
      // bump degrades to "no relationship" rather than to a crash, and the
      // accessibility test says which one is actually in use.
      const panel = item.querySelector<HTMLElement>(
        ':scope > .ant-collapse-panel, :scope > .ant-collapse-content'
      );
      if (!header || !panel) {
        return;
      }
      const headerId = `${baseId}-header-${index}`;
      const panelId = `${baseId}-panel-${index}`;
      header.id = headerId;
      header.setAttribute('aria-controls', panelId);
      panel.id = panelId;
      panel.setAttribute('role', 'region');
      panel.setAttribute('aria-labelledby', headerId);
    });
  });

  if (!visible) {
    return null;
  }

  const childProps = (category: Category): AntdLayoutRendererProps => ({
    elements: category.elements,
    schema,
    path,
    direction: 'column',
    enabled,
    visible,
    renderers,
    cells,
  });

  return (
    <div ref={rootRef}>
      <Collapse
        /*
        Deliberately *not* antd's `accordion` prop.

        Its at-most-one-open behaviour is now what we want, but the prop also
        switches the whole control to a tabs pattern - `role="tablist"` on the
        root, `role="tab"` on each header, `role="tabpanel"` on each panel -
        and then does not implement one: a `tab` reports `aria-expanded` where
        the pattern calls for `aria-selected`, the panel gets no accessible
        name, and only Enter is handled, with none of the arrow-key navigation
        a `tablist` promises. A tablist also cannot express "no tab selected",
        which is a legal state here. Without the prop the same component is a
        disclosure - `role="button"` plus `aria-expanded` - which is what
        rc-collapse actually implements and what an all-closed accordion needs.

        Exclusivity is enforced here instead: `activeKey` never holds more than
        one key.
      */
        activeKey={active >= 0 ? [String(active)] : []}
        onChange={(keys) => {
          // Without `accordion`, opening a panel *adds* its key, so the newly
          // opened one is whichever key was not already active. Clicking the
          // open header removes its key and leaves none, which closes the
          // accordion - see Adjustment 10.2.
          const opened = (Array.isArray(keys) ? keys : [keys]).filter(
            (key) => String(key) !== String(active)
          );
          if (opened.length > 0) {
            select(Number(opened[0]));
          } else {
            close();
          }
        }}
        items={categories.map((category, index) => ({
          // Identity, not position, so a reorder keeps a panel's expansion and
          // its content together rather than reusing the slot's DOM.
          key: String(index),
          'data-category-key': categoryKey(category, index),
          label: labels[index],
          /*
            The indicators go in `extra` - the end of the header bar - not
            after the label. An accordion header is the same shape as a
            collapsible Group's, so putting its status somewhere else would
            mean two collapsible sections in one form marking themselves
            differently. A tab or a step has no trailing edge to use, which is
            why those keep the markers beside the words; see `CategoryHeader`.
          */
          extra: (
            <CategoryIndicators
              category={category}
              path={path}
              config={config}
            />
          ),
          /*
          Panels stay mounted. "Closing a category preserves its data and
          validation" - and an unmounted subtree would take its controls'
          pending debounced writes with it.
        */
          forceRender: true,
          children: <AntdLayoutRenderer {...childProps(category)} />,
        }))}
      />
    </div>
  );
};

export default withAjvProps(
  withTranslateProps(
    withJsonFormsLayoutProps(CategorizationAccordionLayoutRenderer)
  )
);
