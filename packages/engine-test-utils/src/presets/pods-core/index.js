"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PODS_PRESETS = exports.PODS_CORE = void 0;
const json_1 = __importDefault(require("./json"));
const markdown_1 = __importDefault(require("./markdown"));
exports.PODS_CORE = {
    JSON: json_1.default,
    MARKDOWN: markdown_1.default,
};
exports.PODS_PRESETS = [{ name: "json", presets: json_1.default }];
//# sourceMappingURL=index.js.map