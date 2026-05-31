"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuickPickUtil = exports.ProceedCancel = void 0;
const common_all_1 = require("@dendronhq/common-all");
const vsCodeUtils_1 = require("../vsCodeUtils");
const ExtensionProvider_1 = require("../ExtensionProvider");
var ProceedCancel;
(function (ProceedCancel) {
    ProceedCancel["PROCEED"] = "proceed";
    ProceedCancel["CANCEL"] = "cancel";
})(ProceedCancel || (exports.ProceedCancel = ProceedCancel = {}));
class QuickPickUtil {
    /** Shows quick pick with proceed/cancel view which
     *  will be blocking until user picks an answer. */
    static async showProceedCancel() {
        const proceedString = "proceed";
        const userChoice = await vsCodeUtils_1.VSCodeUtils.showQuickPick([proceedString, "cancel"], {
            placeHolder: proceedString,
            ignoreFocusOut: true,
        });
        if (userChoice === proceedString) {
            return ProceedCancel.PROCEED;
        }
        else {
            return ProceedCancel.CANCEL;
        }
    }
    /**
     *  Show a quick pick with the given notes as choices. Returns the chosen note
     *  or undefined if user cancelled the note selection.
     *  */
    static async showChooseNote(notes) {
        const inputItems = await Promise.all(notes.map(async (ent) => {
            const workspace = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            return common_all_1.DNodeUtils.enhancePropForQuickInputV3({
                wsRoot: workspace.wsRoot,
                props: ent,
                schema: ent.schema
                    ? (await ExtensionProvider_1.ExtensionProvider.getEngine().getSchema(ent.schema.moduleId)).data
                    : undefined,
                vaults: workspace.vaults,
            });
        }));
        const chosen = await vsCodeUtils_1.VSCodeUtils.showQuickPick(inputItems);
        if (chosen === undefined) {
            return undefined;
        }
        else {
            return chosen;
        }
    }
}
exports.QuickPickUtil = QuickPickUtil;
//# sourceMappingURL=quickPick.js.map