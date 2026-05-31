"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const assert_1 = __importDefault(require("assert"));
const inject_1 = require("../../../../../di/inject");
const DendronEngineV3Web_1 = require("../../../../engine/DendronEngineV3Web");
const EngineNoteProvider_1 = require("../../../../../views/common/treeview/EngineNoteProvider");
const setupTestEngineContainer_1 = require("../../../helpers/setupTestEngineContainer");
async function initializeEngineNoteProviderTest() {
    await (0, setupTestEngineContainer_1.setupTestEngineContainer)();
    const engine = inject_1.container.resolve(DendronEngineV3Web_1.DendronEngineV3Web);
    await engine.init();
}
suite("GIVEN an EngineNoteProvider", () => {
    test("WHEN the tree is revealed as part of initialization THEN the right nodes structure is returned", async () => {
        await initializeEngineNoteProviderTest();
        const noteProvider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
        // An argument-less getChildren() call is always necessary to first
        // initialize the tree (this mirrors what vscode internals will do)
        const root = await noteProvider.getChildren();
        assert_1.default.strictEqual(root?.length, 1);
        assert_1.default.strictEqual(root[0], "root");
        const rootChildren = await noteProvider.getChildren("root");
        assert_1.default.strictEqual(rootChildren?.length, 3);
        const fooChildren = await noteProvider.getChildren("foo");
        assert_1.default.strictEqual(fooChildren?.length, 2);
        const fooCh1Children = await noteProvider.getChildren("foo.ch1");
        assert_1.default.strictEqual(fooCh1Children?.length, 2);
        const fooCh2Children = await noteProvider.getChildren("foo.ch2");
        assert_1.default.strictEqual(fooCh2Children?.length, 0);
    });
    test("WHEN an unresolved node is prepped for reveal() THEN the ancestor chain is valid", async () => {
        await initializeEngineNoteProviderTest();
        const noteProvider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
        const root = await noteProvider.getChildren();
        assert_1.default.strictEqual(root?.length, 1);
        assert_1.default.strictEqual(root[0], "root");
        await noteProvider.prepNodeForReveal("bar.ch1.gch1.ggch1");
        assert_1.default.strictEqual(await noteProvider.getParent("bar.ch1.gch1.ggch1"), "bar.ch1.gch1");
        assert_1.default.strictEqual("bar.ch1", await noteProvider.getParent("bar.ch1.gch1"));
        assert_1.default.strictEqual("bar", await noteProvider.getParent("bar.ch1"));
        assert_1.default.strictEqual("root", await noteProvider.getParent("bar"));
    });
    test("WHEN TreeItems are retrieved THEN correctly labeled items are returned", async () => {
        await initializeEngineNoteProviderTest();
        const noteProvider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
        // Add nodes to provider cache:
        await noteProvider.getChildren();
        await noteProvider.getChildren("foo");
        const rootTreeItem = await noteProvider.getTreeItem("root");
        assert_1.default.strictEqual(rootTreeItem.id, "root");
        assert_1.default.strictEqual(rootTreeItem.label, "root (vault1)");
        const fooTreeItem = await noteProvider.getTreeItem("foo");
        assert_1.default.strictEqual(fooTreeItem.id, "foo");
        assert_1.default.strictEqual(fooTreeItem.label, "foo");
    });
    test("WHEN label types are changed THEN item labels get updated", async () => {
        await initializeEngineNoteProviderTest();
        const noteProvider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
        // Add nodes to provider cache:
        await noteProvider.getChildren();
        await noteProvider.getChildren("foo");
        const fooTreeItem = await noteProvider.getTreeItem("foo");
        assert_1.default.strictEqual(fooTreeItem.label, "foo");
        await noteProvider.updateLabelType({
            labelType: common_all_1.TreeViewItemLabelTypeEnum.title,
        });
        const updatedFooTreeItem = await noteProvider.getTreeItem("foo");
        assert_1.default.strictEqual(updatedFooTreeItem.label, "Foo"); // The Title is capitalized
    });
});
//# sourceMappingURL=EngineNoteProvider.test.js.map