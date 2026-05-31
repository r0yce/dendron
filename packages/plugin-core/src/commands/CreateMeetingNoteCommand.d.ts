import { IDendronExtension } from "../dendronExtensionInterface";
import { CommandOpts, CreateNoteWithTraitCommand } from "./CreateNoteWithTraitCommand";
type ExecuteData = {
    templateCreated: boolean;
    schemaCreated: boolean;
};
export declare class CreateMeetingNoteCommand extends CreateNoteWithTraitCommand {
    private _ext;
    static requireActiveWorkspace: boolean;
    static MEETING_TEMPLATE_FNAME: string;
    /**
     *
     * @param ext
     * @param noConfirm - for testing purposes only; don't set in production code
     */
    constructor(ext: IDendronExtension, noConfirm?: boolean);
    execute(opts: CommandOpts): Promise<ExecuteData>;
    /**
     * Track whether new schema or template files were created
     */
    addAnalyticsPayload(_opts: CommandOpts, resp: ExecuteData): {
        resp: ExecuteData;
    };
    /**
     * Create the pre-canned schema so that we can apply a template to the user's
     * meeting notes if the schema doesn't exist yet.
     * @returns whether a new schema file was made
     */
    private makeSchemaFileIfNotExisting;
    /**
     * Create the pre-canned meeting template file in the user's workspace if it
     * doesn't exist yet.
     * @returns whether a new template file was made
     */
    private createTemplateFileIfNotExisting;
}
export {};
