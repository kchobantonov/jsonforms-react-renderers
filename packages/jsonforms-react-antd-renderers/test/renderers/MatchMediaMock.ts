/*
  A plain function, not a `vi.fn()`.

  As a mock it was restorable, and `vi.restoreAllMocks()` in any test file's
  `afterEach` reset its implementation to `undefined` - so the *next* test in
  that file died inside antd's responsive observer with
  "Cannot read properties of undefined (reading 'addEventListener')", nowhere
  near what it was testing. Three files had grown comments explaining how to
  avoid it. Nothing asserts on matchMedia calls, so nothing needs it to be a
  mock.
*/
window.matchMedia = ((query: string) => ({
  matches: true,
  media: query,
  onchange: null,
  addListener: () => undefined,
  removeListener: () => undefined,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  dispatchEvent: () => false,
})) as typeof window.matchMedia;
