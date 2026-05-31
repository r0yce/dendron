"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.levenshteinDistance = levenshteinDistance;
exports.parseDendronURI = parseDendronURI;
const fast_levenshtein_1 = __importDefault(require("fast-levenshtein"));
const constants_1 = require("../constants");
/**
 * Returns levenshtein distance between the two strings, the higher the number
 * the further apart the strings are. 0 signals that the strings are equal. */
function levenshteinDistance(s1, s2) {
    return fast_levenshtein_1.default.get(s1, s2);
}
function parseDendronURI(linkString) {
    if (linkString.startsWith(constants_1.CONSTANTS.DENDRON_DELIMETER)) {
        const [vaultName, link] = linkString
            .split(constants_1.CONSTANTS.DENDRON_DELIMETER)[1]
            .split("/");
        return {
            vaultName,
            link,
        };
    }
    return {
        link: linkString,
    };
}
//# sourceMappingURL=stringUtil.js.map