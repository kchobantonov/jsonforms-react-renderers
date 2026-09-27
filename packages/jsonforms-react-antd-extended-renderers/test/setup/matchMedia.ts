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
  React only flushes passive effects when `act` exits if this is set. Without
  it, an effect can land *after* the assertion that was waiting for it - which
  is why four files in this package each failed once under load and never
  reproduced in isolation. Every one of them mounts something behind
  `React.lazy` (AG Grid, Monaco, the template engines), so the window is real.

  Set for the package rather than per file: it was set in one file out of
  twenty-two, and the twenty-one without it were the flaky ones.
*/
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
