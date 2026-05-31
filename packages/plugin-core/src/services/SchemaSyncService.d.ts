import vscode, { Uri } from "vscode";
import { ISchemaSyncService } from "./SchemaSyncServiceInterface";
import { IDendronExtension } from "../dendronExtensionInterface";
import { WriteSchemaResp } from "@dendronhq/common-all";
/** Currently responsible for keeping the engine in sync with schema
 *  changes on disk. */
export declare class SchemaSyncService implements ISchemaSyncService {
    private extension;
    constructor(extension: IDendronExtension);
    onDidSave({ document }: {
        document: vscode.TextDocument;
    }): Promise<void>;
    saveSchema({ uri, isBrandNewFile, }: {
        uri: Uri;
        isBrandNewFile?: boolean;
    }): Promise<WriteSchemaResp[] | undefined>;
}
