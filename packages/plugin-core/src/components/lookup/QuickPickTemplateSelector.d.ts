import { DLogger, NoteProps } from "@dendronhq/common-all";
export declare class QuickPickTemplateSelector {
    getTemplate(opts: {
        logger?: DLogger;
        providerId?: string;
    }): Promise<NoteProps | undefined>;
}
