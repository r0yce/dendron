/**
 * Tip of the Day webview registration.
 */
import * as vscode from "vscode";
import { DendronTreeViewKey } from "@dendronhq/common-all";
import TipOfTheDayWebview from "../features/TipOfTheDayWebview";
import { ALL_FEATURE_SHOWCASES } from "../showcase/AllFeatureShowcases";
import { DisplayLocation } from "../showcase/IFeatureShowcaseMessage";
import _ from "lodash";

export function setupTipOfTheDayView() {
    const featureShowcaseWebview = new TipOfTheDayWebview(
      _.filter(ALL_FEATURE_SHOWCASES, (message) =>
        message.shouldShow(DisplayLocation.TipOfTheDayView)
      )
    );

    return vscode.window.registerWebviewViewProvider(
      DendronTreeViewKey.TIP_OF_THE_DAY,
      featureShowcaseWebview
    );
  }