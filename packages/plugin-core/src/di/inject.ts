/**
 * Central DI wrapper for tsyringe.
 *
 * Purpose: Reduce @ts-expect-error noise from legacy decorators + tsyringe under TS 5.x.
 * All new and migrated code should import from here instead of "tsyringe" directly.
 *
 * Migration plan:
 *   import { inject, injectable, singleton } from "../di/inject";
 *
 * Long-term options (tracked in MONOREPO tracker):
 * - Keep tsyringe behind this wrapper
 * - Full migration away from tsyringe
 * - Modern decorators when ready
 */

import {
  inject as tsyringeInject,
  injectable as tsyringeInjectable,
  singleton as tsyringeSingleton,
  container as tsyringeContainer,
  Lifecycle,
} from "tsyringe";

// Re-export the raw container (use sparingly)
export const container = tsyringeContainer;
export { tsyringeContainer as rawContainer, Lifecycle };

// Note: The @ts-expect-error for legacy decorator metadata is applied at the
// actual class/parameter sites during migration. This wrapper keeps the surface clean.
export const inject = tsyringeInject;
export const injectable = tsyringeInjectable;
export const singleton = tsyringeSingleton;
