import { ExtensionContext } from "vscode";
import { WORKSPACE_ACTIVATION_CONTEXT } from "../constants";
type ExtensionGlobalState = ExtensionContext["globalState"];
type ExtensionWorkspaceState = ExtensionContext["workspaceState"];
/**
 * @deprecated All state service logic will be consolidated to {@link MetadataService}.
 * Consider using it instead if you need to add a new state to track.
 * Keeps track of workspace state
 */
export declare class StateService {
    globalState: ExtensionGlobalState;
    workspaceState: ExtensionWorkspaceState;
    constructor(opts: {
        globalState: ExtensionGlobalState;
        workspaceState: ExtensionWorkspaceState;
    });
    /**
     * @deprecated
     */
    static instance(): StateService;
    /**
     * @deprecated
     * Previous global version
     * Get from {@link ExtensionGlobalState} (VSCode specific state)
     */
    getGlobalVersion(): string;
    /**
     * @deprecated
     * Previous workspace version
     * Get from {@link ExtensionWorkspaceState}  (VSCode specific store)
     */
    getWorkspaceVersion(): string;
    /**
     * @deprecated
     */
    setGlobalVersion(version: string): Thenable<void>;
    /**
     * @deprecated
     */
    setWorkspaceVersion(version: string): Thenable<void>;
    /**
     * @deprecated
     */
    getActivationContext(): WORKSPACE_ACTIVATION_CONTEXT;
    /**
     * @deprecated
     */
    setActivationContext(context: WORKSPACE_ACTIVATION_CONTEXT): Thenable<void>;
    getMRUGoogleDocs(): Promise<string[] | undefined> | undefined;
    updateMRUGoogleDocs(value: any): Thenable<void>;
    /**
     * @deprecated
     * added generic method for cases when the keys and values both are dynamic
     * eg: hierarchy destination for imported google doc.
     */
    getGlobalState(key: string): Promise<string> | undefined;
    /**
     * @deprecated
     */
    updateGlobalState(key: string, value: any): Thenable<void>;
    resetGlobalState(): void;
    /**
     * @deprecated
     */
    resetWorkspaceState(): void;
}
export {};
