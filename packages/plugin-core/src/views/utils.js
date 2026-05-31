"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebViewUtils = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const ExtensionProvider_1 = require("../ExtensionProvider");
const logger_1 = require("../logger");
const vsCodeUtils_1 = require("../vsCodeUtils");
const fs_extra_1 = __importDefault(require("fs-extra"));
class WebViewUtils {
    /**
     * Get root uri where web view assets are store
     * When running in development, this is in the build folder of `dendron-plugin-views`
     * @returns
     */
    static getViewRootUri() {
        const assetUri = vsCodeUtils_1.VSCodeUtils.getAssetUri(ExtensionProvider_1.ExtensionProvider.getExtension().context);
        const pkgRoot = (0, common_server_1.findUpTo)({
            base: __dirname,
            fname: "package.json",
            maxLvl: 5,
            returnDirPath: true,
        });
        if (!pkgRoot) {
            throw new common_all_1.DendronError({
                message: "Unable to find the folder where Dendron assets are stored",
            });
        }
        return (0, common_all_1.getStage)() === "dev"
            ? vscode.Uri.file(path_1.default.join(pkgRoot, "..", "dendron-plugin-views", "build"))
            : assetUri;
    }
    static getJsAndCss() {
        const pluginViewsRoot = WebViewUtils.getViewRootUri();
        const jsSrc = vscode.Uri.joinPath(pluginViewsRoot, "static", "js", `index.bundle.js`);
        const cssSrc = vscode.Uri.joinPath(pluginViewsRoot, "static", "css", `index.styles.css`);
        return { jsSrc, cssSrc };
    }
    static getLocalResourceRoots(context) {
        const assetUri = vsCodeUtils_1.VSCodeUtils.getAssetUri(context);
        const pluginViewsRoot = WebViewUtils.getViewRootUri();
        return [assetUri, pluginViewsRoot];
    }
    /**
     *
     * @param panel: required to convert asset URLs to VSCode Webview Extension format
     * @returns
     */
    static async getWebviewContent({ name, jsSrc, cssSrc, port, wsRoot, panel, initialTheme, }) {
        const root = vsCodeUtils_1.VSCodeUtils.getAssetUri(ExtensionProvider_1.ExtensionProvider.getExtension().context);
        const themes = ["light", "dark"];
        const themeMap = {};
        const customThemePath = path_1.default.join(wsRoot, common_all_1.CONSTANTS.CUSTOM_THEME_CSS);
        if (await fs_extra_1.default.pathExists(customThemePath)) {
            themeMap["custom"] = panel.webview
                .asWebviewUri(vscode.Uri.file(customThemePath))
                .toString();
        }
        themes.map((th) => {
            themeMap[th] = panel.webview
                .asWebviewUri(vscode.Uri.joinPath(root, "static", "css", "themes", `${th}.css`))
                .toString();
        });
        const out = common_server_1.WebViewCommonUtils.genVSCodeHTMLIndex({
            jsSrc: panel.webview.asWebviewUri(jsSrc).toString(),
            cssSrc: panel.webview.asWebviewUri(cssSrc).toString(),
            // Need to use `asExternalUri` to make sure port forwarding is set up
            // correctly in remote workspaces
            url: (await vscode.env.asExternalUri(vscode.Uri.parse(common_all_1.APIUtils.getLocalEndpoint(port))))
                .toString()
                // Slice of trailing slash
                .slice(undefined, -1),
            wsRoot,
            browser: false,
            // acquireVsCodeApi() Documentation: This function can only be invoked once per session.
            // You must hang onto the instance of the VS Code API returned by this method,
            // and hand it out to any other functions that need to use it.
            acquireVsCodeApi: `const vscode = acquireVsCodeApi(); window.vscode = vscode;`,
            themeMap: themeMap,
            initialTheme,
            name,
        });
        return out;
    }
    static async prepareTreeView({ ext, key, webviewView, }) {
        const viewEntry = (0, common_all_1.getWebTreeViewEntry)(key);
        const name = viewEntry.bundleName;
        const webViewAssets = WebViewUtils.getJsAndCss();
        const port = ext.port;
        webviewView.webview.options = {
            enableScripts: true,
            enableCommandUris: false,
            localResourceRoots: WebViewUtils.getLocalResourceRoots(ext.context),
        };
        const html = await WebViewUtils.getWebviewContent({
            ...webViewAssets,
            name,
            port,
            wsRoot: ext.getEngine().wsRoot,
            panel: webviewView,
        });
        webviewView.webview.html = html;
    }
    /**
     * @deprecated Use `{@link WebviewUtils.getWebviewContent}`
     * @param param0
     * @returns
     */
    static genHTMLForView = async ({ title, view, }) => {
        const { wsRoot, config } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
        const port = ext.port;
        const qs = common_all_1.DUtils.querystring.stringify({
            ws: wsRoot,
            port,
        });
        // View is `dendron.{camelCase}`
        // we want to remove `dendron` and transform camelCase to snake case
        // In addition, if we are serving using a live nextjs server, don't append .html at the end
        const src = `${await ext.getClientAPIRootUrl()}vscode/${view.replace(/^dendron\./, "")}${config.dev?.nextServerUrl ? "" : ".html"}?${qs}`;
        logger_1.Logger.info({ ctx: "genHTML", view, src });
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    html, body, iframe {
      margin: 0;
      padding: 0;
      border: 0;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <iframe id="iframeView" src="${src}"></iframe>

  <script>
    function main() {
      const vscode = acquireVsCodeApi();

      function postMsg(msg) {
        const iframe = document.getElementById('iframeView');
        iframe.contentWindow.postMessage(msg, "*");
      };

      function getTheme() {
          // get theme
          let vsTheme = document.body.className;
          
          var reduceMotionClassName = "vscode-reduce-motion"
          if(vsTheme.includes(reduceMotionClassName)) {
            vsTheme = vsTheme.replace(reduceMotionClassName,"").trim()
          }

          let dendronTheme;
          if (vsTheme.endsWith("dark")) {
              dendronTheme = "dark";
          } else {
              dendronTheme = "light";
          }
          return {vsTheme, dendronTheme};
      }

      window.addEventListener("message", (e) => {
        console.log("got message", e);
        const message = e.data;
        if (message.type && message.source === "webClient") {
            // check if we need a theme
            if (message.type === "init") {
              console.log("initilizing client");
              postMsg({
                  type: "onThemeChange",
                  source: "vscode",
                  data: {
                      theme: getTheme().dendronTheme
                  }
              });
              // get active editor from vscode
              vscode.postMessage({
                  type: "onGetActiveEditor",
                  source: "webClient",
                  data: {}
              });
            } else {
              console.log("got webclient event", message)
              vscode.postMessage(message);
            }
            return;
        } else if (message.source === 'vscode') {
          console.log("got message from vscode", message);
          postMsg(message);
        } else  {
          console.log("got keyboard event", e.data);
          window.dispatchEvent(new KeyboardEvent('keydown', JSON.parse(e.data)));
        }
      }, false);
  }
    console.log("initialized webview");
    main();

  </script>

</body>

</html>`;
    };
    static genHTMLForTreeView = ({ title, view, }) => {
        return WebViewUtils.genHTMLForView({ title, view });
    };
    static genHTMLForWebView = ({ title, view, }) => {
        /**
         * Implementation might differ in the future
         */
        return WebViewUtils.genHTMLForView({ title, view });
    };
    /** Opens the given panel, and measures how long it stays open.
     *
     * Call this function **before** you open the panel with `panel.reveal()`.
     * This function will open the panel for you.
     *
     * @param panel The panel, must not have been opened yet.
     * @param onClose A callback that will run once the webview is closed. The duration given is in milliseconds.
     */
    static openWebviewAndMeasureTimeOpen(panel, onClose) {
        let visibleTimeTotal = 0;
        // We don't get an initial view state change event, so we have to start the timer now
        let visibleStart = process.hrtime();
        panel.onDidChangeViewState((event) => {
            if (event.webviewPanel.visible) {
                // When the user switches back into the view, we start measuring
                visibleStart = process.hrtime();
            }
            else {
                // When the user switches away from the view, we stop measuring
                if (visibleStart)
                    visibleTimeTotal += (0, common_server_1.getDurationMilliseconds)(visibleStart);
                visibleStart = undefined;
            }
        });
        panel.onDidDispose(() => {
            // If the user closes the webview while it's open, the view state change
            // event is skipped and it immediately calls the dispose event.
            if (visibleStart)
                visibleTimeTotal += (0, common_server_1.getDurationMilliseconds)(visibleStart);
            onClose(visibleTimeTotal);
        });
    }
}
exports.WebViewUtils = WebViewUtils;
//# sourceMappingURL=utils.js.map