"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTMLPublishPod = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const unified_1 = require("@dendronhq/unified");
const basev3_1 = require("../basev3");
const utils_1 = require("../utils");
const ID = "dendron.html";
class HTMLPublishPod extends basev3_1.PublishPod {
    static id = ID;
    static description = "publish html";
    get config() {
        return utils_1.PodUtils.createPublishConfig({
            required: [],
            properties: {
                convertLinks: {
                    description: "convert Links to href",
                    type: "boolean",
                    default: true,
                    nullable: true,
                },
                convertTagNotesToLinks: {
                    type: "boolean",
                    default: false,
                    nullable: true,
                },
                convertUserNotesToLinks: {
                    type: "boolean",
                    default: false,
                    nullable: true,
                },
                enablePrettyRefs: {
                    type: "boolean",
                    default: true,
                    nullable: true,
                },
            },
        });
    }
    async plant(opts) {
        const { config, engine, note } = opts;
        const { fname, convertLinks = true, convertTagNotesToLinks = false, convertUserNotesToLinks = false, enablePrettyRefs = true, } = config;
        const econfig = common_server_1.DConfig.readConfigSync(engine.wsRoot);
        const overrideConfig = { ...econfig };
        const workspaceConfig = common_all_1.ConfigUtils.getWorkspace(overrideConfig);
        workspaceConfig.enableUserTags = convertUserNotesToLinks;
        workspaceConfig.enableHashTags = convertTagNotesToLinks;
        const previewConfig = common_all_1.ConfigUtils.getPreview(overrideConfig);
        previewConfig.enablePrettyRefs = enablePrettyRefs;
        const noteCacheForRenderDict = await (0, unified_1.getParsingDependencyDicts)(note, engine, config, config.vaults);
        // Also include children to render the 'children' hierarchy at the footer of the page:
        await Promise.all(note.children.map(async (childId) => {
            // TODO: Can we use a bulk get API instead (if/when it exists) to speed
            // up fetching time
            const childNote = await engine.getNote(childId);
            if (childNote.data) {
                common_all_1.NoteDictsUtils.add(childNote.data, noteCacheForRenderDict);
            }
        }));
        const proc = unified_1.MDUtilsV5.procRehypeFull({
            noteToRender: note,
            noteCacheForRenderDict,
            vault: note.vault,
            vaults: engine.vaults,
            wsRoot: engine.wsRoot,
            fname,
            config: overrideConfig,
            wikiLinksOpts: { convertLinks },
        });
        const { contents } = await proc.processSync(note.body);
        return contents;
    }
}
exports.HTMLPublishPod = HTMLPublishPod;
//# sourceMappingURL=HTMLPod.js.map