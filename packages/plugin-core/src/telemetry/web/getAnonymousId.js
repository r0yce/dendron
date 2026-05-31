"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnonymousId = getAnonymousId;
const common_all_1 = require("@dendronhq/common-all");
/**
 * Gets an anonymous ID for use in telemetry. If no anonymous ID exists yet,
 * then a new one is generated, stored, then returned.
 * @param storage
 * @returns
 */
function getAnonymousId(context) {
    const storedId = context.globalState.get(common_all_1.GLOBAL_STATE_KEYS.ANONYMOUS_ID);
    if (storedId) {
        return storedId;
    }
    const newId = (0, common_all_1.genUUID)();
    context.globalState.setKeysForSync([common_all_1.GLOBAL_STATE_KEYS.ANONYMOUS_ID]);
    // Note: this async call is intentionally not awaited on.
    context.globalState.update(common_all_1.GLOBAL_STATE_KEYS.ANONYMOUS_ID, newId);
    return newId;
}
//# sourceMappingURL=getAnonymousId.js.map