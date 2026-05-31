"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorFactory = exports.ERROR_SERVICE_TOKEN = exports.DefaultErrorService = void 0;
const error_1 = require("../error");
/** Default pure implementation. Delegates to ErrorFactory for zero behavior change. */
class DefaultErrorService {
    create404Error(opts) {
        return error_1.ErrorFactory.create404Error(opts);
    }
    createUnexpectedEventError(opts) {
        return error_1.ErrorFactory.createUnexpectedEventError(opts);
    }
    createInvalidStateError(opts) {
        return error_1.ErrorFactory.createInvalidStateError(opts);
    }
    createSchemaValidationError(opts) {
        return error_1.ErrorFactory.createSchemaValidationError(opts);
    }
    wrapIfNeeded(err) {
        return error_1.ErrorFactory.wrapIfNeeded(err);
    }
    createTypedError(props) {
        // v2: central place for any future normalization / severity defaults / strict guards
        return new error_1.DendronError({
            ...props,
            name: "DendronError",
            // Future: e.g. ensure severity defaults based on code
        });
    }
    onError(error) {
        // No-op default (pure). Override in registration (afterResolution hook) or plugin-core adapter.
        // Example future: DI-registered telemetry client could be injected here in enhanced impl.
    }
}
exports.DefaultErrorService = DefaultErrorService;
/**
 * String token constant (for register* / container.register(TOKENS.ErrorService, ...)).
 * Compatible with existing DiToken / registerInstance / registerAllDependencies machinery.
 * Branded variant can be layered in common-di phase 2 without breaking string sites.
 */
exports.ERROR_SERVICE_TOKEN = "ErrorService";
/** Convenience re-export of ErrorFactory (static remains primary for non-DI). */
var error_2 = require("../error");
Object.defineProperty(exports, "ErrorFactory", { enumerable: true, get: function () { return error_2.ErrorFactory; } });
// Future: typed ErrorFactoryV2 class if statics need instance state (deferred; current v2 lives in service).
//# sourceMappingURL=ErrorService.js.map