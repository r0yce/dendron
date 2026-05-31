"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Barrel for common-all errors subsystem (enhance-in-place).
 * @see ErrorService.ts for DI-ready IErrorService + DefaultErrorService + token.
 *
 * Added during monorepo-architect common-errors enhance-in-place (priority #2 post common-di).
 * Worktree: /Users/royce/.grok/worktrees/src-dendron/subagent-monorepo-errors-019e7ce2-e26f-7531-9e1d-85bd985b9760
 * Branch: feature/common-errors-enhance-in-place
 *
 * Credits: Dep-Hunter 019e7cda-a3cc-7122-b0c6-b1f9de1b7ba7 (266s/58 post-M2-smoke re-scan) + full orchestra.
 * THE CHAIN DOES NOT STOP.
 */
__exportStar(require("./ErrorService"), exports);
//# sourceMappingURL=index.js.map