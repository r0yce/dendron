"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const lodash_1 = __importDefault(require("lodash"));
const inject_1 = require("../../di/inject");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const setupLocalExtContainer_1 = require("../../injection-providers/setupLocalExtContainer");
const NativeTreeView_1 = require("../../views/common/treeview/NativeTreeView");
const testUtilsV3_1 = require("../testUtilsV3");
/**
 * This test suite ensures that all objects in main (_extension.ts) can be
 * properly resolved by the DI container from `setupLocalExtContainer`
 */
suite("GIVEN an injection container for the Dendron Local Extension configuration", () => {
    (0, testUtilsV3_1.describeSingleWS)("WHEN NativeTreeView is constructed ", { timeout: 1e6 }, () => {
        test("THEN valid objects are returned without exceptions", async () => {
            const { vaults, wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
            await (0, setupLocalExtContainer_1.setupLocalExtContainer)({ wsRoot, vaults, engine });
            try {
                const obj = inject_1.container.resolve(NativeTreeView_1.NativeTreeView);
                (0, assert_1.default)(!lodash_1.default.isUndefined(obj));
            }
            catch (error) {
                assert_1.default.fail(error);
            }
        });
    });
});
//# sourceMappingURL=setupLocalExtContainer.test.js.map