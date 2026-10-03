import { vi } from 'vitest';

/*
  Browser APIs jsdom does not implement and antd calls anyway.

  These were declared per file - twenty of the ninety declared `ResizeObserver`,
  each with its own `??`-guarded class - which left the other seventy without
  one. That looked harmless because the components needing it mostly appear in
  the files that declare it, and because the observer is attached in a
  **passive effect**: a test that finishes first never reaches it.

  Under a full parallel run it is reached. `autocompleteChoice.test.tsx` failed
  the whole package with `ReferenceError: ResizeObserver is not defined` thrown
  out of `flushPassiveEffects` - as an *unhandled error*, so all 829 tests
  reported passing and the run still exited non-zero. That is the shape the
  package's intermittent failures have: not an assertion, and not reproducible
  with the file on its own.

  Declared for the package, so no file can be missing one.
*/
class ResizeObserverStub {
  observe() {
    /* nothing to measure in jsdom */
  }
  unobserve() {
    /* nothing to measure in jsdom */
  }
  disconnect() {
    /* nothing to measure in jsdom */
  }
}

(globalThis as any).ResizeObserver =
  (globalThis as any).ResizeObserver ?? ResizeObserverStub;

/*
  React only flushes passive effects when `act` exits if this is set. Without
  it an effect can land after the assertion that was waiting for it - the same
  class of timing problem as the observer above, and the same reason it only
  shows under load. Set package-wide here for the same reason.
*/
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);

// rc-component measures this pseudo-element when locking modal scrolling.
// jsdom has no scrollbar layout; keep normal computed styles intact and return
// an empty declaration only for the unsupported scrollbar measurement.
const getComputedStyle = window.getComputedStyle.bind(window);
window.getComputedStyle = (element, pseudoElement) =>
  pseudoElement === '::-webkit-scrollbar'
    ? document.createElement('div').style
    : getComputedStyle(element, pseudoElement);
