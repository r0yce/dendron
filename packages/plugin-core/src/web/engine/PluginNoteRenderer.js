"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginNoteRenderer = void 0;
const common_all_1 = require("@dendronhq/common-all");
const unified_1 = require("@dendronhq/unified");
const inject_1 = require("../../di/inject");
let PluginNoteRenderer = class PluginNoteRenderer {
    publishingConfig;
    engine;
    vaults;
    // TODO: Remove this config from injection in favor of only injecting the
    // parameters that are needed. Right now, the unified proc's require the
    // entire config to be passed in.
    constructor(publishingConfig, engine, vaults) {
        this.publishingConfig = publishingConfig;
        this.engine = engine;
        this.vaults = vaults;
    }
    async renderNote(opts) {
        try {
            const data = await this._renderNote({
                note: opts.note, // TODO: get rid of !
                flavor: opts.flavor || common_all_1.ProcFlavor.PREVIEW,
                dest: opts.dest || common_all_1.DendronASTDest.HTML,
            });
            return { data };
        }
        catch (error) {
            return {
                error: new common_all_1.DendronError({
                    message: `Unable to render note ${opts.note.fname} in ${common_all_1.VaultUtils.getName(opts.note.vault)}`,
                    payload: error,
                }),
            };
        }
    }
    async _renderNote({ note, flavor, dest, }) {
        const noteCacheForRenderDict = await (0, unified_1.getParsingDependencyDicts)(note, this.engine, this.publishingConfig, this.vaults);
        // Also include children to render the 'children' hierarchy at the footer of the page:
        await Promise.all(note.children.map(async (childId) => {
            // TODO: Can we use a bulk get API instead (if/when it exists) to speed
            // up fetching time
            const childNote = await this.engine.getNote(childId);
            if (childNote.data) {
                common_all_1.NoteDictsUtils.add(childNote.data, noteCacheForRenderDict);
            }
        }));
        let proc;
        if (dest === common_all_1.DendronASTDest.HTML) {
            proc = unified_1.MDUtilsV5Web.procRehypeWeb({
                noteToRender: note,
                fname: note.fname,
                vault: note.vault,
                config: this.publishingConfig,
                noteCacheForRenderDict,
            }, { flavor });
        }
        else {
            // Only support Preview rendering right now:
            return "Only HTML Rendering is supported right now.";
        }
        const serialized = common_all_1.NoteUtils.serialize(note);
        const payload = await proc.process(serialized);
        const renderedNote = payload.toString();
        return renderedNote;
    }
};
exports.PluginNoteRenderer = PluginNoteRenderer;
exports.PluginNoteRenderer = PluginNoteRenderer = __decorate([
    (0, inject_1.injectable)(),
    __param(0, (0, inject_1.inject)("DendronConfig")),
    __param(1, (0, inject_1.inject)("ReducedDEngine")),
    __param(2, (0, inject_1.inject)("vaults")),
    __metadata("design:paramtypes", [Object, Object, Array])
], PluginNoteRenderer);
//# sourceMappingURL=PluginNoteRenderer.js.map