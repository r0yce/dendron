"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvertLinkCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const unified_1 = require("@dendronhq/unified");
const lodash_1 = __importDefault(require("lodash"));
const NoteLookupProviderUtils_1 = require("../components/lookup/NoteLookupProviderUtils");
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const autoCompleter_1 = require("../utils/autoCompleter");
const md_1 = require("../utils/md");
const AutoCompletableRegistrar_1 = require("../utils/registers/AutoCompletableRegistrar");
const vsCodeUtils_1 = require("../vsCodeUtils");
const WSUtils_1 = require("../WSUtils");
const base_1 = require("./base");
class ConvertLinkCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.CONVERT_LINK.key;
    static noAvailableOperationError() {
        return new common_all_1.DendronError({
            message: `No available convert operation for link at cursor position.`,
        });
    }
    static noVaultError() {
        return new common_all_1.DendronError({
            message: "this link points to a note in a vault that doesn't exist",
        });
    }
    static noLinkError() {
        return new common_all_1.DendronError({
            message: `No link at cursor position.`,
        });
    }
    static noTextError() {
        return new common_all_1.DendronError({
            message: "Failed to determine text to replace broken link.",
        });
    }
    prepareBrokenLinkConvertOptions(reference) {
        const parsedLink = unified_1.LinkUtils.parseLinkV2({
            linkString: reference.refText,
            explicitAlias: true,
        });
        const aliasOption = {
            label: "Alias",
            description: parsedLink?.alias,
            detail: "Convert broken link to alias text.",
        };
        const hierarchyOption = {
            label: "Hierarchy",
            description: reference.refType === "usertag" || reference.refType === "hashtag"
                ? reference.ref
                : parsedLink?.value,
            detail: "Convert broken link to hierarchy.",
        };
        const noteNameOption = {
            label: "Note name",
            description: reference.refType === "usertag" || reference.refType === "hashtag"
                ? lodash_1.default.last(reference.ref.split("."))
                : lodash_1.default.last(parsedLink?.value?.split(".")),
            detail: "Convert broken link to note name excluding hierarchy except the basename.",
        };
        const promptOption = {
            label: "Prompt",
            detail: "Input plaintext to convert broken link to.",
        };
        const changeDestinationOption = {
            label: "Change destination",
            detail: "Lookup existing note to link instead of current broken link.",
        };
        const options = [
            hierarchyOption,
            noteNameOption,
            promptOption,
            changeDestinationOption,
        ];
        if (parsedLink?.alias) {
            options.unshift(aliasOption);
        }
        return { options, parsedLink };
    }
    async promptBrokenLinkConvertOptions(reference) {
        const { options, parsedLink } = this.prepareBrokenLinkConvertOptions(reference);
        const option = await vsCodeUtils_1.VSCodeUtils.showQuickPick(options, {
            title: "Pick how you want to convert the broken link.",
            ignoreFocusOut: true,
            canPickMany: false,
        });
        return { option, parsedLink };
    }
    async lookupNewDestination() {
        const lcOpts = {
            nodeType: "note",
            disableVaultSelection: true,
            vaultSelectCanToggle: false,
        };
        const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
        const lc = extension.lookupControllerFactory.create(lcOpts);
        const provider = extension.noteLookupProviderFactory.create(this.key, {
            allowNewNote: false,
            noHidePickerOnAccept: false,
        });
        return new Promise((resolve) => {
            let disposable;
            NoteLookupProviderUtils_1.NoteLookupProviderUtils.subscribe({
                id: this.key,
                controller: lc,
                logger: this.L,
                onDone: (event) => {
                    const data = event.data;
                    if (data.cancel) {
                        resolve(undefined);
                    }
                    resolve(data);
                    disposable?.dispose();
                    vsCodeUtils_1.VSCodeUtils.setContext(constants_1.DendronContext.NOTE_LOOK_UP_ACTIVE, false);
                },
                onHide: () => {
                    resolve(undefined);
                    disposable?.dispose();
                    vsCodeUtils_1.VSCodeUtils.setContext(constants_1.DendronContext.NOTE_LOOK_UP_ACTIVE, false);
                },
            });
            lc.show({
                title: "Select new note for link destination",
                placeholder: "new note",
                provider,
            });
            vsCodeUtils_1.VSCodeUtils.setContext(constants_1.DendronContext.NOTE_LOOK_UP_ACTIVE, true);
            disposable = AutoCompletableRegistrar_1.AutoCompletableRegistrar.OnAutoComplete(() => {
                if (lc.quickPick) {
                    lc.quickPick.value = autoCompleter_1.AutoCompleter.getAutoCompletedValue(lc.quickPick);
                    lc.provider.onUpdatePickerItems({
                        picker: lc.quickPick,
                    });
                }
            });
        });
    }
    async promptBrokenLinkUserInput() {
        const text = await vsCodeUtils_1.VSCodeUtils.showInputBox({
            ignoreFocusOut: true,
            placeHolder: "text to use.",
            prompt: "The text submitted here will be used to replace the broken link.",
            title: "Input plaintext to convert broken link to.",
        });
        return text;
    }
    async prepareBrokenLinkOperation(opts) {
        const { option, parsedLink, reference } = opts;
        if (lodash_1.default.isUndefined(option))
            return;
        let text;
        switch (option.label) {
            case "Alias": {
                text = parsedLink.alias;
                break;
            }
            case "Hierarchy": {
                text = parsedLink.value;
                if (reference.refType === "hashtag" ||
                    reference.refType === "usertag") {
                    text = reference.ref;
                }
                break;
            }
            case "Note name": {
                text = lodash_1.default.last(parsedLink.value.split("."));
                if (reference.refType === "hashtag" ||
                    reference.refType === "usertag") {
                    text = lodash_1.default.last(reference.ref.split("."));
                }
                break;
            }
            case "Prompt": {
                text = this.promptBrokenLinkUserInput();
                break;
            }
            case "Change destination": {
                const resp = await this.lookupNewDestination();
                if (lodash_1.default.isUndefined(resp)) {
                    break;
                }
                text = common_all_1.NoteUtils.createWikiLink({
                    note: resp?.selectedItems[0],
                    alias: { mode: "title" },
                });
                break;
            }
            default: {
                throw new common_all_1.DendronError({
                    message: "Unexpected option selected",
                    payload: {
                        ctx: "prepareBrokenLinkOperation",
                        label: option.label,
                    },
                });
            }
        }
        return text;
    }
    async promptConfirmation(opts) {
        const { title, noConfirm } = opts;
        if (noConfirm)
            return true;
        const options = ["Proceed", "Cancel"];
        const resp = await vsCodeUtils_1.VSCodeUtils.showQuickPick(options, {
            placeHolder: "Proceed",
            ignoreFocusOut: true,
            title,
        });
        return resp === "Proceed";
    }
    async prepareValidLinkOperation(reference) {
        const { refType, range, ref } = reference;
        switch (refType) {
            case "hashtag":
            case "usertag": {
                const shouldProceed = await this.promptConfirmation({
                    title: `Convert ${refType} to wikilink?`,
                });
                if (shouldProceed) {
                    return {
                        range,
                        text: `[[${ref}]]`,
                    };
                }
                break;
            }
            case "wiki": {
                let tagType;
                if (ref.startsWith("user")) {
                    tagType = "usertag";
                }
                else if (ref.startsWith("tags")) {
                    tagType = "hashtag";
                }
                if (lodash_1.default.isUndefined(tagType)) {
                    throw ConvertLinkCommand.noAvailableOperationError();
                }
                const shouldProceed = await this.promptConfirmation({
                    title: `Convert wikilink to ${tagType}?`,
                });
                if (shouldProceed) {
                    const label = lodash_1.default.drop(ref.split(".")).join(".");
                    const text = tagType === "usertag" ? `@${label}` : `#${label}`;
                    return {
                        range,
                        text,
                    };
                }
                break;
            }
            case undefined:
            case "fmtag":
            case "refv2": {
                throw ConvertLinkCommand.noAvailableOperationError();
            }
            default: {
                (0, common_all_1.assertUnreachable)(refType);
            }
        }
        throw new common_all_1.DendronError({
            message: "cancelled.",
        });
    }
    async gatherInputs() {
        const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
        const { vaults, wsRoot } = engine;
        const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
        const { document, selection } = editor;
        const reference = await (0, md_1.getReferenceAtPosition)({
            document,
            position: selection.start,
            vaults,
            wsRoot,
            opts: {
                allowInCodeBlocks: true,
            },
        });
        if (reference === null) {
            throw ConvertLinkCommand.noLinkError();
        }
        const { ref, vaultName, range, refType } = reference;
        if (refType === "fmtag") {
            throw ConvertLinkCommand.noAvailableOperationError();
        }
        const targetVault = vaultName
            ? common_all_1.VaultUtils.getVaultByName({ vaults, vname: vaultName })
            : WSUtils_1.WSUtils.getVaultFromDocument(document);
        if (targetVault === undefined) {
            throw ConvertLinkCommand.noVaultError();
        }
        else {
            const targetNote = (await engine.findNotesMeta({ fname: ref, vault: targetVault }))[0];
            if (targetNote === undefined) {
                const { option, parsedLink } = await this.promptBrokenLinkConvertOptions(reference);
                const text = await this.prepareBrokenLinkOperation({
                    option,
                    parsedLink,
                    reference,
                });
                if (lodash_1.default.isUndefined(text)) {
                    throw ConvertLinkCommand.noTextError();
                }
                return {
                    range,
                    text,
                };
            }
            else {
                const resp = await this.prepareValidLinkOperation(reference);
                return resp;
            }
        }
    }
    async execute(opts) {
        const { range, text } = opts;
        const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
        await editor.edit((editBuilder) => {
            editBuilder.replace(range, text);
        });
        return;
    }
}
exports.ConvertLinkCommand = ConvertLinkCommand;
//# sourceMappingURL=ConvertLink.js.map