"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const engine_server_1 = require("@dendronhq/engine-server");
const IFeatureShowcaseMessage_1 = require("../showcase/IFeatureShowcaseMessage");
const analytics_1 = require("../utils/analytics");
/**
 * Side Panel webview that shows the tip of the day
 * TODO: Add functionality
 *  - let user rotate tips
 */
class TipOfTheDayWebview {
    _webview;
    _tips;
    _curTipIndex;
    BUTTON_CLICKED_MSG = "buttonClicked";
    TIP_SHOWN_MSG = "loaded";
    get _currentTip() {
        return this._tips[this._curTipIndex];
    }
    /**
     * The set of tips to show the user.
     * @param tips
     */
    constructor(tips) {
        this._tips = tips;
        // Get the last seen tip from storage. If they've never seen one before,
        // then set them at a random index so we can get an even distribution of
        // tips shown across the population.
        let storedIndex = engine_server_1.MetadataService.instance().TipOfDayIndex;
        if (!storedIndex) {
            storedIndex = Math.floor(Math.random() * this._tips.length);
        }
        // Just in case we go down in the number of tips.
        this._curTipIndex = Math.min(storedIndex, this._tips.length - 1);
    }
    resolveWebviewView(webviewView, _context, _token) {
        this._webview = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            enableCommandUris: true,
        };
        webviewView.webview.html = this.getContent(this._currentTip);
        webviewView.webview.onDidReceiveMessage(async (messageFromWebview) => {
            switch (messageFromWebview.command) {
                case this.TIP_SHOWN_MSG:
                    analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.FeatureShowcaseDisplayed, {
                        messageType: this._currentTip.showcaseEntry,
                        displayLocation: IFeatureShowcaseMessage_1.DisplayLocation.TipOfTheDayView,
                    });
                    return;
                case this.BUTTON_CLICKED_MSG: {
                    analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.FeatureShowcaseResponded, {
                        messageType: this._currentTip.showcaseEntry,
                        displayLocation: IFeatureShowcaseMessage_1.DisplayLocation.TipOfTheDayView,
                        userResponse: IFeatureShowcaseMessage_1.FeatureShowcaseUserResponse.confirmed,
                    });
                    if (this._currentTip.onConfirm) {
                        const fn = this._currentTip.onConfirm.bind(this._currentTip);
                        fn();
                    }
                    return;
                }
                default:
                    break;
            }
        }, undefined, undefined);
        this.showNextTip();
    }
    showNextTip() {
        this._curTipIndex = (this._curTipIndex + 1) % this._tips.length;
        if (this._webview && this._webview.visible) {
            this._webview.webview.html = this.getContent(this._tips[this._curTipIndex]);
            engine_server_1.MetadataService.instance().TipOfDayIndex = this._curTipIndex;
            // Rotate the tip once every 24 hours.
            setTimeout(() => this.showNextTip(), 1000 * 60 * 60 * 24);
            return true;
        }
        else {
            return false;
        }
    }
    /**
     * TODO: add some functionality to allow users to show a new time / prev tip.
     */
    // private prevTip(): void {
    //   this._curTipIndex -= 1;
    //   if (this._curTipIndex < 0) {
    //     this._curTipIndex = this._tips.length - 1;
    //   }
    // }
    getContent(tip) {
        const message = tip.getDisplayMessage(IFeatureShowcaseMessage_1.DisplayLocation.TipOfTheDayView);
        let buttonDiv;
        if (tip.onConfirm && tip.confirmText) {
            buttonDiv = `
    <div>
      <button id="btn_id">${tip.confirmText}</button>
    </div>
    `;
        }
        else {
            buttonDiv = "<div/>";
        }
        const html = `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>"Tip of the Day"</title>
        <style>
        p {
          color: var(--vscode-foreground);
        }
        button {
          box-sizing: border-box;
          display: flex;
          width: 100%;
          padding: 4px;
          text-align: center;
          cursor: pointer;
          justify-content: center;
          align-items: center;
          background-color: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none
      }
      button:hover {
        background-color: var(--vscode-button-hoverBackground);
      }
        </style>
      </head>
      <body>
      <div>
        <p>
          ${message}
        </p>
      </div>
      ${buttonDiv}
  
      <script>
      var btn = document.getElementById("btn_id");
      const vscode = acquireVsCodeApi();
      vscode.postMessage({
          command: "${this.TIP_SHOWN_MSG}",
        });
  
      btn.addEventListener("click", function () {
        vscode.postMessage({
          command: "${this.BUTTON_CLICKED_MSG}",
        });
      });
    </script>
  
      </body>
    </html>
    `;
        return html;
    }
}
exports.default = TipOfTheDayWebview;
//# sourceMappingURL=TipOfTheDayWebview.js.map