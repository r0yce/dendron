import { DVault } from "@dendronhq/common-all";
import { DLogger } from "@dendronhq/common-server";
import { CopyAsFormat, ExportPodConfigurationV2, ExternalService, ExternalTarget, PodExportScope, PodV2Types } from "@dendronhq/pods-core";
import * as vscode from "vscode";
import { NoteLookupProviderSuccessResp } from "../lookup/LookupProviderV3Interface";
/**
 * Contains VSCode UI controls for common Pod UI operations
 */
export declare class PodUIControls {
    /**
     * Prompts the user with a quick-pick to select a {@link ExportPodConfigurationV2}
     * by its podId. Furthermore, there is an option to create a new export
     * configuration intead.
     * @returns
     */
    static promptForExportConfigOrNewExport(): Promise<Pick<ExportPodConfigurationV2, "podId"> | "New Export" | undefined>;
    /**
     * Prompts user with a quick pick to specify the {@link PodExportScope}
     */
    static promptForExportScope(): Promise<PodExportScope | undefined>;
    /**
     * Ask the user if they want to save their input choices as a new pod config,
     * enabling them to run it again later.
     * @returns a pod ID for the new config if they want to save it, false if they
     * don't want to save it, or undefined if they closed out the quick pick.
     */
    static promptToSaveInputChoicesAsNewConfig(): Promise<false | string | undefined>;
    /**
     * Get a generic ID from the user through a quick input box.
     * @returns
     */
    static promptForGenericId(): Promise<string | undefined>;
    /**
     * Prompt user to pick a pod (v2) type
     * @returns a runnable code command for the selected pod
     */
    static promptForPodType(): Promise<PodV2Types | undefined>;
    /**
     * Prompt user to pick an {@link ExternalService}
     * @returns
     */
    static promptForExternalServiceType(): Promise<ExternalService | undefined>;
    /**
     * Prompt user to pick an existing service connection, or to create a new one.
     * @returns
     */
    static promptForExternalServiceConnectionOrNew<T extends ExternalTarget>(connectionType: ExternalService): Promise<undefined | T>;
    static createNewServiceConfig(connectionType: ExternalService): Promise<void>;
    /**
     * Ask the user to pick an ID for a new service connection. The connection
     * file will be opened in the editor.
     * @param serviceType
     * @returns
     */
    static promptToCreateNewServiceConfig(serviceType: ExternalService): Promise<string | undefined>;
    /**
     * Prompts a lookup control that allows user to select notes for export.
     * @param fromSelection set this flag to true if we are using {@link PodExportScope.LinksInSelection}
     * @param key key of the command. this will be used for lookup provider subscription.
     * @param logger logger object used by the command.
     * @returns
     */
    static promptForScopeLookup(opts: {
        fromSelection?: boolean;
        key: string;
        logger: DLogger;
    }): Promise<NoteLookupProviderSuccessResp | undefined>;
    /**
     * Prompt to select vault
     * @returns vault
     *
     */
    static promptForVaultSelection(): Promise<DVault | undefined>;
    private static getExportConfigChooserQuickPick;
    /**
     * Prompt the user via Quick Pick(s) to select the destination of the export
     * @returns
     */
    static promptUserForDestination(exportScope: PodExportScope, options: vscode.OpenDialogOptions): Promise<"clipboard" | string | undefined>;
    /**
     * Small helper method to get descriptions for {@link promptForExportScope}
     * @param scope
     * @returns
     */
    private static getDescriptionForScope;
    /**
     * Small helper method to get descriptions for {@link promptForExportScope}
     * @param type
     * @returns
     */
    private static getDescriptionForPodType;
    /**
     * Prompt user to select custom pod Id
     */
    static promptToSelectCustomPodId(): Promise<string | undefined>;
    /**
     * Prompt user to select the copy as format
     */
    static promptToSelectCopyAsFormat(): Promise<CopyAsFormat | undefined>;
}
