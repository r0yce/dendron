import { DendronConfig, NoteTrait, OnCreateContext, onCreateProps, SetNameModifierResp } from "@dendronhq/common-all";
export declare class JournalNote implements NoteTrait {
    id: string;
    getTemplateType: any;
    _config: DendronConfig;
    constructor(config: DendronConfig);
    get OnWillCreate(): {
        setNameModifier(this: {
            setNameModifier(this: any, _opts: OnCreateContext): SetNameModifierResp;
        }, _opts: OnCreateContext): SetNameModifierResp;
    };
    get OnCreate(): onCreateProps;
}
