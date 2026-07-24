import fs from "fs-extra";
import {
  genVSCodeHTMLIndex as genVSCodeHTMLIndexPure,
  WebViewThemeMap as WebViewThemeMapPure,
  GenVSCodeHTMLIndexOpts,
} from "@dendronhq/common-all";
import { findUpTo } from "./filesv2";

export class NodeJSUtils {
  static getVersionFromPkg(): string | undefined {
    const packageJsonPath = findUpTo({
      base: __dirname,
      fname: "package.json",
      maxLvl: 5,
    });
    if (!packageJsonPath) return undefined;
    try {
      const pkgJSON = fs.readJSONSync(packageJsonPath);
      if (!pkgJSON?.version) return undefined;
      return `${pkgJSON.version}`;
    } catch {
      // There may be errors if we couldn't read the file
      return undefined;
    }
  }
}

/** @deprecated Prefer `WebViewThemeMap` from `@dendronhq/common-all`. */
export type WebViewThemeMap = WebViewThemeMapPure;

/**
 * Desktop webview HTML helpers.
 * Template lives in common-all (pure) so web extension can share it.
 */
export class WebViewCommonUtils {
  static genVSCodeHTMLIndex = (opts: GenVSCodeHTMLIndexOpts) => {
    return genVSCodeHTMLIndexPure(opts);
  };
}
