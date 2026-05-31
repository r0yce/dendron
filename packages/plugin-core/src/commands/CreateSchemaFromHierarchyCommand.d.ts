import { DVault, NotePropsMeta } from "@dendronhq/common-all";
import { Uri } from "vscode";
import { BasicCommand } from "./base";
type CommandOpts = {
    candidates?: readonly SchemaCandidate[];
    schemaName?: string;
    hierarchyLevel?: HierarchyLevel;
    uri?: Uri;
    isHappy: boolean;
    stopReason?: StopReason;
};
type CommandOutput = {
    successfullyCreated: boolean;
};
/**
 * Represents the level of the file hierarchy that will have the '*' pattern.
 * */
export declare class HierarchyLevel {
    label: string;
    hierarchyTokens: string[];
    idx: number;
    noteMatchRegex: RegExp;
    constructor(idx: number, tokens: string[]);
    /** Id of the first token of the hierarchy (will be utilized for identifying the schema) */
    topId(): string | undefined;
    tokenize(fname: string): string[];
    isCandidateNote(fname: string): boolean;
    getDefaultSchemaName(): string;
}
export declare class Hierarchy {
    fname: string;
    levels: HierarchyLevel[];
    tokens: string[];
    constructor(fname: string);
    depth(): number;
    topId(): string | undefined;
    /**
     * Levels of the hierarchy that we deem as viable options for creating a schema for.
     * We remove the first level since having something like `*.h1.h2` with `*` at the
     * beginning will match all hierarchies. Therefore we slice off the first level.
     *
     * */
    getSchemaebleLevels(): HierarchyLevel[];
}
export type SchemaCandidate = {
    note: NotePropsMeta;
    label: string;
    detail: string;
};
export declare enum StopReason {
    SCHEMA_WITH_TOP_ID_ALREADY_EXISTS = "SCHEMA_WITH_TOP_ID_ALREADY_EXISTS",
    NOTE_DID_NOT_HAVE_REQUIRED_DEPTH = "NOTE_DID_NOT_HAVE_REQUIRED_DEPTH",
    DID_NOT_PICK_HIERARCHY_LEVEL = "DID_NOT_PICK_HIERARCHY_LEVEL",
    CANCELLED_PATTERN_SELECTION = "CANCELLED_PATTERN_SELECTION",
    UNSELECTED_ALL_PATTERNS = "UNSELECTED_ALL_PATTERNS",
    DID_NOT_PICK_SCHEMA_FILE_NAME = "DID_NOT_PICK_SCHEMA_FILE_NAME"
}
type HierarchyLevelRes = {
    hierarchyLevel?: HierarchyLevel;
    stopReason?: StopReason;
};
type PatternsFromCandidateRes = {
    pickedCandidates?: readonly SchemaCandidate[];
    stopReason?: StopReason;
};
/**
 * Encapsulates methods that are responsible for user interaction when
 * asking user for input data.
 * */
export declare class UserQueries {
    static promptUserForSchemaFileName(hierarchyLevel: HierarchyLevel, vault: DVault): Promise<string | undefined>;
    static promptUserToSelectHierarchyLevel(currDocFsPath: string): Promise<HierarchyLevelRes>;
    static promptUserToPickPatternsFromCandidates(labeledCandidates: SchemaCandidate[]): Promise<PatternsFromCandidateRes>;
    static determineAfterSelect(prevSelected: readonly SchemaCandidate[], currSelected: readonly SchemaCandidate[], all: SchemaCandidate[]): SchemaCandidate[];
    static determineAfterUnselect(prevSelected: readonly SchemaCandidate[], currSelected: readonly SchemaCandidate[]): SchemaCandidate[];
    static hasSelected(prevSelected: readonly SchemaCandidate[], currSelected: readonly SchemaCandidate[]): boolean;
    static hasUnselected(prevSelected: readonly SchemaCandidate[], currSelected: readonly SchemaCandidate[]): boolean;
    /** Finds the item from previously selected that is not selected anymore. */
    static findUncheckedItem(prevSelected: readonly SchemaCandidate[], currSelected: readonly SchemaCandidate[]): SchemaCandidate | undefined;
    /** Finds newly selected item.*/
    static findCheckedItem(prevSelected: readonly SchemaCandidate[], currSelected: readonly SchemaCandidate[]): SchemaCandidate | undefined;
}
/**
 * Responsible for forming the schema body from the hierarchical files that user chose. */
export declare class SchemaCreator {
    static makeSchemaBody({ candidates, hierarchyLevel, }: {
        candidates: readonly SchemaCandidate[];
        hierarchyLevel: HierarchyLevel;
    }): string;
}
export declare class CreateSchemaFromHierarchyCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    sanityCheck(): Promise<"No note document open. Must have note document open for Create Schema from Hierarchy command." | undefined>;
    gatherInputs(): Promise<CommandOpts | undefined>;
    private getHierarchyCandidates;
    private filterDistinctLabel;
    formatSchemaCandidates(noteCandidates: NotePropsMeta[], hierarchyLevel: HierarchyLevel): SchemaCandidate[];
    execute({ candidates, hierarchyLevel, uri, isHappy, }: CommandOpts): Promise<CommandOutput>;
    addAnalyticsPayload(opts?: CommandOpts, out?: CommandOutput): any;
}
export {};
