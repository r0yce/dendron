import { DMessage, VSCodeMessage } from "@dendronhq/common-all";
/**
 * Listen to vscode messages
 * @param setMsgHook
 */
export declare const useVSCodeMessage: (setMsgHook: (msg: VSCodeMessage) => void) => void;
export declare const postVSCodeMessage: (msg: DMessage) => void;
