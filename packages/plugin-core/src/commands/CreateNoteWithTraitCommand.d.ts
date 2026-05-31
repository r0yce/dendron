import { DVault, NoteTrait } from "@dendronhq/common-all";
import { IDendronExtension } from "../dendronExtensionInterface";
import { BaseCommand } from "./base";
export type CommandOpts = {
    fname: string;
    vaultOverride?: DVault;
};
export type CommandInput = {
    fname: string;
};
export declare class CreateNoteWithTraitCommand extends BaseCommand<CommandOpts, any, CommandInput> {
    key: string;
    private _trait;
    private initTrait;
    protected _extension: IDendronExtension;
    constructor(ext: IDendronExtension, commandId: string, trait: NoteTrait | (() => NoteTrait));
    private get trait();
    gatherInputs(): Promise<CommandInput | undefined>;
    enrichInputs(inputs: CommandInput): Promise<{
        title: string;
        fname: string;
    }>;
    execute(opts: CommandOpts): Promise<any>;
    private getNoteNameFromLookup;
    private getCreateContext;
}
