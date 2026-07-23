/**
 * Sprint 1: schedule non-critical activation work after the critical path.
 * Uses setTimeout(0) (or a short delay) so the extension can report active
 * and respond to the first keystroke before secondary work runs.
 */

export type DeferredHandle = { cancel: () => void };

/**
 * Run `fn` on the next idle tick (or after `delayMs`).
 * Safe for extension host: never throws to the unhandled path.
 */
export function scheduleDeferred(
  fn: () => void | Promise<void>,
  opts?: { delayMs?: number; label?: string },
): DeferredHandle {
  let cancelled = false;
  const delayMs = opts?.delayMs ?? 0;
  const timer = setTimeout(() => {
    if (cancelled) return;
    Promise.resolve()
      .then(() => fn())
      .catch((err) => {
        // Avoid crashing the host for deferred work
        console.warn(
          `[Dendron lazyActivation] deferred work failed${
            opts?.label ? ` (${opts.label})` : ""
          }:`,
          err,
        );
      });
  }, delayMs);
  return {
    cancel: () => {
      cancelled = true;
      clearTimeout(timer);
    },
  };
}
