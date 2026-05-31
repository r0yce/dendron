import { RenderNoteResp } from "@dendronhq/common-all";
import { Comment, CommentAuthorInformation, CommentMode, MarkdownString } from "vscode";
export declare class NoteRefComment implements Comment {
    body: MarkdownString;
    mode: CommentMode;
    author: CommentAuthorInformation;
    constructor(renderResp: RenderNoteResp);
}
