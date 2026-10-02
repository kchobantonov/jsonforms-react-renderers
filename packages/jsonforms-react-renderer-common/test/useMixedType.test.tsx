import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it } from 'vitest';
import { useMixedType } from '../src/useMixedType';

it('keeps explicit numeric intent across values, resetting after a non-number', () => {
  const element = document.createElement('div');
  const root = createRoot(element);
  const Harness = ({ value }: { value: unknown }) => {
    const { selectedType, selectNumericType } = useMixedType(
      value,
      ['integer', 'number', 'string'],
      'value'
    );
    return (
      <>
        <span>{selectedType}</span>
        <button onClick={() => selectNumericType('number')}>number</button>
        <button onClick={() => selectNumericType('integer')}>integer</button>
      </>
    );
  };
  const render = (value: unknown) =>
    act(() => root.render(<Harness value={value} />));
  try {
    render(2);
    expect(element.querySelector('span')?.textContent).toBe('integer');
    act(() => element.querySelectorAll('button')[0].click());
    render(2);
    expect(element.querySelector('span')?.textContent).toBe('number');
    render(2.5);
    expect(element.querySelector('span')?.textContent).toBe('number');
    act(() => element.querySelectorAll('button')[1].click());
    render(2.5);
    expect(element.querySelector('span')?.textContent).toBe('integer');
    render('hello');
    render(2.5);
    expect(element.querySelector('span')?.textContent).toBe('number');
  } finally {
    act(() => root.unmount());
  }
});
