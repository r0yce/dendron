import * as vscode from "vscode";
/**
 * Gets an anonymous ID for use in telemetry. If no anonymous ID exists yet,
 * then a new one is generated, stored, then returned.
 * @param storage
 * @returns
 */
export declare function getAnonymousId(context: vscode.ExtensionContext): string;
