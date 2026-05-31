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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupLocalExtContainer = setupLocalExtContainer;
require("reflect-metadata");
const inject_1 = require("../di/inject");
const vscode = __importStar(require("vscode"));
const MetadataSvcTreeViewConfig_1 = require("../views/node/treeview/MetadataSvcTreeViewConfig");
async function setupLocalExtContainer(opts) {
    const { wsRoot, engine, vaults } = opts;
    inject_1.container.register("EngineEventEmitter", {
        useToken: "ReducedDEngine",
    });
    inject_1.container.register("wsRoot", { useValue: vscode.Uri.file(wsRoot) });
    inject_1.container.register("ReducedDEngine", { useValue: engine });
    inject_1.container.register("vaults", { useValue: vaults });
    inject_1.container.register("ITreeViewConfig", {
        useClass: MetadataSvcTreeViewConfig_1.MetadataSvcTreeViewConfig,
    });
}
//# sourceMappingURL=setupLocalExtContainer.js.map