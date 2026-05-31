import { URI } from "vscode-uri";
export declare class WorkspaceHelpers {
    /**
     * Test helper function that creates a temporary directory to act as the
     * workspace root. This function works in the browser environment
     */
    static createTestWorkspaceDirectory(): Promise<URI>;
    static getWSRootForTest(): Promise<URI>;
    /**
     * Create a test Dendron YAML config file at the specified location
     * @param wsRoot
     * @param config
     */
    static createTestYAMLConfigFile(wsRoot: URI, config: any): Promise<void>;
}
