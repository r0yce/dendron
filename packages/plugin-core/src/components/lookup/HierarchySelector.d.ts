import { DVault } from "@dendronhq/common-all";
/**
 * Interface for a user (or test mock) control for selecting a hierarchy. Mostly
 * exposed for testing purposes.
 */
export interface HierarchySelector {
    /**
     * A method for getting the hierarchy in an async manner. Returning undefined
     * should be interpreted that no hierarchy was selected. It also returns the
     * vault of selected hierarchy.
     */
    getHierarchy(): Promise<{
        hierarchy: string;
        vault: DVault;
    } | undefined>;
}
/**
 * Implementation of HierarchySelector that prompts user to with a lookup
 * controller V3.
 */
export declare class QuickPickHierarchySelector implements HierarchySelector {
    getHierarchy(): Promise<{
        hierarchy: string;
        vault: DVault;
    } | undefined>;
}
