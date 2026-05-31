import { ServerUtils } from "@dendronhq/api-server";
import { DendronConfig, InstallStatus } from "@dendronhq/common-all";
import { WorkspaceService } from "@dendronhq/engine-server";
import { ExecaChildProcess } from "execa";
import * as vscode from "vscode";
import { IDendronExtension } from "../dendronExtensionInterface";
import { IBaseCommand } from "../types";
export declare class ExtensionUtils {
    static activate(): Promise<any>;
    static addCommand: ({ context, key, cmd, existingCommands, }: {
        context: vscode.ExtensionContext;
        key: string;
        cmd: IBaseCommand;
        existingCommands: string[];
    }) => void;
    static getExtension(): vscode.Extension<any>;
    static _TUTORIAL_IDS: Set<string> | undefined;
    static getTutorialIds(): Set<string>;
    static setWorkspaceContextOnActivate(dendronConfig: DendronConfig): void;
    /**
     * Setup segment client
     * Also setup cache flushing in case of missed uploads
     */
    static startServerProcess({ context, start, wsService, onExit, }: {
        context: vscode.ExtensionContext;
        wsService: WorkspaceService;
        start: [number, number];
        onExit: Parameters<typeof ServerUtils["onProcessExit"]>[0]["cb"];
    }): Promise<{
        port: number;
        subprocess: ExecaChildProcess | undefined;
    }>;
    static getAndTrackInstallStatus({ UUIDPathExists, previousGlobalVersion, currentVersion, }: {
        UUIDPathExists: boolean;
        currentVersion: string;
        previousGlobalVersion: string;
    }): {
        extensionInstallStatus: InstallStatus;
        isSecondaryInstall: boolean;
    };
    /**
     * Analytics related to initializing the workspace
     * @param param0
     */
    static trackWorkspaceInit({ durationReloadWorkspace, ext, activatedSuccess, }: {
        durationReloadWorkspace: number;
        ext: IDendronExtension;
        activatedSuccess: boolean;
    }): Promise<void>;
    /**
     * Try to infer install code instance age from extension path
     * this will not be accurate in dev mode because the extension install path is the monorepo.
     * return the creation time and lapsed time in weeks
     */
    static getCodeFolderCreated(opts: {
        context: vscode.ExtensionContext;
    }): {
        codeFolderCreated: number;
        ageOfCodeInstallInWeeks: number;
    } | {
        codeFolderCreated?: never;
        ageOfCodeInstallInWeeks?: never;
    };
}
