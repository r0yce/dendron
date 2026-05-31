import { SchemaModuleProps, SchemaQuickInput } from "@dendronhq/common-all";
import { Uri } from "vscode";
import { DendronQuickPickerV2 } from "../components/lookup/types";
import { BaseCommand } from "./base";
import { ILookupControllerV3 } from "../components/lookup/LookupControllerV3Interface";
import { ILookupProviderV3 } from "../components/lookup/LookupProviderV3Interface";
type CommandRunOpts = {
    initialValue?: string;
    noConfirm?: boolean;
};
type CommandGatherOutput = {
    quickpick: DendronQuickPickerV2;
    controller: ILookupControllerV3;
    provider: ILookupProviderV3;
    noConfirm?: boolean;
    fuzzThreshold?: number;
};
type CommandOpts = {
    selectedItems: readonly SchemaQuickInput[];
} & CommandGatherOutput;
export type CommandOutput = {
    quickpick: DendronQuickPickerV2;
    controller: ILookupControllerV3;
    provider: ILookupProviderV3;
};
type OnDidAcceptReturn = {
    uri: Uri;
    node: SchemaModuleProps;
    resp?: any;
};
export declare class SchemaLookupCommand extends BaseCommand<CommandOpts, CommandOutput, CommandGatherOutput, CommandRunOpts> {
    key: string;
    protected _controller: ILookupControllerV3 | undefined;
    protected _provider: ILookupProviderV3 | undefined;
    constructor();
    protected get controller(): ILookupControllerV3;
    protected get provider(): ILookupProviderV3;
    gatherInputs(opts?: CommandRunOpts): Promise<CommandGatherOutput>;
    enrichInputs(opts: CommandGatherOutput): Promise<CommandOpts | undefined>;
    acceptItem(item: SchemaQuickInput): Promise<OnDidAcceptReturn | undefined>;
    acceptExistingSchemaItem(item: SchemaQuickInput): Promise<OnDidAcceptReturn | undefined>;
    acceptNewSchemaItem(): Promise<OnDidAcceptReturn | undefined>;
    execute(opts: CommandOpts): Promise<CommandOpts>;
    cleanUp(): void;
}
export {};
