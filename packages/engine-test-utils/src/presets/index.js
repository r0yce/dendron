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
exports.SETUP_HOOK_KEYS = void 0;
exports.callSetupHook = callSetupHook;
const common_all_1 = require("@dendronhq/common-all");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
__exportStar(require("./engine-server"), exports);
__exportStar(require("./pods-core"), exports);
__exportStar(require("./vaults"), exports);
var SETUP_HOOK_KEYS;
(function (SETUP_HOOK_KEYS) {
    /**
     * alpha: link(beta)
     * beta: link(alpha)
     */
    SETUP_HOOK_KEYS["WITH_LINKS"] = "WITH_LINKS";
})(SETUP_HOOK_KEYS || (exports.SETUP_HOOK_KEYS = SETUP_HOOK_KEYS = {}));
const createLink = (fname, opts) => {
    let cVaultPrefix = "";
    if (opts.vaultPrefix) {
        cVaultPrefix = common_all_1.VaultUtils.toURIPrefix(opts.vaultPrefix) + "/";
    }
    return `[[${cVaultPrefix}${fname}]]`;
};
async function callSetupHook(key, opts) {
    const { workspaceType, vaults, wsRoot, withVaultPrefix } = opts;
    const isMultiVault = workspaceType !== "single";
    const cVaults = isMultiVault ? vaults : [vaults[0], vaults[0]];
    // WITH LINKS
    if (key === SETUP_HOOK_KEYS.WITH_LINKS) {
        const link1 = createLink("beta", {
            vaultPrefix: withVaultPrefix ? cVaults[1] : undefined,
        });
        await common_test_utils_1.NoteTestUtilsV4.createNote({
            fname: "alpha",
            wsRoot,
            vault: cVaults[0],
            body: link1,
        });
        const link2 = createLink("alpha", {
            vaultPrefix: withVaultPrefix ? cVaults[0] : undefined,
        });
        await common_test_utils_1.NoteTestUtilsV4.createNote({
            fname: "beta",
            wsRoot,
            vault: cVaults[1],
            body: link2,
        });
        if (isMultiVault) {
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "beta",
                wsRoot,
                vault: cVaults[0],
                body: link2,
                genRandomId: true,
            });
        }
    }
    else {
        throw Error("not supported key");
    }
}
//# sourceMappingURL=index.js.map