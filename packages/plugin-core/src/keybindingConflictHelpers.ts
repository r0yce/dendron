/**
 * Pure / fs-light keybinding conflict helpers (no vscode).
 * Node-smokeable.
 */
import { CommentJSONValue } from "@dendronhq/common-server";
import _ from "lodash";
import { isOSType, KeybindingConflict } from "./constants";

type Keybindings = Record<string, string> & {
  when?: string;
  args?: unknown;
  command?: string;
  key?: string;
};

/**
 * Filter known conflicts by installed extension ids and OS type.
 */
export function filterConflictsByInstallAndOS(opts: {
  knownConflicts: KeybindingConflict[];
  installedExtensionIds: string[];
  osType: string;
}): KeybindingConflict[] {
  const { knownConflicts, installedExtensionIds, osType } = opts;
  return knownConflicts.filter((conflict) => {
    const isInstalled = installedExtensionIds.includes(conflict.extensionId);
    const conflictOSType = conflict.os || ["Darwin", "Linux", "Windows_NT"];
    const matchesOS = isOSType(osType) && conflictOSType.includes(osType);
    return isInstalled && matchesOS;
  });
}

/**
 * Drop conflicts the user already disabled via `-command` entries in keybindings.json.
 */
export function filterResolvedKeybindingConflicts(opts: {
  conflicts: KeybindingConflict[];
  userKeybindings: Array<{ command?: string }>;
}): KeybindingConflict[] {
  const { conflicts, userKeybindings } = opts;
  const alreadyResolved: KeybindingConflict[] = [];

  userKeybindings.forEach((keybinding) => {
    // we only recognize disabling of the conflicting keybinding as resolution
    // remapping of either the conflicting / dendron command's keybinding
    // or disabling the dendron command's keybinding is not considered a resolution.
    if (keybinding.command && keybinding.command.startsWith("-")) {
      const command = keybinding.command.substring(1);
      const resolvedConflict = conflicts.find(
        (conflict) => conflict.commandId === command,
      );
      if (resolvedConflict) {
        alreadyResolved.push(resolvedConflict);
      }
    }
  });

  return _.differenceBy(conflicts, alreadyResolved);
}

export function generateKeybindingBlockForCopy(opts: {
  entry: Keybindings;
  disable?: boolean;
}): string {
  const { entry, disable } = opts;
  const whenClause = entry.when ? `  "when": "${entry.when}",` : undefined;

  const args = entry.args
    ? `  "args": ${JSON.stringify(entry.args)},`
    : undefined;

  const block = [
    "{",
    `  "key": "${disable ? entry.key : ""}",`,
    `  "command": "${disable ? "-" : ""}${entry.command}",`,
    whenClause,
    args,
    "}",
    "",
  ]
    .filter((line) => line !== undefined)
    .join("\n");
  return block;
}

export function checkKeybindingsExist(val: CommentJSONValue): boolean {
  return Array.isArray(val);
}

export function getMultipleKeybindingsMsgFormat(cmd: string): string {
  return `Multiple keybindings found for ${cmd} command shortcut.`;
}

/**
 * Lookup a single keybinding entry matching command + optional args.
 * Returns the key, or throws if multiple matches.
 */
export function findSingleKeybindingKey(opts: {
  keybindings: Keybindings[];
  command: string;
  args?: string;
  multiMsgCmd: string;
}): string | undefined {
  const { keybindings, command, args, multiMsgCmd } = opts;
  const result = keybindings.filter((item) => {
    if (!item.command || item.command !== command) return false;
    if (args !== undefined) return item.args === args;
    return true;
  });

  if (result.length === 1 && result[0]!.key) {
    return result[0]!.key;
  }
  if (result.length > 1) {
    throw new Error(getMultipleKeybindingsMsgFormat(multiMsgCmd));
  }
  return undefined;
}
