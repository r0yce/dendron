import _ from "lodash";
import { Diagnostic, Uri } from "vscode";
/** Delay displaying any warnings while the user is still typing.
 *
 * The user is considered to have stopped typing if they didn't type anything after 500ms.
 */
export declare const delayedFrontmatterWarning: _.DebouncedFunc<(uri: Uri, diagnostics: Diagnostic[]) => void>;
