"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.showMeHowView = showMeHowView;
const vscode_1 = __importDefault(require("vscode"));
const getShowMeHowViewHtml = (opts) => {
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${opts.name}</title>
    <style>
      html, body {
        margin: 0px;
        height: 100%;
        overflow: hidden;
      }
      .img-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
      }
    </style>
  </head>
  <body>
  <div class="img-container">
    <a href="${opts.href}"><img alt="${opts.alt}" src=${opts.src} /></a>
  </div>
  </body>
  
  </html>`;
};
function showMeHowView(opts) {
    const panel = vscode_1.default.window.createWebviewPanel(opts.name, opts.name, vscode_1.default.ViewColumn.One, {
        enableScripts: true,
    });
    panel.webview.html = getShowMeHowViewHtml(opts);
}
//# sourceMappingURL=ShowMeHowView.js.map