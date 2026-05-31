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
exports.DefaultMap = exports.URI = void 0;
var vscode_uri_1 = require("vscode-uri");
Object.defineProperty(exports, "URI", { enumerable: true, get: function () { return vscode_uri_1.URI; } });
__exportStar(require("./cache"), exports);
__exportStar(require("./compat"), exports);
__exportStar(require("./dateFormatUtil"), exports);
__exportStar(require("./orderedMatchter"), exports);
__exportStar(require("./regex"), exports);
__exportStar(require("./responseUtil"), exports);
__exportStar(require("./stringUtil"), exports);
__exportStar(require("./treeUtil"), exports);
__exportStar(require("./performanceTimer"), exports);
/**
 * Defaultdict from Python
 */
class DefaultMap extends Map {
    defaultMethod;
    get(key) {
        if (!this.has(key)) {
            this.set(key, this.defaultMethod());
        }
        return super.get(key);
    }
    constructor(defaultMethod) {
        super();
        this.defaultMethod = defaultMethod;
    }
}
exports.DefaultMap = DefaultMap;
//# sourceMappingURL=index.js.map