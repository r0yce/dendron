import { NoteProps } from "@dendronhq/common-all";
import { ExportPodFactory, ExportPodV2, JSONSchemaType, PodExportScope, RunnablePodConfigV2 } from "@dendronhq/pods-core";
import * as vscode from "vscode";
import { HierarchySelector } from "../../components/lookup/HierarchySelector";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { BaseCommand } from "../base";
/**
 * Abstract base class for export pod commands. This class will defer input
 * gathering to derived classes.  In EnrichInputs(), it is responsible for
 * gathering the appropriate input payload. Finally, in execute(), it will
 * construct the derived class' corresponding Pod, and invoke the appropriate
 * export() function based on the specified export scope.
 * @template Config - the type of {@link RunnablePodConfigV2} for the export operation
 * @template R - the return type of the export() operation
 */
export declare abstract class BaseExportPodCommand<Config extends RunnablePodConfigV2, R> extends BaseCommand<{
    config: Config;
    payload: NoteProps[];
}, any, Config, Partial<Config>> implements ExportPodFactory<Config, R>, vscode.Disposable {
    private hierarchySelector;
    private _onEngineNoteStateChangedDisposable;
    extension: IDendronExtension;
    /**
     *
     * @param hierarchySelector a user control that can return a selected
     * hierarchy to export. Should use {@link QuickPickHierarchySelector} by
     * default
     */
    constructor(hierarchySelector: HierarchySelector, extension: IDendronExtension);
    /**
     * Provide a pod factory method to instantiate the pod instance with the
     * passed in configuration
     * @param config
     */
    abstract createPod(config: Config): ExportPodV2<R>;
    /**
     * Provide a method to get ajv schema of runnable pod config
     */
    abstract getRunnableSchema(): JSONSchemaType<Config>;
    /**
     * checks if the destination is compatible with export scope
     */
    multiNoteExportCheck(opts: {
        destination: string;
        exportScope: PodExportScope;
    }): void;
    dispose(): void;
    /**
     * Gather the appropriate input payload based on the specified export scope.
     * @param inputs
     * @returns
     */
    enrichInputs(inputs: Config): Promise<{
        config: Config;
        payload: NoteProps[];
    } | undefined>;
    /**
     * Construct the pod and perform export for the appropriate payload scope.
     * @param opts
     */
    execute(opts: {
        config: Config;
        payload: NoteProps[];
    }): Promise<void>;
    /**
     * Executed after export is complete. If multiple notes are being exported,
     * this is invoked on each exported note.
     * @param param0
     */
    abstract onExportComplete({ exportReturnValue, payload, config, }: {
        exportReturnValue: R;
        payload: NoteProps[];
        config: Config;
    }): Promise<void | string>;
    /**
     * Gets notes matching the selected hierarchy(for a specefic vault)
     * @returns
     */
    private getPropsForHierarchyScope;
    /**
     * If the active text editor document has dirty changes, save first before exporting
     * @returns True if document is dirty, false otherwise
     */
    private saveActiveDocumentBeforeExporting;
    private executeExportNotes;
    private getPropsForNoteScope;
    /**
     *
     * @returns all notes in the workspace
     */
    private getPropsForWorkspaceScope;
    /**
     *
     * @returns all notes in the vault
     */
    private getPropsForVaultScope;
    addAnalyticsPayload(opts: {
        config: Config;
        payload: NoteProps[];
    }): {
        exportScope: PodExportScope;
    } | undefined;
    getPropsForSelectionScope(payload?: NoteProps[]): Promise<NoteProps[] | undefined>;
}
