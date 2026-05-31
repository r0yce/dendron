"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestExportPodCommand = void 0;
const pods_core_1 = require("@dendronhq/pods-core");
const BaseExportPodCommand_1 = require("../../../../../src/commands/pods/BaseExportPodCommand");
const ExtensionProvider_1 = require("../../../../ExtensionProvider");
/**
 * Test implementation of BaseExportPodCommand. For testing purposes only.
 */
class TestExportPodCommand extends BaseExportPodCommand_1.BaseExportPodCommand {
    key = "dendron.testexport";
    /**
     * Hardcoded to return the 'foo' Hierarchy and vault[0] from ENGINE_HOOKS.setupBasic
     */
    static mockedSelector = {
        getHierarchy() {
            return new Promise((resolve) => {
                const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                resolve({ hierarchy: "foo", vault: vaults[0] });
            });
        },
    };
    constructor(extension) {
        super(TestExportPodCommand.mockedSelector, extension);
    }
    /**
     * Note hard coded return values - these can be amended as new tests are written.
     * @param _config
     * @returns
     */
    createPod(_config) {
        return {
            exportNotes() {
                return new Promise((resolve) => resolve("note"));
            },
        };
    }
    getRunnableSchema() {
        return {
            type: "object",
            required: ["exportScope"],
            properties: {
                exportScope: {
                    description: "export scope of the pod",
                    type: "string",
                },
            },
        };
    }
    async gatherInputs(_opts) {
        return {
            exportScope: pods_core_1.PodExportScope.Note,
        };
    }
    /**
     * No - op for now. TODO: Add validation on export
     * @param exportReturnValue
     * @returns
     */
    async onExportComplete(_opts) { }
}
exports.TestExportPodCommand = TestExportPodCommand;
//# sourceMappingURL=TestExportCommand.js.map