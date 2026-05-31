import { NoteTrait, onCreateProps, onWillCreateProps } from "@dendronhq/common-all";
/**
 * A Note Trait that will execute end-user defined javascript code.
 */
export declare class UserDefinedTraitV1 implements NoteTrait {
    id: string;
    getTemplateType: any;
    scriptPath: string;
    OnCreate?: onCreateProps;
    OnWillCreate?: onWillCreateProps;
    /**
     *
     * @param traitId ID for the note type
     * @param scriptPath - path to the .js file that will be dynamically run
     */
    constructor(traitId: string, scriptPath: string);
    /**
     * This method needs to be called before a user defined trait's defined
     * methods will be invoked.
     */
    initialize(): Promise<void>;
    /**
     * Helper method that returns a modified form of the passed in function. The
     * modified form allows the function to access lodash and luxon modules as if
     * they were imported modules. It does this by temporarily modifying the
     * global Object prototype, which allows module access with '_.*' or 'luxon.*'
     * syntax
     * @param fn
     * @returns
     */
    private wrapFnWithRequiredModules;
}
