"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ButtonTypes_1 = require("../../components/lookup/ButtonTypes");
const mocha_1 = require("mocha");
const testUtilsv2_1 = require("../testUtilsv2");
suite("buttons tests", () => {
    (0, mocha_1.describe)(`canToggle tests:`, () => {
        (0, mocha_1.describe)(`GIVEN pressed button that is NOT allowed to be toggled`, () => {
            let dendronBtn;
            (0, mocha_1.beforeEach)(() => {
                dendronBtn = new ButtonTypes_1.DendronBtn({
                    pressed: true,
                    canToggle: false,
                    iconOff: "icon-off-val",
                    iconOn: "icon-on-val",
                    type: "horizontal",
                    description: "test description",
                    title: "title-val",
                });
            });
            (0, mocha_1.describe)(`WHEN toggle invoked.`, () => {
                (0, mocha_1.beforeEach)(() => {
                    dendronBtn.toggle();
                });
                (0, mocha_1.it)(`THEN pressed val stays the same.`, () => {
                    (0, testUtilsv2_1.expect)(dendronBtn.pressed).toEqual(true);
                });
                (0, mocha_1.it)(`THEN icon is set to on icon.`, () => {
                    (0, testUtilsv2_1.expect)(dendronBtn.iconPath.id).toEqual("icon-on-val");
                });
            });
        });
        (0, mocha_1.describe)(`GIVEN pressed button that is allowed to be toggled`, () => {
            let dendronBtn;
            (0, mocha_1.beforeEach)(() => {
                dendronBtn = new ButtonTypes_1.DendronBtn({
                    pressed: true,
                    canToggle: true,
                    iconOff: "icon-off-val",
                    iconOn: "icon-on-val",
                    type: "horizontal",
                    description: "test description",
                    title: "title-val",
                });
            });
            (0, mocha_1.describe)(`WHEN toggle invoked.`, () => {
                (0, mocha_1.beforeEach)(() => {
                    dendronBtn.toggle();
                });
                (0, mocha_1.it)(`THEN pressed val is flipped.`, () => {
                    (0, testUtilsv2_1.expect)(dendronBtn.pressed).toEqual(false);
                });
                (0, mocha_1.it)(`THEN icon is set to off icon.`, () => {
                    (0, testUtilsv2_1.expect)(dendronBtn.iconPath.id).toEqual("icon-off-val");
                });
            });
        });
    });
});
//# sourceMappingURL=buttons.test.js.map