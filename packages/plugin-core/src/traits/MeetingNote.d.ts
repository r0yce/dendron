import { DendronConfig, NoteTrait, onWillCreateProps } from "@dendronhq/common-all";
import { IDendronExtension } from "../dendronExtensionInterface";
export declare class MeetingNote implements NoteTrait {
    id: string;
    getTemplateType: any;
    _config: DendronConfig;
    _ext: IDendronExtension;
    _noConfirm: boolean;
    constructor(config: DendronConfig, ext: IDendronExtension, noConfirm?: boolean);
    get OnWillCreate(): onWillCreateProps;
}
