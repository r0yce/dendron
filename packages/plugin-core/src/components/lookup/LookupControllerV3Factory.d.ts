import { IDendronExtension } from "../../dendronExtensionInterface";
import { ILookupControllerV3, ILookupControllerV3Factory, LookupControllerV3CreateOpts } from "./LookupControllerV3Interface";
export declare class LookupControllerV3Factory implements ILookupControllerV3Factory {
    private extension;
    constructor(extension: IDendronExtension);
    create(opts?: LookupControllerV3CreateOpts): ILookupControllerV3;
}
