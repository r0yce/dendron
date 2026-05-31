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
const assert_1 = __importDefault(require("assert"));
const ts_sinon_1 = __importStar(require("ts-sinon"));
const vscode = __importStar(require("vscode"));
const DummyTelemetryClient_1 = require("../../../../telemetry/common/DummyTelemetryClient");
const CopyNoteURLCmd_1 = require("../../../commands/CopyNoteURLCmd");
const SiteUtilsWeb_1 = require("../../../utils/SiteUtilsWeb");
const WSUtils_1 = require("../../../utils/WSUtils");
require("mocha/mocha");
const getTestPublishingConfig = ({ siteUrl = "https://foo.com", assetsPrefix = "/testing", siteIndex = "root", enablePrettyLinks = true, }) => {
    return {
        siteUrl,
        assetsPrefix,
        siteIndex,
        enablePrettyLinks,
    };
};
suite("GIVEN a CopyNoteURLCmd", () => {
    const wsRoot = vscode.Uri.file("tmp");
    const mockEngine = (0, ts_sinon_1.stubInterface)();
    const vault = [
        {
            selfContained: true,
            fsPath: "path",
        },
    ];
    const foo = common_all_1.NoteUtils.create({ fname: "foo", vault: vault[0] });
    test("WHEN assetPrefix is provided, THEN link must have assetsPrefix", async () => {
        const wsUtils = new WSUtils_1.WSUtilsWeb(mockEngine, wsRoot, vault);
        const { siteUrl, assetsPrefix, siteIndex, enablePrettyLinks } = getTestPublishingConfig({});
        const siteUtils = new SiteUtilsWeb_1.SiteUtilsWeb(siteUrl, siteIndex, assetsPrefix, enablePrettyLinks);
        const vaultStub = ts_sinon_1.default
            .stub(wsUtils, "getVaultFromDocument")
            .returns(vault[0]);
        const NoteStub = ts_sinon_1.default.stub(wsUtils, "getNoteFromDocument").resolves([foo]);
        const cmd = new CopyNoteURLCmd_1.CopyNoteURLCmd(wsUtils, new DummyTelemetryClient_1.DummyTelemetryClient(), siteUtils);
        const activeTextEditorStub = ts_sinon_1.default
            .stub(cmd, "getActiveTextEditor")
            .returns("fakeEditor");
        const link = await cmd.run();
        (0, assert_1.default)(link?.startsWith("https://foo.com/testing/notes/"));
        vaultStub.restore();
        NoteStub.restore();
        activeTextEditorStub.restore();
    });
    test("WHEN assetPrefix is not provided, THEN link must not have assetsPrefix", async () => {
        const wsUtils = new WSUtils_1.WSUtilsWeb(mockEngine, wsRoot, vault);
        const { siteUrl, assetsPrefix, siteIndex, enablePrettyLinks } = getTestPublishingConfig({ assetsPrefix: "" });
        const siteUtils = new SiteUtilsWeb_1.SiteUtilsWeb(siteUrl, siteIndex, assetsPrefix, enablePrettyLinks);
        const vaultStub = ts_sinon_1.default
            .stub(wsUtils, "getVaultFromDocument")
            .returns(vault[0]);
        const NoteStub = ts_sinon_1.default.stub(wsUtils, "getNoteFromDocument").resolves([foo]);
        const cmd = new CopyNoteURLCmd_1.CopyNoteURLCmd(wsUtils, new DummyTelemetryClient_1.DummyTelemetryClient(), siteUtils);
        const activeTextEditorStub = ts_sinon_1.default
            .stub(cmd, "getActiveTextEditor")
            .returns("fakeEditor");
        const link = await cmd.run();
        (0, assert_1.default)(link?.startsWith("https://foo.com/notes/"));
        vaultStub.restore();
        NoteStub.restore();
        activeTextEditorStub.restore();
    });
    test("WHEN enablePrettylinks is set to false, THEN link must have .html", async () => {
        const wsUtils = new WSUtils_1.WSUtilsWeb(mockEngine, wsRoot, vault);
        const { siteUrl, assetsPrefix, siteIndex, enablePrettyLinks } = getTestPublishingConfig({ enablePrettyLinks: false });
        const siteUtils = new SiteUtilsWeb_1.SiteUtilsWeb(siteUrl, siteIndex, assetsPrefix, enablePrettyLinks);
        const vaultStub = ts_sinon_1.default
            .stub(wsUtils, "getVaultFromDocument")
            .returns(vault[0]);
        const NoteStub = ts_sinon_1.default.stub(wsUtils, "getNoteFromDocument").resolves([foo]);
        const cmd = new CopyNoteURLCmd_1.CopyNoteURLCmd(wsUtils, new DummyTelemetryClient_1.DummyTelemetryClient(), siteUtils);
        const activeTextEditorStub = ts_sinon_1.default
            .stub(cmd, "getActiveTextEditor")
            .returns("fakeEditor");
        const link = await cmd.run();
        (0, assert_1.default)(link?.includes(".html"));
        vaultStub.restore();
        NoteStub.restore();
        activeTextEditorStub.restore();
    });
    test("WHEN enablePrettylinks is set to true, THEN link must not have .html", async () => {
        const wsUtils = new WSUtils_1.WSUtilsWeb(mockEngine, wsRoot, vault);
        const { siteUrl, assetsPrefix, siteIndex, enablePrettyLinks } = getTestPublishingConfig({ enablePrettyLinks: true });
        const siteUtils = new SiteUtilsWeb_1.SiteUtilsWeb(siteUrl, siteIndex, assetsPrefix, enablePrettyLinks);
        const vaultStub = ts_sinon_1.default
            .stub(wsUtils, "getVaultFromDocument")
            .returns(vault[0]);
        const NoteStub = ts_sinon_1.default.stub(wsUtils, "getNoteFromDocument").resolves([foo]);
        const cmd = new CopyNoteURLCmd_1.CopyNoteURLCmd(wsUtils, new DummyTelemetryClient_1.DummyTelemetryClient(), siteUtils);
        const activeTextEditorStub = ts_sinon_1.default
            .stub(cmd, "getActiveTextEditor")
            .returns("fakeEditor");
        const link = await cmd.run();
        assert_1.default.strictEqual(link?.indexOf(".html"), -1);
        vaultStub.restore();
        NoteStub.restore();
        activeTextEditorStub.restore();
    });
    test("WHEN command is called on root note THEN note id should not be present", async () => {
        const wsUtils = new WSUtils_1.WSUtilsWeb(mockEngine, wsRoot, vault);
        const { siteUrl, assetsPrefix, siteIndex, enablePrettyLinks } = getTestPublishingConfig({});
        const siteUtils = new SiteUtilsWeb_1.SiteUtilsWeb(siteUrl, siteIndex, assetsPrefix, enablePrettyLinks);
        foo.fname = "root";
        const vaultStub = ts_sinon_1.default
            .stub(wsUtils, "getVaultFromDocument")
            .returns(vault[0]);
        const NoteStub = ts_sinon_1.default.stub(wsUtils, "getNoteFromDocument").resolves([foo]);
        const cmd = new CopyNoteURLCmd_1.CopyNoteURLCmd(wsUtils, new DummyTelemetryClient_1.DummyTelemetryClient(), siteUtils);
        const activeTextEditorStub = ts_sinon_1.default
            .stub(cmd, "getActiveTextEditor")
            .returns("fakeEditor");
        const link = await cmd.run();
        assert_1.default.strictEqual(link, "https://foo.com");
        vaultStub.restore();
        NoteStub.restore();
        activeTextEditorStub.restore();
    });
});
//# sourceMappingURL=CopyNoteURLCmd.test.js.map