/**
 * Typed DI wrapper around tsyringe.
 *
 * Goal (full modernization): Reduce the noise of @ts-expect-error comments
 * required for legacy decorators under TS 5.x + experimentalDecorators.
 *
 * This is the first step toward cleaning up the decorator/DI situation in plugin-core.
 * Long-term options remain:
 * - Keep tsyringe + this wrapper
 * - Migrate to a different DI solution
 * - Adopt modern decorators when ecosystem support is mature
 */

import { inject as tsyringeInject, injectable as tsyringeInjectable, singleton as tsyringeSingleton, container as tsyringeContainer } from "tsyringe";

// Re-export the container for now
export const container = tsyringeContainer;

// Wrapper that centralizes the TS ignore for legacy decorator metadata.
// The @ts-expect-error comments may be needed in consuming code; here we keep the surface clean.
export function inject(token: any) {
  return tsyringeInject(token);
}

export function injectable() {
  return tsyringeInjectable();
}

export function singleton() {
  return tsyringeSingleton();
}

export { tsyringeContainer as rawContainer };
