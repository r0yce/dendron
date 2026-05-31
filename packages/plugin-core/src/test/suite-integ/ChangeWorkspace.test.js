"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const testUtilsV3_1 = require("../testUtilsV3");
const mocha_1 = require("mocha");
const ChangeWorkspace_1 = require("../../commands/ChangeWorkspace");
const sinon_1 = __importDefault(require("sinon"));
const vscode_1 = require("vscode");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const common_all_1 = require("@dendronhq/common-all");
const testUtilsv2_1 = require("../testUtilsv2");
const ExtensionProvider_1 = require("../../ExtensionProvider");
// eslint-disable-next-line prefer-arrow-callback
suite("GIVEN ChangeWorkspace command", function () {
    (0, testUtilsV3_1.describeMultiWS)("WHEN command is gathering inputs", {}, () => {
        let showOpenDialog;
        (0, mocha_1.beforeEach)(async () => {
            const cmd = new ChangeWorkspace_1.ChangeWorkspaceCommand();
            showOpenDialog = sinon_1.default.stub(vscode_1.window, "showOpenDialog");
            await cmd.gatherInputs();
        });
        (0, mocha_1.afterEach)(() => {
            showOpenDialog.restore();
        });
        test("THEN file picker is opened", (done) => {
            (0, testUtilsv2_1.expect)(showOpenDialog.calledOnce).toBeTruthy();
            done();
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("WHEN command is run", {}, (ctx) => {
        (0, mocha_1.describe)("AND a code workspace is selected", () => {
            let openWS;
            let newWSRoot;
            (0, mocha_1.before)(async () => {
                const { wsRoot: currentWSRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                openWS = sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "openWS").resolves();
                const out = await (0, testUtilsV3_1.setupLegacyWorkspaceMulti)({
                    ctx,
                    workspaceType: common_all_1.WorkspaceType.CODE,
                });
                newWSRoot = out.wsRoot;
                (0, testUtilsv2_1.expect)(newWSRoot).toNotEqual(currentWSRoot);
                const cmd = new ChangeWorkspace_1.ChangeWorkspaceCommand();
                sinon_1.default.stub(cmd, "gatherInputs").resolves({ rootDirRaw: newWSRoot });
                await cmd.run();
            });
            (0, mocha_1.after)(() => {
                openWS.restore();
            });
            test("THEN workspace is opened", (done) => {
                (0, testUtilsv2_1.expect)(openWS.calledOnce).toBeTruthy();
                (0, testUtilsv2_1.expect)(openWS.calledOnceWithExactly(newWSRoot));
                done();
            });
        });
        (0, mocha_1.describe)("AND a native workspace is selected", () => {
            let openWS;
            let newWSRoot;
            (0, mocha_1.before)(async () => {
                const { wsRoot: currentWSRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                openWS = sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "openWS").resolves();
                const out = await (0, testUtilsV3_1.setupLegacyWorkspaceMulti)({
                    ctx,
                    workspaceType: common_all_1.WorkspaceType.NATIVE,
                });
                newWSRoot = out.wsRoot;
                (0, testUtilsv2_1.expect)(newWSRoot).toNotEqual(currentWSRoot);
                const cmd = new ChangeWorkspace_1.ChangeWorkspaceCommand();
                sinon_1.default.stub(cmd, "gatherInputs").resolves({ rootDirRaw: newWSRoot });
                await cmd.run();
            });
            (0, mocha_1.after)(() => {
                openWS.restore();
            });
            test("THEN workspace is opened", (done) => {
                (0, testUtilsv2_1.expect)(openWS.calledOnce).toBeTruthy();
                (0, testUtilsv2_1.expect)(openWS.calledOnceWithExactly(newWSRoot));
                done();
            });
        });
    });
});
//# sourceMappingURL=ChangeWorkspace.test.js.map