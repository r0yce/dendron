/**
 * Pure-ish user config dir path resolution (no vscode env).
 * Caller supplies app name / portable dir from vscode.env.
 */
import path from "path";
import _ from "lodash";

const CODE_RELEASE_MAP: Record<string, string> = {
  VSCodium: "VSCodium",
  "Visual Studio Code - Insiders": "Code - Insiders",
};

/**
 * Resolve the VS Code / VSCodium User/ config directory for the host OS.
 */
export function resolveCodeUserConfigDir(opts: {
  appName: string;
  osType: string;
  env: {
    HOME?: string | undefined;
    APPDATA?: string | undefined;
    VSCODE_PORTABLE?: string | undefined;
  };
}): { userConfigDir: string; delimiter: string; osName: string } {
  const name = _.get(CODE_RELEASE_MAP, opts.appName, "Code");
  const osName = opts.osType;
  let delimiter = "/";
  let userConfigDir: string;

  switch (osName) {
    case "Darwin": {
      userConfigDir =
        opts.env.HOME + "/Library/Application Support/" + name + "/User/";
      break;
    }
    case "Linux": {
      userConfigDir = opts.env.HOME + "/.config/" + name + "/User/";
      break;
    }
    case "Windows_NT": {
      userConfigDir = opts.env.APPDATA + "\\" + name + "\\User\\";
      delimiter = "\\";
      break;
    }
    default: {
      userConfigDir = opts.env.HOME + "/.config/" + name + "/User/";
      break;
    }
  }

  // if vscode is in portable mode, we need to handle it differently
  const portableDir = opts.env.VSCODE_PORTABLE;
  if (portableDir) {
    userConfigDir = path.join(portableDir, "user-data", "User");
  }

  return {
    userConfigDir,
    delimiter,
    osName,
  };
}
