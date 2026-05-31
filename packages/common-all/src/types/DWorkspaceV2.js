"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstallStatus = exports.WorkspaceType = void 0;
var WorkspaceType;
(function (WorkspaceType) {
    WorkspaceType["NATIVE"] = "NATIVE";
    WorkspaceType["CODE"] = "CODE";
    WorkspaceType["NONE"] = "NONE";
})(WorkspaceType || (exports.WorkspaceType = WorkspaceType = {}));
/**
 * Extension Install Status
 */
var InstallStatus;
(function (InstallStatus) {
    InstallStatus["NO_CHANGE"] = "NO_CHANGE";
    InstallStatus["INITIAL_INSTALL"] = "INITIAL_INSTALL";
    InstallStatus["UPGRADED"] = "UPGRADED";
})(InstallStatus || (exports.InstallStatus = InstallStatus = {}));
//# sourceMappingURL=DWorkspaceV2.js.map