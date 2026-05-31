"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DendronCodeWorkspace = void 0;
const common_all_1 = require("@dendronhq/common-all");
const baseWorkspace_1 = require("./baseWorkspace");
class DendronCodeWorkspace extends baseWorkspace_1.DendronBaseWorkspace {
    type = common_all_1.WorkspaceType.CODE;
}
exports.DendronCodeWorkspace = DendronCodeWorkspace;
//# sourceMappingURL=codeWorkspace.js.map