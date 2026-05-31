import { ILookupProviderOptsV3, ILookupProviderV3, INoteLookupProviderFactory, ISchemaLookupProviderFactory } from "./LookupProviderV3Interface";
import { NoteLookupProvider } from "./NoteLookupProvider";
import { IDendronExtension } from "../../dendronExtensionInterface";
export declare class NoteLookupProviderFactory implements INoteLookupProviderFactory {
    private extension;
    constructor(extension: IDendronExtension);
    create(id: string, opts: ILookupProviderOptsV3): NoteLookupProvider;
}
export declare class SchemaLookupProviderFactory implements ISchemaLookupProviderFactory {
    private extension;
    constructor(extension: IDendronExtension);
    create(id: string, opts: ILookupProviderOptsV3): ILookupProviderV3;
}
