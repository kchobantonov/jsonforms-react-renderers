import { describe, expect, it } from 'vitest';
import { choiceCardsTester, isCardPresentation } from '../src/choiceCards';

describe('choice card selection', () => {
  it.each([
    { enum: [false, 1] },
    { oneOf: [{ const: 'a' }, { const: 'b' }] },
    { oneOf: [{ type: 'string' }, { type: 'number' }] },
  ])('ranks explicit card controls at 21', (schema) => {
    expect(
      choiceCardsTester(
        { type: 'Control', scope: '#', options: { format: 'cards' } },
        schema as any,
        { rootSchema: schema, config: {} } as any
      )
    ).toBe(21);
    expect(
      choiceCardsTester(
        { type: 'Control', scope: '#' },
        schema as any,
        { rootSchema: schema, config: {} } as any
      )
    ).toBe(-1);
  });
  it('does not select an ordinary scalar control', () => {
    expect(
      choiceCardsTester(
        { type: 'Control', scope: '#', options: { format: 'cards' } },
        { type: 'string' },
        { rootSchema: {}, config: {} }
      )
    ).toBe(-1);
  });
  it('rejects interactive content even inside a layout', () => {
    expect(
      isCardPresentation({
        type: 'VerticalLayout',
        elements: [{ type: 'Control', scope: '#' }],
      })
    ).toBe(false);
    expect(isCardPresentation({ type: 'Link', href: '/' })).toBe(false);
    expect(
      isCardPresentation({
        type: 'VerticalLayout',
        elements: [
          { type: 'ImageView', src: '/image.png' },
          { type: 'Label', text: 'Choice' },
        ],
      })
    ).toBe(true);
  });
});
