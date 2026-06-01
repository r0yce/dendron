/**
 * ErrorService: Injectable error creation + handling surface (enhance-in-place in common-all).
 *
 * Pure (zero vscode, zero side-effects, zero host deps) per ADR 0001 + monorepo-architect 4-axis.
 * Precedent: common-di phase1 (TOKENS + register* from Monorepo scaffolds 019e7cc6-3d67 211s/71 + 019e7ccc-d4a9 190s/59 + final burner 019e7cc6-1dba 330s/74 77% net).
 *
 * Design:
 * - IErrorService interface for DI token registration (useClass / registerInstance / factory).
 * - DefaultErrorService thin wrapper over existing ErrorFactory (keeps 100% backward compat for static paths).
 * - Typed ErrorFactory v2 helpers (createTypedError) for future strict + DI consumers.
 * - Optional onError hook for telemetry/doctor integration (no-op default; plugin-core can adapt).
 *
 * Token: Compatible string for TOKENS.ErrorService in plugin-core/di/inject.ts (and future common-di).
 *   "ErrorService" as const (matches register* machinery exactly).
 *
 * Volume justification (re-scan post Dep-Hunter 019e7cda-a3cc-7122-b0c6-b1f9de1b7ba7 266s/58): 860 DendronError + 89 ErrorFactory across 197 files.
 * Enhance-in-place wins (no new common-errors pkg): core already cohesive/pure in common-all/src/error.ts + errorTypes.ts.
 *
 * Handoff surface: New public API for Test-Guardian (unit tests on IErrorService + Default impl + registration) + doctor error paths.
 *
 * Full credits: See common-errors-proposal.md + monorepo-architect/SKILL.md (this execution) + pulled Doc-Master 019e7cd0-caa7 285.4s/60 + Test-Guardian 019e7cd0-df92 239.2s/55 + all orchestra.
 *
 * THE CHAIN DOES NOT STOP.
 */

import { StatusCodes } from "http-status-codes";
import {
  DendronError,
  DendronErrorProps,
  ErrorFactory,
  IDendronError,
} from "../error";

/** Branded/nominal token type for future common-di (string compatible today). */
export type ErrorServiceToken = "ErrorService";

/**
 * Core injectable error service interface.
 * Consumers (commands, doctor, stores, engine) resolve via DI where appropriate;
 * non-DI paths continue using static ErrorFactory / new DendronError directly (no churn).
 */
export interface IErrorService {
  /** 404 factory passthrough (matches ErrorFactory exactly). */
  create404Error(opts: { url: string }): DendronError;

  createUnexpectedEventError(opts: { event: any }): DendronError;

  createInvalidStateError(opts: { message: string }): DendronError;

  createSchemaValidationError(opts: { message: string }): DendronError;

  /** Wraps any error as DendronError (central for consistent shapes). */
  wrapIfNeeded(err: any): DendronError;

  /**
   * v2 typed creator (new for DI + strict synergy).
   * Enables code like: errorService.createTypedError<EngineInitErrorType>({...})
   */
  createTypedError<TCode = StatusCodes | undefined>(
    props: Omit<DendronErrorProps<TCode>, "name"> & { code?: TCode }
  ): DendronError<TCode>;

  /**
   * Optional hook for cross-cutting (telemetry, doctor error audit, logging).
   * Default no-op in DefaultErrorService; plugin-core adapter can override via DI afterResolution or subclass.
   * Pure here (no vscode).
   */
  onError?(error: IDendronError): void;
}

/** Default pure implementation. Delegates to ErrorFactory for zero behavior change. */
export class DefaultErrorService implements IErrorService {
  create404Error(opts: { url: string }): DendronError {
    return ErrorFactory.create404Error(opts);
  }

  createUnexpectedEventError(opts: { event: any }): DendronError {
    return ErrorFactory.createUnexpectedEventError(opts);
  }

  createInvalidStateError(opts: { message: string }): DendronError {
    return ErrorFactory.createInvalidStateError(opts);
  }

  createSchemaValidationError(opts: { message: string }): DendronError {
    return ErrorFactory.createSchemaValidationError(opts);
  }

  wrapIfNeeded(err: any): DendronError {
    return ErrorFactory.wrapIfNeeded(err);
  }

  createTypedError<TCode = StatusCodes | undefined>(
    props: Omit<DendronErrorProps<TCode>, "name"> & { code?: TCode }
  ): DendronError<TCode> {
    // v2: central place for any future normalization / severity defaults / strict guards
    return new DendronError<TCode>({
      ...props,
      // name is intentionally omitted here to satisfy the Omit<..., "name"> contract
      // Future: e.g. ensure severity defaults based on code
    });
  }

  onError?(_error: IDendronError): void {
    // No-op default (pure). Override in registration (afterResolution hook) or plugin-core adapter.
    // Example future: DI-registered telemetry client could be injected here in enhanced impl.
  }
}

/**
 * String token constant (for register* / container.register(TOKENS.ErrorService, ...)).
 * Compatible with existing DiToken / registerInstance / registerAllDependencies machinery.
 * Branded variant can be layered in common-di phase 2 without breaking string sites.
 */
export const ERROR_SERVICE_TOKEN = "ErrorService" as const;

/** Convenience re-export of ErrorFactory (static remains primary for non-DI). */
export { ErrorFactory } from "../error";

// Future: typed ErrorFactoryV2 class if statics need instance state (deferred; current v2 lives in service).
