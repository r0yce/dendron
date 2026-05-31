"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * This file is used by {@link startServerProcess} to start the dendron engine in a separate process
 */
const api_server_1 = require("@dendronhq/api-server");
const common_all_1 = require("@dendronhq/common-all");
(async () => {
    try {
        // run forever
        await api_server_1.ServerUtils.startServerNode(api_server_1.ServerUtils.prepareServerArgs());
    }
    catch (err) {
        if (process.send) {
            process.send((0, common_all_1.stringifyError)(err));
        }
        process.exit(1);
    }
})();
//# sourceMappingURL=server.js.map