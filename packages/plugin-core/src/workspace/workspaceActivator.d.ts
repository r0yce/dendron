import "reflect-metadata";
import { DWorkspaceV2, RespV3 } from "@dendronhq/common-all";
import { WorkspaceService } from "@dendronhq/engine-server";
import * as vscode from "vscode";
import { IDendronExtension } from "../dendronExtensionInterface";
import { EngineAPIService } from "../services/EngineAPIService";
import { DendronCodeWorkspace } from "./codeWorkspace";
import { DendronNativeWorkspace } from "./nativeWorkspace";
import { WorkspaceInitializer } from "./workspaceInitializer";
export declare function trackTopLevelRepoFound(opts: {
    wsService: WorkspaceService;
}): Promise<{
    protocol: string;
    provider: string | undefined;
    path: string;
} | undefined>;
type WorkspaceActivatorValidateOpts = {
    ext: IDendronExtension;
    context: vscode.ExtensionContext;
};
type WorkspaceActivatorOpts = {
    ext: IDendronExtension;
    context: vscode.ExtensionContext;
    wsRoot: string;
    workspaceInitializer?: WorkspaceInitializer;
};
type WorkspaceActivatorSkipOpts = {
    opts?: Partial<{
        /**
         * Skip setting up language features (eg. code action providesr)
         */
        skipLanguageFeatures: boolean;
        /**
         * Skip automatic migrations on start
         */
        skipMigrations: boolean;
        /**
         * Skip surfacing dialogues on startup
         */
        skipInteractiveElements: boolean;
        /**
         * Skip showing tree view
         */
        skipTreeView: boolean;
    }>;
};
export declare class WorkspaceActivator {
    /**
     * Initialize workspace. All logic that happens before the engine is initialized happens here
     * - create workspace class
     * - register traits
     * - run migrations if necessary
     */
    init({ ext, context, wsRoot, opts, }: WorkspaceActivatorOpts & WorkspaceActivatorSkipOpts): Promise<RespV3<{
        workspace: DWorkspaceV2;
        engine: EngineAPIService;
        wsService: WorkspaceService;
    }>>;
    /**
     * Initialize engine and activate workspace watchers
     */
    activate({ ext, context, wsService, wsRoot, opts, workspaceInitializer, }: WorkspaceActivatorOpts & WorkspaceActivatorSkipOpts & {
        engine: EngineAPIService;
        wsService: WorkspaceService;
    }): Promise<RespV3<boolean>>;
    initCodeWorkspace({ context, wsRoot }: WorkspaceActivatorOpts): Promise<DendronCodeWorkspace>;
    initNativeWorkspace({ context, wsRoot }: WorkspaceActivatorOpts): Promise<DendronNativeWorkspace>;
    getOrPromptWsRoot({ ext, }: WorkspaceActivatorValidateOpts): Promise<string | undefined>;
    /**
     * Return true if we started a server process
     * @returns
     */
    verifyOrStartServerProcess({ ext, wsService, }: {
        ext: IDendronExtension;
        wsService: WorkspaceService;
    }): Promise<number>;
}
export {};
