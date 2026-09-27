import { act } from 'react-dom/test-utils';

/**
 * The editor renderers are behind React.lazy, so the first render only produces
 * the Suspense fallback. A single tick is not enough to resolve the dynamic
 * import - and relying on an earlier test having warmed the module cache makes
 * results order-dependent - so pump ticks until the condition holds.
 *
 * **The budget is wall-clock, not ticks.** It used to be a count of 25, which
 * is a measure of how many macrotasks have been pumped and says nothing about
 * how long a dynamic `import()` has had to resolve. Alone, 25 ticks was always
 * plenty. Under `lerna run test` - eight package suites in parallel, every core
 * busy - Monaco and AG Grid sometimes needed longer, and the run failed with
 * `condition still false after 25 ticks` in a test that had been going for
 * 431ms while its neighbour took 2921ms.
 *
 * That is the whole shape of the intermittent failures recorded in
 * `docs/TODO.md`: never reproducible with the file on its own, because on its
 * own the machine is idle.
 *
 * `attempts` is kept as a **minimum** number of ticks, so a caller that asked
 * for more pumping still gets it; the deadline is what decides when to give up.
 */
export const flushUntil = async (
  done: () => boolean,
  attempts = 25,
  timeoutMs = 5000
): Promise<void> => {
  const deadline = Date.now() + timeoutMs;
  let ticks = 0;
  while (!done() && (ticks < attempts || Date.now() < deadline)) {
    await act(async () => {
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    ticks += 1;
  }
  // Giving up quietly turns a condition that never holds into a confusing
  // failure at the first assertion instead of here, where the cause is.
  if (!done()) {
    throw new Error(
      `flushUntil: condition still false after ${ticks} ticks / ${timeoutMs}ms`
    );
  }
};
