import { NoteTrait, onCreateProps, onWillCreateProps } from "@dendronhq/common-all";
/**
 * A Trait class for testing purposes
 */
export declare class TestTrait implements NoteTrait {
    TEST_NAME_MODIFIER: string;
    TEST_TITLE_MODIFIER: string;
    template: string;
    constructor(template: string);
    id: string;
    OnWillCreate: onWillCreateProps;
    OnCreate: onCreateProps;
}
