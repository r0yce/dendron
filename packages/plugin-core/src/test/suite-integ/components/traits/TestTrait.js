"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestTrait = void 0;
/**
 * A Trait class for testing purposes
 */
class TestTrait {
    TEST_NAME_MODIFIER = "Test Name Modifier";
    TEST_TITLE_MODIFIER = "Test Title Modifier";
    template;
    constructor(template) {
        this.template = template;
    }
    id = "test-trait";
    OnWillCreate = {
        setNameModifier: () => {
            return {
                name: this.TEST_NAME_MODIFIER,
                promptUserForModification: false,
            };
        },
    };
    OnCreate = {
        setTitle: () => {
            return this.TEST_TITLE_MODIFIER;
        },
        setTemplate: () => {
            return this.template;
        },
    };
}
exports.TestTrait = TestTrait;
//# sourceMappingURL=TestTrait.js.map