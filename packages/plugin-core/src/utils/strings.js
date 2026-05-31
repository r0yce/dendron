"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchAll = void 0;
const matchAll = (pattern, text) => {
    let match;
    const out = [];
    pattern.lastIndex = 0;
    // eslint-disable-next-line no-cond-assign
    while ((match = pattern.exec(text))) {
        out.push(match);
    }
    return out;
};
exports.matchAll = matchAll;
//# sourceMappingURL=strings.js.map