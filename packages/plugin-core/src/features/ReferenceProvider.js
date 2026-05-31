"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const Sentry = __importStar(require("@sentry/node"));
const lodash_1 = __importDefault(require("lodash"));
const ExtensionProvider_1 = require("../ExtensionProvider");
const EditorUtils_1 = require("../utils/EditorUtils");
const md_1 = require("../utils/md");
const WSUtilsV2_1 = require("../WSUtilsV2");
class ReferenceProvider {
    async provideReferences(document, position) {
        try {
            // No-op if dendron isn't active
            if (!(await ExtensionProvider_1.ExtensionProvider.isActiveAndIsDendronNote(document.uri.fsPath))) {
                return null;
            }
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            // provide reference to header if selection is header.
            const header = EditorUtils_1.EditorUtils.getHeaderAt({ document, position });
            if (!lodash_1.default.isUndefined(header)) {
                const note = await new WSUtilsV2_1.WSUtilsV2(ExtensionProvider_1.ExtensionProvider.getExtension()).getNoteFromDocument(document);
                const references = await (0, md_1.findReferences)(note.fname);
                return references
                    .filter((reference) => {
                    const matchText = reference.matchText;
                    const REGEX = new RegExp("\\[\\[(?<linkContent>.*)\\]\\]");
                    const match = REGEX.exec(matchText);
                    return (match?.groups &&
                        match.groups["linkContent"].split("#")[1] ===
                            (0, common_all_1.getSlugger)().slug(header));
                })
                    .map((reference) => {
                    return reference.location;
                });
            }
            const refAtPos = await (0, md_1.getReferenceAtPosition)({
                document,
                position,
                wsRoot,
                vaults,
            });
            return refAtPos
                ? (await (0, md_1.findReferences)(refAtPos.ref)).map(({ location }) => location)
                : [];
        }
        catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }
}
exports.default = ReferenceProvider;
//# sourceMappingURL=ReferenceProvider.js.map