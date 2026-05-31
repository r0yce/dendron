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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LookupQuickpickFactory = void 0;
const common_all_1 = require("@dendronhq/common-all");
const lodash_1 = __importDefault(require("lodash"));
const inject_1 = require("../../../di/inject");
const vscode = __importStar(require("vscode"));
const vscode_uri_1 = require("vscode-uri");
const constants_1 = require("../../../constants");
const autoCompleter_1 = require("../../../utils/autoCompleter");
const WSUtils_1 = require("../../utils/WSUtils");
const VaultQuickPick_1 = require("./VaultQuickPick");
const CREATE_NEW_LABEL = "Create New";
let LookupQuickpickFactory = class LookupQuickpickFactory {
    _engine;
    vaults;
    tabAutoCompleteEvent;
    wsUtils;
    constructor(_engine, vaults, tabAutoCompleteEvent, wsUtils) {
        this._engine = _engine;
        this.vaults = vaults;
        this.tabAutoCompleteEvent = tabAutoCompleteEvent;
        this.wsUtils = wsUtils;
    }
    showLookup(opts) {
        let initialValue = opts?.initialValue;
        if (!initialValue) {
            initialValue = this.getInitialValueBasedOnActiveNote();
        }
        const qp = this.create({
            title: "Lookup Note",
            buttons: [],
            provider: opts.provider,
            initialValue,
        });
        this.tabAutoCompleteEvent(() => {
            qp.value = autoCompleter_1.AutoCompleter.getAutoCompletedValue(qp);
        });
        // lookupPromise resolves when ALL input has been accepted or closed (file
        // name + vault picker prompts for example)
        const lookupPromise = new Promise((outerResolve) => {
            const onInitialPromptResponse = new Promise((resolve) => {
                qp.onDidAccept(() => {
                    resolve({
                        items: qp.selectedItems,
                    });
                    qp.dispose();
                });
                qp.onDidHide(() => {
                    resolve(undefined);
                });
            });
            onInitialPromptResponse.then(async (value) => {
                if (value?.items.length === 1 &&
                    value.items[0].label === CREATE_NEW_LABEL) {
                    // Show the vault picker control if necessary
                    const vaultPicker = new VaultQuickPick_1.VaultQuickPick(this._engine);
                    const currentNote = await this.wsUtils.getActiveNote();
                    const vault = await vaultPicker.getOrPromptVaultForNewNote({
                        fname: value.items[0].fname,
                        vault: currentNote?.vault ?? this.vaults[0],
                        vaults: this.vaults,
                    });
                    if (!vault) {
                        outerResolve(undefined);
                    }
                    else {
                        value.items[0].vault = vault;
                    }
                }
                outerResolve(value);
            });
        });
        qp.show();
        vscode.commands.executeCommand("setContext", constants_1.DendronContext.NOTE_LOOK_UP_ACTIVE, true);
        lookupPromise.finally(() => {
            vscode.commands.executeCommand("setContext", constants_1.DendronContext.NOTE_LOOK_UP_ACTIVE, false);
        });
        return lookupPromise;
    }
    create(opts) {
        const qp = vscode.window.createQuickPick();
        let initialized = false; // Not really sure why this is needed. For some reason onDidChangeValue seems to get called before I think the callback is set up.
        qp.title = opts.title;
        qp.buttons = opts.buttons ?? [];
        // We slice the postfix off until the first dot to show all results at the same
        // level so that when a user types `foo.one`, they will see all results in `foo.*`
        const initialQueryValue = common_all_1.NoteLookupUtils.getQsForCurrentLevel(opts.initialValue ?? "");
        qp.value = opts.initialValue ?? "";
        opts.provider
            .provideItems({
            pickerValue: initialQueryValue,
            showDirectChildrenOnly: false,
            workspaceState: {
                vaults: this.vaults,
                schemas: {},
            },
        })
            .then((initialItems) => {
            if (initialItems) {
                qp.items = initialItems;
                initialized = true;
            }
        });
        qp.onDidChangeValue(async (newInput) => {
            if (!initialized) {
                return;
            }
            const items = await opts.provider.provideItems({
                pickerValue: newInput,
                showDirectChildrenOnly: false,
                workspaceState: {
                    vaults: this.vaults,
                    schemas: {},
                },
            });
            const modifiedItems = this.addCreateNewOptionIfNecessary(newInput, items);
            qp.items = modifiedItems;
        });
        return qp;
    }
    getInitialValueBasedOnActiveNote() {
        const uri = vscode.window.activeTextEditor?.document.uri;
        if (!uri)
            return "";
        const initialValue = lodash_1.default.trimEnd(vscode_uri_1.Utils.basename(uri), ".md");
        return initialValue;
    }
    addCreateNewOptionIfNecessary(queryOrig, items) {
        // if new notes are allowed and we didn't get a perfect match, append `Create New` option
        // to picker results
        // NOTE: order matters. we always pick the first item in single select mode
        // If each of the vaults in the workspace already have exact match of the file name
        // then we should not allow create new option.
        const queryOrigLowerCase = queryOrig.toLowerCase();
        const numberOfExactMatches = items.filter((item) => item.fname.toLowerCase() === queryOrigLowerCase).length;
        // Move this logic to controller:
        const vaultsHaveSpaceForExactMatch = this.vaults.length > numberOfExactMatches;
        // TODO: Add back the other criteria
        const shouldAddCreateNew = 
        // sometimes lookup is in mode where new notes are not allowed (eg. move an existing note, this option is manually passed in)
        // this.opts.allowNewNote &&
        // notes can't end with dot, invalid note
        !queryOrig.endsWith(".") &&
            // if you can select mult notes, new note is not valid
            // !picker.canSelectMany &&
            // when you create lookup from selection, new note is not valid
            // !transformedQuery.wasMadeFromWikiLink &&
            vaultsHaveSpaceForExactMatch;
        if (shouldAddCreateNew) {
            const entryCreateNew = this.createNewNoteQPItem({
                fname: queryOrig,
                detail: "Note does not exist. Create?",
                vault: this.vaults[0], // Pass in a dummy value, this won't get used.
            });
            if (this.shouldBubbleUpCreateNew({
                numberOfExactMatches,
                querystring: queryOrig,
                // bubbleUpCreateNew,
            })) {
                return [entryCreateNew, ...items];
            }
            else {
                return [...items, entryCreateNew];
            }
        }
        else {
            return items;
        }
    }
    createNewNoteQPItem({ fname, detail, }) {
        const props = common_all_1.DNodeUtils.create({
            id: CREATE_NEW_LABEL,
            fname,
            type: "note",
            vault: this.vaults[0], // Pass in a dummy value, this won't get used.
        });
        return {
            ...props,
            label: CREATE_NEW_LABEL,
            detail,
            alwaysShow: true,
        };
    }
    /** This function presumes that 'CreateNew' should be shown and determines whether
     *  CreateNew should be at the top of the look up results or not. */
    shouldBubbleUpCreateNew({ numberOfExactMatches, querystring, bubbleUpCreateNew, }) {
        // We don't want to bubble up create new if there is an exact match since
        // vast majority of times if there is an exact match user wants to navigate to it
        // rather than create a new file with exact same file name in different vault.
        const noExactMatches = numberOfExactMatches === 0;
        // Note: one of the special characters is space/' ' which for now we want to allow
        // users to make the files with ' ' in them but we won't bubble up the create new
        // option for the special characters, including space. The more contentious part
        // about previous/current behavior is that we allow creation of files with
        // characters like '$' which FuseJS will not match (Meaning '$' will NOT match 'hi$world').
        const noSpecialQueryChars = !common_all_1.FuseEngine.doesContainSpecialQueryChars(querystring);
        if (lodash_1.default.isUndefined(bubbleUpCreateNew))
            bubbleUpCreateNew = true;
        return noSpecialQueryChars && noExactMatches && bubbleUpCreateNew;
    }
};
exports.LookupQuickpickFactory = LookupQuickpickFactory;
exports.LookupQuickpickFactory = LookupQuickpickFactory = __decorate([
    (0, inject_1.injectable)(),
    __param(0, (0, inject_1.inject)("ReducedDEngine")),
    __param(1, (0, inject_1.inject)("vaults")),
    __param(2, (0, inject_1.inject)("AutoCompleteEvent")),
    __metadata("design:paramtypes", [Object, Array, Function, WSUtils_1.WSUtilsWeb])
], LookupQuickpickFactory);
//# sourceMappingURL=LookupQuickpickFactory.js.map