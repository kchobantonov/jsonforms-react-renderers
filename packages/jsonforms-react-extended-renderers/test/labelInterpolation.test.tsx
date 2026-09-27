import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { JsonForms } from '@jsonforms/react';
import { MarkupLabelRenderer, markupLabelTester } from '../src';

afterEach(() => {
  document.body.innerHTML = '';
});

const schema: any = {
  type: 'object',
  properties: { firstName: { type: 'string' }, seats: { type: 'integer' } },
};
const data = { firstName: 'Ana', seats: 3 };

const draw = async (uischema: any, config: any = {}) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <JsonForms
        data={data}
        schema={schema}
        uischema={uischema}
        config={config}
        renderers={[
          { tester: markupLabelTester, renderer: MarkupLabelRenderer },
        ]}
        cells={[]}
        onChange={() => undefined}
      />
    )
  );
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 60));
  });
  return {
    container,
    text: () => container.textContent ?? '',
    html: () => container.innerHTML,
    diagnostic: () =>
      container
        .querySelector('[data-markup-diagnostic]')
        ?.getAttribute('data-markup-diagnostic'),
    unmount: () => act(() => root.unmount()),
  };
};

/** Dynamic resolution is gated, so most of these need it open. */
const dynamicOn = {
  jsonformsExtended: { dynamicValues: { enabled: true } },
};

describe('interpolating a label', () => {
  it('substitutes a static textParam without the gate', async () => {
    const view = await draw({
      type: 'Label',
      text: 'Welcome, {firstName}!',
      options: { interpolate: true, textParams: { firstName: 'there' } },
    });
    await vi.waitFor(
      async () => {
        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
        });
        expect(view.text()).toContain('Welcome, there!');
      },
      { timeout: 5000 }
    );
    view.unmount();
  });

  it('reads the form data through a declared parameter', async () => {
    const view = await draw(
      {
        type: 'Label',
        text: 'Welcome, {name}!',
        options: {
          interpolate: true,
          textParams: { name: '{data.firstName}' },
        },
      },
      dynamicOn
    );
    expect(view.text()).toContain('Welcome, Ana!');
    view.unmount();
  });

  /*
    The point of the two-level design: the TEXT is what gets translated, so it
    may name only declared parameters. A data path there resolves to nothing
    however open the gate is - which is what keeps a catalog independent of
    the schema.
  */
  it('refuses a data path written directly in the text', async () => {
    const view = await draw(
      {
        type: 'Label',
        text: 'Welcome, {data.firstName}!',
        options: { interpolate: true },
      },
      dynamicOn
    );
    expect(view.text()).toContain('Welcome, !');
    expect(view.text()).not.toContain('Ana');
    expect(view.diagnostic()).toBe('interpolationFailed');
    view.unmount();
  });

  /* Section 12's gate defaults closed - unlike the Markdown one. */
  it('refuses the data namespace while the gate is shut, and says so', async () => {
    const view = await draw({
      type: 'Label',
      text: 'Welcome, {name}!',
      options: {
        interpolate: true,
        textParams: { name: '{data.firstName}' },
      },
    });
    expect(view.diagnostic()).toBe('interpolationFailed');
    // The words survive; only the parameter is missing.
    expect(view.text()).toContain('Welcome, ');
    expect(view.text()).not.toContain('Ana');
    view.unmount();
  });

  /* CEL is an expression language: a plural is a ternary, not a formatter. */
  it('evaluates an expression, not just a path', async () => {
    const view = await draw(
      {
        type: 'Label',
        text: '{seats} {seats == 1 ? "seat" : "seats"} held',
        options: {
          interpolate: true,
          textParams: { seats: '{data.seats}' },
        },
      },
      dynamicOn
    );
    expect(view.text()).toContain('3 seats held');
    view.unmount();
  });

  /* Section 11.4's grammar, unchanged: `{{` is a literal brace. */
  it('treats a doubled brace as a literal, not a binding', async () => {
    const view = await draw(
      {
        type: 'Label',
        text: '{{name}} stays literal',
        options: {
          interpolate: true,
          textParams: { name: '{data.firstName}' },
        },
      },
      dynamicOn
    );
    expect(view.text()).toContain('{name} stays literal');
    expect(view.text()).not.toContain('Ana');
    view.unmount();
  });

  it('combines interpolation with Markdown', async () => {
    const view = await draw(
      {
        type: 'Label',
        text: '**Welcome**, {name}.',
        options: {
          interpolate: true,
          markup: 'markdown',
          textParams: { name: '{data.firstName}' },
        },
      },
      dynamicOn
    );
    await vi.waitFor(
      async () => {
        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
        });
        expect(view.html()).toContain('<strong>Welcome</strong>');
      },
      { timeout: 5000 }
    );
    expect(view.text()).toContain('Ana');
    view.unmount();
  });

  /*
    The security property, end to end rather than at the unit level: a value
    carrying Markdown must not become Markdown.
  */
  it('does not let a data value inject markup', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() =>
      root.render(
        <JsonForms
          data={{ firstName: '[click](javascript:alert(1))', seats: 1 }}
          schema={schema}
          uischema={
            {
              type: 'Label',
              text: 'Hi {name}',
              options: {
                interpolate: true,
                markup: 'markdown',
                textParams: { name: '{data.firstName}' },
              },
            } as any
          }
          config={dynamicOn}
          renderers={[
            { tester: markupLabelTester, renderer: MarkupLabelRenderer },
          ]}
          cells={[]}
          onChange={() => undefined}
        />
      )
    );
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 60));
    });
    expect(container.querySelector('a')).toBeNull();
    expect(container.textContent).toContain('[click]');
    act(() => root.unmount());
  });

  /*
    A field nobody has filled in is the normal state of a form, not a fault.
    It renders as nothing and says nothing - otherwise a fresh form carries a
    developer-facing message beside half its labels.
  */
  it('renders absent data as nothing, without a diagnostic', async () => {
    const view = await draw(
      {
        type: 'Label',
        text: 'Value: {maybe}',
        options: {
          interpolate: true,
          textParams: { maybe: '{data.neverFilledIn}' },
        },
      },
      dynamicOn
    );
    expect(view.text()).toContain('Value: ');
    expect(view.diagnostic()).toBeUndefined();
    view.unmount();
  });

  /* An authoring error is wrong however the form is filled in, so it is said. */
  it('reports an authoring error beside the text rather than throwing', async () => {
    const view = await draw(
      {
        type: 'Label',
        text: 'Value: {frobnicate(1)}',
        options: { interpolate: true },
      },
      dynamicOn
    );
    expect(view.diagnostic()).toBe('interpolationFailed');
    expect(view.text()).toContain('Value: ');
    view.unmount();
  });

  /*
    A data value is often a key rather than a word: `plan` is "Team" in every
    language. `translate` is registered into the evaluator - it cannot be
    passed in through `context`, which is what stops a host widening the
    sandbox by accident.
  */
  it('looks a key up through the form translator', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() =>
      root.render(
        <JsonForms
          data={{ firstName: 'Ana', seats: 3, plan: 'Team' }}
          schema={{
            ...schema,
            properties: { ...schema.properties, plan: { type: 'string' } },
          }}
          uischema={
            {
              type: 'Label',
              text: 'Plan: {translate("plan." + tier)}',
              options: {
                interpolate: true,
                textParams: { tier: '{data.plan}' },
              },
            } as any
          }
          config={dynamicOn}
          i18n={{
            locale: 'bg',
            translate: ((key: string, dflt?: string) =>
              key === 'plan.Team' ? 'Екип' : dflt) as any,
          }}
          renderers={[
            { tester: markupLabelTester, renderer: MarkupLabelRenderer },
          ]}
          cells={[]}
          onChange={() => undefined}
        />
      )
    );
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 60));
    });
    expect(container.textContent).toContain('Plan: Екип');
    act(() => root.unmount());
  });

  it('leaves a label that asks for neither alone', async () => {
    // The tester must not claim it, or the base renderer never sees it.
    expect(
      markupLabelTester(
        { type: 'Label', text: 'plain' } as any,
        schema,
        {} as any
      )
    ).toBe(-1);
  });
});
