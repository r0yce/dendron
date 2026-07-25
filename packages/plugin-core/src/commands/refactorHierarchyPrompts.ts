/**
 * Input prompts + preview markdown for RefactorHierarchyCommandV2.
 */
import { DNodePropsQuickInputV2 } from "@dendronhq/common-all";
import _ from "lodash";
import path from "path";
import { Uri, ViewColumn, window } from "vscode";
import { VSCodeUtils } from "../vsCodeUtils";
import { WSUtils } from "../WSUtils";

export async function promptRefactorMatchText(): Promise<string | undefined> {
  const editor = VSCodeUtils.getActiveTextEditor();
  const value = editor?.document
    ? (await WSUtils.getNoteFromDocument(editor.document))?.fname
    : "";
  const match = await VSCodeUtils.showInputBox({
    title: "Enter match text",
    prompt:
      "The matched portion of the file name will be the part that gets modified. The rest will remain unchanged. This supports full range of regular expression. Leave blank to capture entire file name",
    ...(value !== undefined ? { value } : {}),
  });

  if (match === undefined) {
    return;
  }
  if (match.trim() === "") {
    return "(.*)";
  }
  return match;
}

export async function promptRefactorReplaceText(): Promise<string | undefined> {
  let done = false;
  let replace: string | undefined;
  do {
    replace = await VSCodeUtils.showInputBox({
      title: "Enter replace text",
      prompt:
        "This will replace the matched portion of the file name. If the matched text from previous step has named / unnamed captured groups, they are available here.",
    });

    if (replace === undefined) {
      return;
    }
    if (replace.trim() === "") {
      window.showWarningMessage("Please provide a replace text.");
    } else {
      done = true;
    }
  } while (!done);

  return replace;
}

export async function promptRefactorConfirmation(
  noConfirm?: boolean,
): Promise<boolean> {
  if (noConfirm) return true;
  const options = ["Proceed", "Cancel"];
  const resp = await VSCodeUtils.showQuickPick(options, {
    title: "Proceed with Refactor?",
    placeHolder: "Proceed",
    ignoreFocusOut: true,
  });
  return resp === "Proceed";
}

export type RefactorPreviewOp = {
  oldUri: Uri;
  newUri: Uri;
  vault: { fsPath: string };
};

export function buildRefactorSuccessPreviewMarkdown(
  operations: RefactorPreviewOp[],
): string {
  let content = [
    "# Refactor Preview",
    "",
    "## The following files will be renamed",
  ];
  content = content.concat(
    _.map(
      _.groupBy(operations, "vault.fsPath"),
      (ops: RefactorPreviewOp[], k: string) => {
        const out = [`${k}`].concat("\n||||\n|-|-|-|");
        return out
          .concat(
            ops.map(({ oldUri, newUri }) => {
              return `| ${path.basename(oldUri.fsPath)} |-->| ${path.basename(
                newUri.fsPath,
              )} |`;
            }),
          )
          .join("\n");
      },
    ),
  );
  return content.join("\n");
}

export function showRefactorPreviewPanel(opts: {
  viewType: string;
  title: string;
  markdown: string;
  preserveFocus?: boolean;
}): void {
  const panel = window.createWebviewPanel(
    opts.viewType,
    opts.title,
    opts.preserveFocus
      ? { viewColumn: ViewColumn.One, preserveFocus: true }
      : ViewColumn.One,
    {},
  );
  // markdown is already HTML-ready for markdown-it render at call site
  panel.webview.html = opts.markdown;
}

export function announceRefactorScope(opts: {
  entireWorkspaceItem: DNodePropsQuickInputV2;
  selectedItems: readonly DNodePropsQuickInputV2[];
}): void {
  if (opts.selectedItems[0] === opts.entireWorkspaceItem) {
    window.showInformationMessage("Refactor scoped to all notes.");
  } else {
    window.showInformationMessage(
      `Refactor scoped to ${opts.selectedItems.length} selected note(s).`,
    );
  }
}
