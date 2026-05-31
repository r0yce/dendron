"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteRefComment = void 0;
const vscode_1 = require("vscode");
class NoteRefComment {
    body;
    mode;
    author;
    constructor(renderResp) {
        this.mode = vscode_1.CommentMode.Preview;
        this.author = { name: "" };
        const mdString = renderResp.error
            ? new vscode_1.MarkdownString(`Error: ${renderResp.error}`)
            : new vscode_1.MarkdownString(renderResp.data);
        mdString.supportHtml = true;
        mdString.isTrusted = true;
        this.body = mdString;
    }
}
exports.NoteRefComment = NoteRefComment;
//# sourceMappingURL=NoteRefComment.js.map