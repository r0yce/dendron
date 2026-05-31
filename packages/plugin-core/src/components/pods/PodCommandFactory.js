"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PodCommandFactory = void 0;
const common_all_1 = require("@dendronhq/common-all");
const pods_core_1 = require("@dendronhq/pods-core");
const path_1 = __importDefault(require("path"));
const AirtableExportPodCommand_1 = require("../../commands/pods/AirtableExportPodCommand");
const GoogleDocsExportPodCommand_1 = require("../../commands/pods/GoogleDocsExportPodCommand");
const JSONExportPodCommand_1 = require("../../commands/pods/JSONExportPodCommand");
const MarkdownExportPodCommand_1 = require("../../commands/pods/MarkdownExportPodCommand");
const NotionExportPodCommand_1 = require("../../commands/pods/NotionExportPodCommand");
const ExtensionProvider_1 = require("../../ExtensionProvider");
class PodCommandFactory {
    /**
     * Creates a runnable vs code command that will execute the appropriate pod
     * based on the passed in pod configuration
     * @param configId
     * @returns A pod command configured with the found configuration
     */
    static createPodCommandForStoredConfig({ configId, exportScope, config, }) {
        // configId is a required param for all cases except when called from CopyAsCommand. It sends a predefined config
        if (!configId && !config) {
            throw new common_all_1.DendronError({
                message: `Please provide a config id to continue.`,
            });
        }
        let podType;
        let storedConfig;
        if (config) {
            podType = config.podType;
            storedConfig = config;
        }
        else {
            if (!configId) {
                throw new common_all_1.DendronError({
                    message: `Please provide a config id`,
                });
            }
            storedConfig = pods_core_1.PodV2ConfigManager.getPodConfigById({
                podsDir: path_1.default.join(ExtensionProvider_1.ExtensionProvider.getPodsDir(), "custom"),
                opts: configId,
            });
            if (!storedConfig) {
                throw new common_all_1.DendronError({
                    message: `No pod config with id ${configId.podId} found.`,
                });
            }
            // overrides the exportScope of stored config with the exportScope passed in args
            if (exportScope) {
                storedConfig.exportScope = exportScope;
            }
            podType = storedConfig.podType;
        }
        let cmdWithArgs;
        const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
        switch (podType) {
            case pods_core_1.PodV2Types.AirtableExportV2: {
                const airtableCmd = new AirtableExportPodCommand_1.AirtableExportPodCommand(extension);
                cmdWithArgs = {
                    key: airtableCmd.key,
                    run() {
                        return airtableCmd.run(storedConfig);
                    },
                };
                break;
            }
            case pods_core_1.PodV2Types.MarkdownExportV2: {
                const cmd = new MarkdownExportPodCommand_1.MarkdownExportPodCommand(extension);
                cmdWithArgs = {
                    key: cmd.key,
                    run() {
                        return cmd.run(storedConfig);
                    },
                };
                break;
            }
            case pods_core_1.PodV2Types.GoogleDocsExportV2: {
                const cmd = new GoogleDocsExportPodCommand_1.GoogleDocsExportPodCommand(extension);
                cmdWithArgs = {
                    key: cmd.key,
                    run() {
                        return cmd.run(storedConfig);
                    },
                };
                break;
            }
            case pods_core_1.PodV2Types.NotionExportV2: {
                const cmd = new NotionExportPodCommand_1.NotionExportPodCommand(extension);
                cmdWithArgs = {
                    key: cmd.key,
                    run() {
                        return cmd.run(storedConfig);
                    },
                };
                break;
            }
            case pods_core_1.PodV2Types.JSONExportV2: {
                const cmd = new JSONExportPodCommand_1.JSONExportPodCommand(extension);
                cmdWithArgs = {
                    key: cmd.key,
                    run() {
                        return cmd.run(storedConfig);
                    },
                };
                break;
            }
            default:
                throw new Error(`Unsupported PodV2 Type: ${storedConfig.podType}`);
        }
        return cmdWithArgs;
    }
    /**
     * Creates a vanilla pod command for the specified Pod(V2) type. This is meant
     * to be used when there is no pre-existing pod config for the command - no
     * arguments will be passed to the pod command for run().
     * @param podType
     * @returns
     */
    static createPodCommandForPodType(podType) {
        const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
        switch (podType) {
            case pods_core_1.PodV2Types.AirtableExportV2: {
                const cmd = new AirtableExportPodCommand_1.AirtableExportPodCommand(extension);
                return {
                    key: cmd.key,
                    run() {
                        return cmd.run();
                    },
                };
            }
            case pods_core_1.PodV2Types.MarkdownExportV2: {
                const cmd = new MarkdownExportPodCommand_1.MarkdownExportPodCommand(extension);
                return {
                    key: cmd.key,
                    run() {
                        return cmd.run();
                    },
                };
            }
            case pods_core_1.PodV2Types.GoogleDocsExportV2: {
                const cmd = new GoogleDocsExportPodCommand_1.GoogleDocsExportPodCommand(extension);
                return {
                    key: cmd.key,
                    run() {
                        return cmd.run();
                    },
                };
            }
            case pods_core_1.PodV2Types.NotionExportV2: {
                const cmd = new NotionExportPodCommand_1.NotionExportPodCommand(extension);
                return {
                    key: cmd.key,
                    run() {
                        return cmd.run();
                    },
                };
            }
            case pods_core_1.PodV2Types.JSONExportV2: {
                const cmd = new JSONExportPodCommand_1.JSONExportPodCommand(extension);
                return {
                    key: cmd.key,
                    run() {
                        return cmd.run();
                    },
                };
            }
            default:
                (0, common_all_1.assertUnreachable)(podType);
        }
    }
}
exports.PodCommandFactory = PodCommandFactory;
//# sourceMappingURL=PodCommandFactory.js.map