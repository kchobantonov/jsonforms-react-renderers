import { pickerFormatFor } from '../src/util/colorFormat';
describe('Ant Design picker format', () => {
  it('opens the picker on the panel matching the save format', () => {
    expect(pickerFormatFor('hex')).toBe('hex');
    expect(pickerFormatFor('hex3')).toBe('hex');
    expect(pickerFormatFor('rgb')).toBe('rgb');
    expect(pickerFormatFor('hsb')).toBe('hsb');
  });
});
