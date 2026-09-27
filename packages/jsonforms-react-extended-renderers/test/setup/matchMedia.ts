// jsdom does not implement matchMedia and antd calls it directly.
// `matches: false` keeps the environment deterministic: prefers-color-scheme
// never reports dark, so tests assert the design-system signal, not the OS.
/*
  A plain function, not a `vi.fn()`.

  As a mock it was restorable, and `vi.restoreAllMocks()` in any test file's
  `afterEach` reset its implementation to `undefined` - so the *next* test in
  that file died inside antd's responsive observer with "Cannot read
  properties of undefined (reading 'addEventListener')", nowhere near what it
  was testing. Nothing asserts on matchMedia calls, so nothing needs it to be
  a mock.
*/
window.matchMedia = ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => undefined,
  removeListener: () => undefined,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  dispatchEvent: () => false,
})) as typeof window.matchMedia;

/*
  React only flushes passive effects when `act` exits if this is set - without
  it every test here logs "The current testing environment is not configured to
  support act(...)", and an effect can land after the assertion waiting for it.

  Set package-wide, as in the two antd packages. See `docs/TODO.md` entry 6:
  the absent flag and a tick-counted `flushUntil` are what the suite's
  intermittent, unreproducible failures turned out to be.
*/
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
