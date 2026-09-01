import { formatDuration, parseDuration } from '../src/renderers/duration';

describe('Ant Design duration utilities', () => {
  it('round trips ISO 8601 duration values', () => {
    const parts = parseDuration('P1Y2M3DT4H5M6S');
    expect(parts).not.toBeNull();
    expect(formatDuration(parts!)).toBe('P1Y2M3DT4H5M6S');
  });

  it('rejects non-duration strings', () => {
    expect(parseDuration('tomorrow')).toBeNull();
  });
});
