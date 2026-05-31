"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const inject_1 = require("../../../../di/inject");
const DendronEngineV3Web_1 = require("../../../engine/DendronEngineV3Web");
const PluginNoteRenderer_1 = require("../../../engine/PluginNoteRenderer");
const setupTestEngineContainer_1 = require("../../helpers/setupTestEngineContainer");
async function initializeTest() {
    const pubConfig = {
        copyAssets: false,
        siteHierarchies: [],
        enableSiteLastModified: false,
        siteRootDir: "",
        enableFrontmatterTags: false,
        enableHashesForFMTags: false,
        writeStubs: false,
        seo: {
            title: undefined,
            description: undefined,
            author: undefined,
            twitter: undefined,
            image: undefined,
        },
        github: {
            cname: undefined,
            enableEditLink: false,
            editLinkText: undefined,
            editBranch: undefined,
            editViewMode: undefined,
            editRepository: undefined,
        },
        enablePrettyLinks: false,
    };
    const config = {
        version: 5,
        publishing: pubConfig,
    };
    await (0, setupTestEngineContainer_1.setupTestEngineContainer)();
    const engine = inject_1.container.resolve(DendronEngineV3Web_1.DendronEngineV3Web);
    await engine.init();
    return new PluginNoteRenderer_1.PluginNoteRenderer(config, engine, []);
}
suite("GIVEN a PluginNoteRenderer", () => {
    test("WHEN a basic note is rendered THEN the right HTML is returned", async () => {
        const renderer = await initializeTest();
        const vault = {
            fsPath: "foo",
        };
        const testNote = {
            fname: "foo",
            id: "foo",
            title: "foo",
            desc: "foo",
            links: [],
            anchors: {},
            type: "note",
            updated: 1,
            created: 1,
            parent: "root",
            children: [],
            data: "test_data",
            body: "this is the body",
            vault,
        };
        const result = await renderer.renderNote({ id: "foo", note: testNote });
        assert_1.default.strictEqual(result.data, '<h1 id="foo">foo</h1>\n<p>this is the body</p>');
    });
    test("WHEN a wikilink is rendered THEN the HTML contains the proper link info", async () => {
        const renderer = await initializeTest();
        const vault = {
            fsPath: "foo",
        };
        const testNote = {
            fname: "foo",
            id: "foo",
            title: "foo",
            desc: "foo",
            links: [],
            anchors: {},
            type: "note",
            updated: 1,
            created: 1,
            parent: "root",
            children: [],
            data: "test_data",
            body: "[[bar]]",
            vault,
        };
        const result = await renderer.renderNote({ id: "foo", note: testNote });
        (0, assert_1.default)(result.data?.includes(`<a href="bar.html">Bar</a>`));
    });
});
//# sourceMappingURL=PluginNoteRenderer.test.js.map