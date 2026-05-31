"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DLinkUtils = void 0;
const lodash_1 = __importDefault(require("lodash"));
class DLinkUtils {
    static isEquivalent(linkA, linkB) {
        return (linkA.type === linkB.type &&
            this.isDLocEquivalent(linkA.from, linkB.from) &&
            this.isDLocEquivalent(linkA.to, linkB.to) &&
            linkA.value === linkB.value &&
            this.isPositionEquivalent(linkA.position, linkB.position));
    }
    static isDLocEquivalent(locA, locB) {
        if (!locA && !locB)
            return true;
        if (locA && locB) {
            return (locA.fname === locB.fname &&
                locA.id === locB.id &&
                locA.vaultName === locB.vaultName);
        }
        return false;
    }
    static isPositionEquivalent(posA, posB) {
        if (!posA && !posB)
            return true;
        if (posA && posB) {
            return (posA.start.line === posB.start.line &&
                posA.start.column === posB.start.column &&
                posA.end.line === posB.end.line &&
                posA.end.column === posB.end.column &&
                lodash_1.default.isEqual(posA.indent, posB.indent));
        }
        return false;
    }
}
exports.DLinkUtils = DLinkUtils;
//# sourceMappingURL=DLinkUtils.js.map