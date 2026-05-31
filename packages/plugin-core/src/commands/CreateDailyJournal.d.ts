import { IDendronExtension } from "../dendronExtensionInterface";
import { CommandOpts, CreateNoteWithTraitCommand } from "./CreateNoteWithTraitCommand";
export type CreateDailyJournalData = {
    isFirstTime: boolean;
    isTemplateCreated: boolean;
    isSchemaCreated: boolean;
};
export declare class CreateDailyJournalCommand extends CreateNoteWithTraitCommand {
    static requireActiveWorkspace: boolean;
    static DENDRON_TEMPLATES_FNAME: string;
    constructor(ext: IDendronExtension);
    execute(opts: CommandOpts): Promise<CreateDailyJournalData>;
    /**
     * Track whether new schema or template files were created
     */
    addAnalyticsPayload(_opts: CommandOpts, resp: CreateDailyJournalData): {
        resp: CreateDailyJournalData;
    };
    /**
     * Create the pre-canned schema so that we can apply a template to the user's
     * daily journal notes if the schema with the daily journal domain doesn't exist yet.
     *
     * @returns whether a new schema file was made
     */
    private makeSchemaFileIfNotExisting;
    /**
     * Create the pre-canned daily journal template file in the user's workspace if it
     * doesn't exist yet.
     *
     * @returns whether a new template file was made
     */
    private createTemplateFileIfNotExisting;
}
