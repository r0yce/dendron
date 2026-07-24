/**
 * Doctor webview preview panels (markdown HTML).
 */
import {
  DEngineClient,
  DNodeUtils,
  DVault,
  ExtensionEvents,
  NoteProps,
  Position,
  ValidateFnameResp,
  VaultUtils,
} from "@dendronhq/common-all";
import { RemarkUtils } from "@dendronhq/unified";
import fs from "fs-extra";
import _ from "lodash";
import _md from "markdown-it";
import { Uri, ViewColumn, window } from "vscode";
import { AnalyticsUtils } from "../utils/analytics";

const md = _md();

export type IncompatibleExtensionInstallStatus = {
  id: string;
  installed: boolean;
};

function showMarkdownPanel(opts: {
  viewType: string;
  title: string;
  markdown: string;
  enableCommandUris?: boolean;
}) {
  const panel = window.createWebviewPanel(
    opts.viewType,
    opts.title,
    ViewColumn.One,
    opts.enableCommandUris ? { enableCommandUris: true } : {}
  );
  panel.webview.html = md.render(opts.markdown);
  return panel;
}

export async function showMissingNotePreview(candidates: NoteProps[]) {
  let content = [
    "# Create Missing Linked Notes Preview",
    "",
    `## The following files will be created`,
  ];
  _.forEach(_.sortBy(candidates, ["vault.fsPath"]), (candidate) => {
    content = content.concat(
      `- ${candidate.vault.fsPath}/${candidate.fname}\n`
    );
  });
  showMarkdownPanel({
    viewType: "doctorCreateMissingLinkedNotesPreview",
    title: "Create MissingLinked Notes Preview",
    markdown: content.join("\n"),
  });
}

export async function showBrokenLinkPreview(
  brokenLinks: {
    file: string;
    vault: string;
    links: {
      value: string;
      line: number;
      column: number;
    }[];
  }[],
  engine: DEngineClient
) {
  let content = [
    "# Broken Links Preview",
    "",
    `## The following files have broken links`,
  ];

  const { vaults, wsRoot } = engine;
  _.forEach(_.sortBy(brokenLinks, ["file"]), (ent) => {
    content = content.concat(`${ent.file}\n`);
    const vault = VaultUtils.getVaultByName({
      vaults,
      vname: ent.vault,
    }) as DVault;
    const fsPath = DNodeUtils.getFullPath({
      wsRoot,
      vault,
      basename: ent.file + ".md",
    });
    const fileContent = fs.readFileSync(fsPath).toString();
    const nodePosition = RemarkUtils.getNodePositionPastFrontmatter(
      fileContent
    ) as Position;
    ent.links.forEach((link) => {
      content = content.concat(
        `- ${link.value} at line ${
          link.line + nodePosition.end.line
        } column ${link.column}\n`
      );
    });
  });

  showMarkdownPanel({
    viewType: "doctorBrokenLinksPreview",
    title: "Create Broken Links Preview",
    markdown: content.join("\n"),
  });
}

export async function showIncompatibleExtensionPreview(opts: {
  installStatus: IncompatibleExtensionInstallStatus[];
}) {
  const { installStatus } = opts;
  const contents = [
    "# Extensions that are incompatible with Dendron.",
    "",
    "The extensions listed below are known to be incompatible with Dendron.",
    "",
    "Neither Dendron nor the extension may function properly when installed concurrently.",
    "",
    "Consider disabling the incompatible extensions when in a Dendron Workspace.",
    "  - [How to disable extensions for a specific workspace without uninstalling](https://code.visualstudio.com/docs/editor/extension-marketplace#_disable-an-extension)",
    "",
    "See [Incompatible Extensions](https://wiki.dendron.so/notes/9Id5LUZFfM1m9djl6KgpP) for more details.",
    "",
    "## Incompatible Extensions: ",
    "",
    "||||",
    "|-|-|-|",
    installStatus
      .map((status) => {
        const commandArgs = `"@id:${status.id}"`;
        const commandUri = Uri.parse(
          `command:workbench.extensions.search?${JSON.stringify(commandArgs)}`
        );
        const message = status.installed
          ? `[View Extension](${commandUri})`
          : "Not Installed";
        return `| ${status.id} | | ${message} | `;
      })
      .join("\n"),
    "",
  ].join("\n");

  showMarkdownPanel({
    viewType: "incompatibleExtensionsPreview",
    title: "Incompatible Extensions",
    markdown: contents,
    enableCommandUris: true,
  });
  AnalyticsUtils.track(ExtensionEvents.IncompatibleExtensionsPreviewDisplayed);
  return { installStatus, contents };
}

export async function showFixInvalidFileNamePreview(opts: {
  canRename: {
    cleanedFname: string;
    canRename: boolean;
    note: NoteProps;
    resp: ValidateFnameResp;
  }[];
  cantRename: {
    cleanedFname: string;
    canRename: boolean;
    note: NoteProps;
    resp: ValidateFnameResp;
  }[];
}) {
  const { canRename, cantRename } = opts;
  const canRenameContent =
    canRename.length > 0
      ? [
          "These notes have invalid filenames and can be automatically fixed:",
          "",
          "| file name || change to | reason |",
          "|-|-|-|-|",
          canRename
            .map((item) => {
              const { note, resp, cleanedFname } = item;
              return `| \`${note.fname}\` || __${cleanedFname}__ | ${resp.reason} |`;
            })
            .join("\n"),
        ].join("\n")
      : "";

  const cantRenameContent =
    cantRename.length > 0
      ? [
          "These notes have invalid filenames but cannot be automatically fixed because it will create duplicate notes with same file names.",
          "",
          "Please review them and rename manually:",
          "",
          "| file name || change to | reason |",
          "|-|-|-|-|",
          cantRename
            .map((item) => {
              const { note, resp, cleanedFname } = item;
              return `| \`${note.fname}\`|| __${cleanedFname}__ | ${resp.reason} |`;
            })
            .join("\n"),
          "",
        ].join("\n")
      : "";
  const contents = [
    "# Fix Invalid Filenames",
    "",
    "The notes listed below are invalid.",
    "",
    "Please see [Restrictions](https://wiki.dendron.so/notes/v21pacjod0eqgdhb7zo7fvw) to learn more about file name restrictions.",
    "",
    "***",
    canRenameContent,
    "",
    cantRenameContent,
    "",
  ].join("\n");
  showMarkdownPanel({
    viewType: "invalidFileNamesPreview",
    title: "Invalid Filenames",
    markdown: contents,
    enableCommandUris: true,
  });
}
