/**
 * @dendronhq/common-di — vscode-agnostic tsyringe wrappers and core DI tokens.
 *
 * See docs/dev/adr/0001-introduce-common-di-for-tsyringe-ergonomics.md
 */

import {
  inject as tsyringeInject,
  injectable as tsyringeInjectable,
  singleton as tsyringeSingleton,
  container as tsyringeContainer,
  Lifecycle,
  registry as tsyringeRegistry,
} from "tsyringe";

export const container = tsyringeContainer;
export { tsyringeContainer as rawContainer, Lifecycle };
export const injectable = tsyringeInjectable;
export const singleton = tsyringeSingleton;
export const registry = tsyringeRegistry;

/** Absorbs TS5+ decorator-metadata noise at a single site (see ADR 0001). */
type SafeDecoratorFactory = (token: string | symbol) => any;

export const inject: SafeDecoratorFactory = tsyringeInject as any;

/** Core cross-cutting tokens (vscode-agnostic). Extend in plugin-core for web/desktop. */
export const TOKENS = {
  ReducedDEngine: "ReducedDEngine" as const,
  WsRoot: "wsRoot" as const,
  Vaults: "vaults" as const,
  ExtensionContext: "extensionContext" as const,
} as const;

export type DiToken = (typeof TOKENS)[keyof typeof TOKENS];

export const registerInstance =
  tsyringeContainer.registerInstance.bind(tsyringeContainer);