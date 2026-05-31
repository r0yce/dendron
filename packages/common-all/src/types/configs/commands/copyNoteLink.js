"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genDefaultCopyNoteLinkConfig = genDefaultCopyNoteLinkConfig;
function genDefaultCopyNoteLinkConfig() {
    // don't set a default for `nonNoteFiles`, we want to prompt the user whether they want lines or block anchors
    return { aliasMode: "title" };
}
//# sourceMappingURL=copyNoteLink.js.map