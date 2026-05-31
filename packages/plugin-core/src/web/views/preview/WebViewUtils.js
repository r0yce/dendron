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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebViewUtils = void 0;
const common_all_1 = require("@dendronhq/common-all");
const inject_1 = require("../../../di/inject");
const vscode = __importStar(require("vscode"));
const vscode_uri_1 = require("vscode-uri");
/**
 * Forked version of WebViewUtils that works in the web ext.
 * TODO: Consolidate back
 */
let WebViewUtils = class WebViewUtils {
    wsRoot;
    port;
    extensionUri;
    constructor(wsRoot, port, extensionUri) {
        this.wsRoot = wsRoot;
        this.port = port;
        this.extensionUri = extensionUri;
    }
    // TODO: Make sure the stage still works properly
    getAssetUri() {
        if ((0, common_all_1.getStage)() === "dev")
            return vscode_uri_1.Utils.joinPath(this.extensionUri, "assets");
        return vscode_uri_1.Utils.joinPath(this.extensionUri, "dist");
    }
    // Copied from workspace.ts
    async getClientAPIRootUrl() {
        const port = this.port;
        // asExternalUri forwards the port when working remotely
        const externalUri = await vscode.env.asExternalUri(vscode.Uri.parse(common_all_1.APIUtils.getLocalEndpoint(port)));
        const uri = externalUri.toString();
        return uri;
    }
    /**
     * Get root uri where web view assets are store
     * When running in development, this is in the build folder of `dendron-plugin-views`
     * @returns
     */
    getViewRootUri() {
        const assetUri = this.getAssetUri();
        return assetUri;
        // TODO: Fix logic for local debugging
        // const pkgRoot = findUpTo({
        //   base: __dirname,
        //   fname: "package.json",
        //   maxLvl: 5,
        //   returnDirPath: true,
        // });
        // if (!pkgRoot) {
        //   throw new DendronError({
        //     message: "Unable to find the folder where Dendron assets are stored",
        //   });
        // }
        // return getStage() === "dev"
        //   ? vscode.Uri.file(
        //       path.join(pkgRoot, "..", "dendron-plugin-views", "build")
        //     )
        //   : assetUri;
    }
    getJsAndCss() {
        const pluginViewsRoot = this.getViewRootUri();
        const jsSrc = vscode.Uri.joinPath(pluginViewsRoot, "static", "js", `index.bundle.js`);
        const cssSrc = vscode.Uri.joinPath(pluginViewsRoot, "static", "css", `index.styles.css`);
        return { jsSrc, cssSrc };
    }
    // need
    getLocalResourceRoots() {
        const assetUri = this.getAssetUri();
        const pluginViewsRoot = this.getViewRootUri();
        return [assetUri, pluginViewsRoot];
    }
    /**
     *
     * @param panel: required to convert asset URLs to VSCode Webview Extension format
     * @returns
     */
    async getWebviewContent({ name, jsSrc, cssSrc, panel, initialTheme, }) {
        const root = this.getAssetUri();
        const themes = ["light", "dark"];
        const themeMap = {};
        // const customThemePath = Utils.joinPath(
        //   this.wsRoot,
        //   CONSTANTS.CUSTOM_THEME_CSS
        // );
        // TODO: Add back functionality
        // if (await fs.pathExists(customThemePath)) {
        //   themeMap["custom"] = panel.webview
        //     .asWebviewUri(vscode.Uri.file(customThemePath))
        //     .toString();
        // }
        themes.map((th) => {
            themeMap[th] = panel.webview
                .asWebviewUri(vscode.Uri.joinPath(root, "static", "css", "themes", `${th}.css`))
                .toString();
        });
        const vscodeColorTheme = vscode.window.activeColorTheme.kind;
        const defaultInitialTheme = vscodeColorTheme === vscode.ColorThemeKind.Dark ||
            vscodeColorTheme === vscode.ColorThemeKind.HighContrast
            ? common_all_1.ThemeType.DARK
            : common_all_1.ThemeType.LIGHT;
        const out = this.genVSCodeHTMLIndex({
            jsSrc: panel.webview.asWebviewUri(jsSrc).toString(),
            cssSrc: panel.webview.asWebviewUri(cssSrc).toString(),
            // Need to use `asExternalUri` to make sure port forwarding is set up
            // correctly in remote workspaces
            url: (await vscode.env.asExternalUri(vscode.Uri.parse(common_all_1.APIUtils.getLocalEndpoint(this.port))))
                .toString()
                // Slice of trailing slash
                .slice(undefined, -1),
            wsRoot: this.wsRoot,
            browser: false,
            // acquireVsCodeApi() Documentation: This function can only be invoked once per session.
            // You must hang onto the instance of the VS Code API returned by this method,
            // and hand it out to any other functions that need to use it.
            acquireVsCodeApi: `const vscode = acquireVsCodeApi(); window.vscode = vscode;`,
            themeMap: themeMap,
            initialTheme: initialTheme ?? defaultInitialTheme,
            name,
        });
        return out;
    }
    async prepareTreeView({ key, webviewView, }) {
        const viewEntry = (0, common_all_1.getWebTreeViewEntry)(key);
        const name = viewEntry.bundleName;
        const webViewAssets = this.getJsAndCss();
        webviewView.webview.options = {
            enableScripts: true,
            enableCommandUris: false,
            localResourceRoots: this.getLocalResourceRoots(),
        };
        const html = await this.getWebviewContent({
            ...webViewAssets,
            name,
            panel: webviewView,
        });
        webviewView.webview.html = html;
    }
    /**
     * @deprecated Use `{@link WebviewUtils.getWebviewContent}`
     * @param param0
     * @returns
     */
    genHTMLForView = async ({ title, view, }) => {
        // const { wsRoot, config } = ExtensionProvider.getDWorkspace();
        // const ext = ExtensionProvider.getExtension();
        // const port = ext.port;
        const qs = common_all_1.DUtils.querystring.stringify({
            ws: this.wsRoot.fsPath, // TODO: Fix path
            port: this.port,
        });
        // View is `dendron.{camelCase}`
        // we want to remove `dendron` and transform camelCase to snake case
        // In addition, if we are serving using a live nextjs server, don't append .html at the end
        const src = `${await this.getClientAPIRootUrl()}vscode/${view.replace(/^dendron\./, "")}${ /*config.dev?.nextServerUrl*/undefined ? "" : ".html"}?${qs}`; // TODO: Fix
        // Logger.info({ ctx: "genHTML", view, src });
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
    /**
     *
     * @param param0
     * @returns
     */
    genVSCodeHTMLIndex({ name, jsSrc, cssSrc, url, wsRoot, browser, acquireVsCodeApi, themeMap, initialTheme, }) {
        const builtinStyle = "dendron-editor-follow-style";
        const defaultStyle = "dendron-editor-default-style";
        const overrideStyle = "dendron-editor-override-style";
        return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="Web site created using create-react-app"
        />
        <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
        <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
        <link rel="stylesheet" href="${cssSrc}" />
        <title>Dendron </title>
        <style id="${builtinStyle}">
          body, h1, h2, h3, h4 {
            color: var(--vscode-editor-foreground);
          }
  
          .main-content ul {
            list-style: unset;
            list-style-type: disc;
          }
  
          body {
            background-color: var(--vscode-editor-background);
          }
  
          a,
          a:hover,
          a:active {
            color: var(--vscode-textLink-foreground);
          }
        </style>
      </head>
  
      <script type="text/javascript">
        var theme = 'unknown';
  
        function onload() {
          applyTheme(document.body);
  
          var observer = new MutationObserver(function(mutations) {
              mutations.forEach(function(mutationRecord) {
                  applyTheme(mutationRecord.target);
              });
          });
          var target = document.body;
          observer.observe(target, { attributes : true, attributeFilter : ['class'] });
        }
  
        function addThemeCSS(theme, styleId, keepBuiltin) {
          const themeMap = ${JSON.stringify(themeMap)};
  
          console.log('Applying theme', theme);
  
          // Dynamically add css
          const link = document.createElement('link');
          link.setAttribute('rel', 'stylesheet');
          link.setAttribute('href', themeMap[theme]);
          link.setAttribute("id", styleId);
  
          const oldStyle = document.getElementById(styleId);
          if (oldStyle) {
            // If this theme was applied before (e.g. if user is switching between many themes), then delete the old one first
            document.head.removeChild(oldStyle);
          }
  
          if (keepBuiltin) {
              document.head.insertBefore(link, document.getElementById("${builtinStyle}"));
          } else {
              document.head.appendChild(link);
          }
        }
  
        function applyTheme(element) {
          // There are 2 themes in play: the default theme which is based on whether
          // the current user theme is dark or light, and then an optional override
          // theme which overrides that.
          // We have to apply both, because the core dark/light theme includes some
          // styles that are otherwise missing in the default theme, like code highlighting.
          let defaultTheme = element.className;
          const overrideTheme = element.dataset.themeOverride;
  
          // defaultTheme here will be just dark or light, because those are the core themes that
          // we always need to apply. We also need to pass dark or light to mermaid.
          // overrideTheme may be those, or it may be custom.
  
          // VSCode prefixes the theme color with vscode-
          const prefix = 'vscode-';
          if (defaultTheme.startsWith(prefix)) {
              // strip prefix
              defaultTheme = defaultTheme.substr(prefix.length);
          }
  
          // this class is introduced with new vscode setting reduce motion  to reduce the amount of motion
          // in the window.
          var reduceMotionClassName = "vscode-reduce-motion"
          if (defaultTheme.includes(reduceMotionClassName)) {
            defaultTheme = defaultTheme.replace(reduceMotionClassName,"").trim()
          }
  
          if (defaultTheme === 'high-contrast') {
              defaultTheme = 'dark'; // the high-contrast theme is a dark theme
          }
          if (defaultTheme === "high-contrast-light") {
              defaultTheme = "light"; // the high-contrast-light is a light theme
          }
  
          if (overrideTheme === "light" || overrideTheme === "dark") {
              // If user picked light or dark as the override, only apply the override
              console.log("Theme override is overriding the default theme", overrideTheme);
  
              defaultTheme = overrideTheme;
              addThemeCSS(defaultTheme, "${defaultStyle}");
          } else if (overrideTheme === "custom") {
              // If the user picked a custom theme, we first need the default theme then the custom theme.
              // Default first, because it has some critical styles we need. Custom later so the custom can override it.
              addThemeCSS(defaultTheme, "${defaultStyle}");
              addThemeCSS(overrideTheme, "${overrideStyle}");
          } else {
              // Override theme is not set at all. In that case, we want the theme to follow users editor theme.
              // In that case, we prepend the theme so the embedded stylesheet at the end of the head has priority.
              addThemeCSS(defaultTheme, "${defaultStyle}", /* prependBuiltin */ true);
          }
  
          // NextJS app needs the current theme type to pass it to mermaid
          window.currentTheme = defaultTheme;
  
        }
        ${acquireVsCodeApi}
      </script>
  
      <!-- Javascript to handle copy event: to take the html of the copy without taking the theming. -->
      <script type="text/javascript">
        document.addEventListener('copy', (e) => {
          const htmlSelection = getHTMLOfSelection();
  
          if (htmlSelection !== undefined){
            copyToClipboard(htmlSelection);
          }
        });
       /**
         * Decodes a HTML Encoded string
         * @see https://stackoverflow.com/a/34064434
         * @param {string} input The HTML Encoded String to be decoded
         * @returns string
         */
        function htmlDecode(input) {
            var doc = new DOMParser().parseFromString(input, "text/html");
            return doc.documentElement.textContent;
        }
        /**
         *
         * Cleans a HTML String from Style and script tags as well as additional Linebreaks
         * @see https://stackoverflow.com/questions/822452/strip-html-from-text-javascript
         * @param {string} text the HTML string to clean
         * @returns  string
         */
        function clean(text) {
            const out = text
                .replace(/<style[^>]*>.*<\\/style> /gm, "")
                // Remove script tags and content
                .replace(/<script[^>]*>.*<\\/script > /gm, "")
                // Remove all opening, closing and orphan HTML tags
                .replace(/<[^>]+>/gm, "")
                // Remove leading spaces and repeated CR/LF
                .replace(/([\\r\\n]+ +)+/gm, " ");
            return out;
        }
  
        /**
         * Gets the HTML String of an Selection
         * @see https://stackoverflow.com/a/5084044/7858768
         * @returns  string
         */
        function getHTMLOfSelection() {
            let range;
            if (document.selection && document.selection.createRange) {
                range = document.selection.createRange();
                return range.htmlText;
            }
            else if (window.getSelection) {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    range = selection.getRangeAt(0);
                    const clonedSelection = range.cloneContents();
                    const div = document.createElement('div');
                    div.appendChild(clonedSelection);
                    return div.innerHTML;
                }
                else {
                    return undefined;
                }
            }
            else {
                return undefined;
            }
        }
  
        /**
          * Copys the provided string to the System Clipboard while cleaning and html decoding it.
          * @see https://stackoverflow.com/a/64711198/7858768
          * @see https://stackoverflow.com/a/57279336/7858768
          * @param {string} html the text to copy to the Clipboard
          * @return void
          */
        function copyToClipboard(html) {
            const container = document.createElement('div');
            container.innerHTML = html;
            container.style.position = 'fixed';
            container.style.pointerEvents = 'none';
            container.style.opacity = 0;
  
            const blob = new Blob([html], { type: "text/html" });
            const blobPlain = new Blob([htmlDecode(clean(html))], { type: "text/plain" });
            const item = new ClipboardItem({
                "text/html": blob,
                "text/plain": blobPlain,
            });
            navigator.clipboard.write([item]).then(function () {
  
            }, function (error) {
                console.error("Unable to write to clipboard. Error:");
                console.log(error);
            });
          }
      </script>
  
      <body onload="onload()" data-theme-override="${initialTheme || ""}">
        <div id="main-content-wrap" class="main-content-wrap">
          <div id="main-content" class="main-content">
            <div id="root" data-url="${url}" data-ws="${wsRoot.fsPath}" data-browser="${browser}" data-name="${name}"></div>
          </div>
        </div>
  
        <!-- Source code for javascript bundle. Not used in browser mode-->
        <script src="${jsSrc}"></script>
      </body>
    </html>`;
    }
};
exports.WebViewUtils = WebViewUtils;
exports.WebViewUtils = WebViewUtils = __decorate([
    (0, inject_1.injectable)(),
    __param(0, (0, inject_1.inject)("wsRoot")),
    __param(1, (0, inject_1.inject)("port")),
    __param(2, (0, inject_1.inject)("extensionUri")),
    __metadata("design:paramtypes", [vscode_uri_1.URI, Number, vscode_uri_1.URI])
], WebViewUtils);
//# sourceMappingURL=WebViewUtils.js.map