import { InputArgCommand } from "./base";
export type CopyToClipboardCommandOpts = {
    text: string;
    source: CopyToClipboardSourceEnum;
    message?: string;
};
export declare enum CopyToClipboardSourceEnum {
    keybindingConflictPreview = "keybindingConflictPreview"
}
/**
 * This command is not accessible through the VSCode UI,
 * and only intended to be used as a proxy for copying arbitrary
 * text from the webview.
 *
 * e.g.)
 *
 * // you can use this in a markdown link to invoke commands
 * const commandUri = `command:dendron.copyToClipboard?${encodeURIComponent({
 *   text: "some text",
 *   message: "copied!"
 * })}`
 *
 * ...
 *
 * content = `[click this](${commandUri})`
 *
 */
export declare class CopyToClipboardCommand extends InputArgCommand<CopyToClipboardCommandOpts, void> {
    key: string;
    addAnalyticsPayload(opts: CopyToClipboardCommandOpts): {
        source: CopyToClipboardSourceEnum;
    };
    execute(opts: CopyToClipboardCommandOpts): Promise<void>;
}
