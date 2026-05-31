"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mocha_1 = require("mocha");
const KeybindingUtils_1 = require("../../KeybindingUtils");
const testUtilsV3_1 = require("../testUtilsV3");
const sinon_1 = __importDefault(require("sinon"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const testUtilsv2_1 = require("../testUtilsv2");
const constants_1 = require("../../constants");
const common_server_1 = require("@dendronhq/common-server");
const vsCodeUtils_1 = require("../../vsCodeUtils");
function mockUserConfigDir() {
    const dir = (0, common_server_1.tmpDir)().name;
    const getCodeUserConfigDurStub = sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "getCodeUserConfigDir");
    getCodeUserConfigDurStub.callsFake(() => {
        const wrappedMethod = getCodeUserConfigDurStub.wrappedMethod;
        const originalOut = wrappedMethod();
        return {
            userConfigDir: [dir, originalOut.delimiter].join(""),
            delimiter: originalOut.delimiter,
            osName: originalOut.osName,
        };
    });
    return getCodeUserConfigDurStub;
}
suite("KeybindingUtils", function () {
    const DUMMY_KEYBINDING_CONFLICTS = [
        {
            extensionId: "dummyExt",
            commandId: "dummyExt.cmd",
            conflictsWith: "dendron.lookupNote",
        },
    ];
    (0, testUtilsV3_1.describeMultiWS)("GIVEN conflicting extension installed AND keybinding exists", {}, () => {
        let installStatusStub;
        let userConfigDirStub;
        (0, mocha_1.beforeEach)(() => {
            userConfigDirStub = mockUserConfigDir();
            installStatusStub = sinon_1.default
                .stub(KeybindingUtils_1.KeybindingUtils, "getInstallStatusForKnownConflictingExtensions")
                .returns([{ id: "dummyExt", installed: true }]);
        });
        (0, mocha_1.afterEach)(() => {
            installStatusStub.restore();
            userConfigDirStub.restore();
        });
        test("THEN conflict is detected", async () => {
            const out = KeybindingUtils_1.KeybindingUtils.getConflictingKeybindings({
                knownConflicts: DUMMY_KEYBINDING_CONFLICTS,
            });
            (0, testUtilsv2_1.expect)(out).toEqual(DUMMY_KEYBINDING_CONFLICTS);
        });
        test("THEN conflict is detected if a non-resolving remap is in keybindings.json", async () => {
            const { keybindingConfigPath, osName } = KeybindingUtils_1.KeybindingUtils.getKeybindingConfigPath();
            const keyCombo = osName === "Darwin" ? "cmd+l" : "ctrl+l";
            const remapCombo = osName === "Darwin" ? "cmd+shift+l" : "ctrl+shift+l";
            const remapConflictCaseConfig = `// This is my awesome Dendron Keybinding
        [
          {
            "key": "${remapCombo}",
            "command": "dummyExt.cmd",
          }
        ]`;
            const conflictWithMoreArgsCaseConfig = `// This is my awesome Dendron Keybinding
        [
          {
            "key": "${keyCombo}",
            "command": "dummyExt.cmd",
            "args": {
              "foo": "bar"
            }
          }
        ]`;
            const remapDendronCaseConfig = `// This is my awesome Dendron Keybinding
        [
          {
            "key": "${remapCombo}",
            "command": "dendron.lookupNote",
          }
        ]`;
            const dendronWithMoreArgsCaseConfig = `// This is my awesome Dendron Keybinding
        [
          {
            "key": "${keyCombo}",
            "command": "dendron.lookupNote",
            "args": {
              "initialValue": "foo"
            }
          }
        ]`;
            [
                remapConflictCaseConfig,
                conflictWithMoreArgsCaseConfig,
                remapDendronCaseConfig,
                dendronWithMoreArgsCaseConfig,
            ].forEach((config) => {
                fs_extra_1.default.ensureFileSync(keybindingConfigPath);
                fs_extra_1.default.writeFileSync(keybindingConfigPath, config);
                const out = KeybindingUtils_1.KeybindingUtils.getConflictingKeybindings({
                    knownConflicts: DUMMY_KEYBINDING_CONFLICTS,
                });
                (0, testUtilsv2_1.expect)(out).toEqual(DUMMY_KEYBINDING_CONFLICTS);
                fs_extra_1.default.removeSync(keybindingConfigPath);
            });
        });
        test("THEN conflict is not detected if conflicting keybinding is disabled in keybindings.json", async () => {
            const { keybindingConfigPath, osName } = KeybindingUtils_1.KeybindingUtils.getKeybindingConfigPath();
            const keyCombo = osName === "Darwin" ? "cmd+l" : "ctrl+l";
            const disableConflictCaseConfig = `// This is my awesome Dendron Keybinding
        [
          {
            "key": "${keyCombo}",
            "command": "-dummyExt.cmd",
          }
        ]`;
            fs_extra_1.default.ensureFileSync(keybindingConfigPath);
            fs_extra_1.default.writeFileSync(keybindingConfigPath, disableConflictCaseConfig);
            const out = KeybindingUtils_1.KeybindingUtils.getConflictingKeybindings({
                knownConflicts: DUMMY_KEYBINDING_CONFLICTS,
            });
            (0, testUtilsv2_1.expect)(out).toEqual([]);
            fs_extra_1.default.removeSync(keybindingConfigPath);
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN no conflicting extension installed", {}, () => {
        test("THEN no conflict is detected", async () => {
            const out = KeybindingUtils_1.KeybindingUtils.getConflictingKeybindings({
                knownConflicts: constants_1.KNOWN_KEYBINDING_CONFLICTS,
            });
            (0, testUtilsv2_1.expect)(out).toEqual([]);
        });
    });
    (0, mocha_1.describe)("GIVEN a keybinding entry", () => {
        test("THEN correct JSON for disable block is generated", () => {
            const disableBlock = KeybindingUtils_1.KeybindingUtils.generateKeybindingBlockForCopy({
                entry: {
                    key: "ctrl+l",
                    command: "dummyExt.cmd",
                },
                disable: true,
            });
            (0, testUtilsv2_1.expect)(disableBlock).toEqual(`{\n  "key": "ctrl+l",\n  "command": "-dummyExt.cmd",\n}\n`);
        });
        test("THEN correct JSON for remap block is generated", () => {
            const disableBlock = KeybindingUtils_1.KeybindingUtils.generateKeybindingBlockForCopy({
                entry: {
                    key: "ctrl+l",
                    command: "dummyExt.cmd",
                },
            });
            (0, testUtilsv2_1.expect)(disableBlock).toEqual(`{\n  "key": "",\n  "command": "dummyExt.cmd",\n}\n`);
        });
    });
});
//# sourceMappingURL=Keybinding.test.js.map