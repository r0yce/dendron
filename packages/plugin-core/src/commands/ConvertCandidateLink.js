"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvertCandidateLinkCommand = void 0;
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
class ConvertCandidateLinkCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.CONVERT_CANDIDATE_LINK.key;
    async gatherInputs(_opts) {
        return _opts;
    }
    async execute(_opts) {
        const { location, text } = _opts;
        await vscode_1.commands.executeCommand("vscode.open", location.uri);
        const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
        const selection = editor.document.getText(location.range);
        const preConversionOffset = selection.indexOf(text);
        const convertedSelection = selection.replace(text, `[[${text}]]`);
        await editor.edit((editBuilder) => {
            editBuilder.replace(location.range, convertedSelection);
        });
        const postConversionSelectionRange = new vscode_1.Selection(new vscode_1.Position(location.range.start.line, location.range.start.character + preConversionOffset), new vscode_1.Position(location.range.end.line, location.range.start.character + preConversionOffset + text.length + 4));
        editor.selection = postConversionSelectionRange;
        return;
    }
}
exports.ConvertCandidateLinkCommand = ConvertCandidateLinkCommand;
//# sourceMappingURL=ConvertCandidateLink.js.map