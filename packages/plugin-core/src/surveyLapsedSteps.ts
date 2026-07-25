/**
 * Lapsed-user survey step classes.
 */
import { SurveyEvents } from "@dendronhq/common-all";
import { resolve } from "path";
import * as vscode from "vscode";
import { DendronQuickInputSurvey, DendronQuickPickSurvey } from "./surveyBase";
import { AnalyticsUtils } from "./utils/analytics";

export class LapsedUserReasonSurvey extends DendronQuickPickSurvey {
  async onAnswer(result: vscode.QuickPickItem) {
    const label = result.label;
    let extra: string | undefined;
    let reason: string | undefined;
    switch (label) {
      case "I haven't had time to start, but still want to.": {
        reason = "time";
        break;
      }
      case "I am not sure how to get started.": {
        reason = "stuck";
        break;
      }
      case "I've encountered a bug which stopped me from using Dendron.": {
        reason = "bug";
        extra = await vscode.window.showInputBox({
          ignoreFocusOut: true,
          placeHolder: "Type here",
          prompt: "Could you describe, in simple words, what happened?",
          title: label,
        });
        break;
      }
      case "I found a different tool that suits me better.": {
        reason = "tool";
        extra = await vscode.window.showInputBox({
          ignoreFocusOut: true,
          placeHolder: "Type here",
          prompt: "What feature was missing in Dendron for your use case?",
          title: label,
        });
        break;
      }
      case "Other": {
        // "Other"
        reason = "other";
        extra = await vscode.window.showInputBox({
          ignoreFocusOut: true,
          placeHolder: "Type here",
          prompt: "Please freely type your reasons here.",
          title: label,
        });
        break;
      }
      default: {
        break;
      }
    }

    AnalyticsUtils.track(SurveyEvents.LapsedUserReasonAnswered, {
      reason,
      extra,
    });
  }

  onReject() {
    AnalyticsUtils.track(SurveyEvents.LapsedUserReasonRejected);
  }

  static create() {
    const title = "What is the reason you haven't started using Dendron yet?";
    const choices = [
      { label: "I haven't had time to start, but I still want to." },
      { label: "I am not sure how to get started." },
      { label: "I've encountered a bug which stopped me from using Dendron." },
      { label: "I found a different tool that suits me better." },
      { label: "Other" },
    ];
    return new LapsedUserReasonSurvey({ title, choices, canPickMany: false });
  }
}

export class LapsedUserOnboardingSurvey extends DendronQuickPickSurvey {
  CALENDLY_URL = "https://calendly.com/d/mqtk-rf7q/onboard";
  openOnboardingLink: boolean = false;

  async onAnswer(result: vscode.QuickPickItem) {
    if (result.label === "Yes") {
      this.openOnboardingLink = true;
      vscode.window.showInformationMessage(
        "Thank you for considering an onboarding session.",
        {
          modal: true,
          detail: "We will take you to the link after the survey.",
        },
        { title: "Proceed with Survey" },
      );
    }

    AnalyticsUtils.track(SurveyEvents.LapsedUserGettingStartedHelpAnswered, {
      result: result.label,
    });
  }

  onReject() {
    AnalyticsUtils.track(SurveyEvents.LapsedUserGettingStartedHelpRejected);
  }

  static create() {
    const title =
      "We offer one-on-one onboarding sessions the help new users get started.";
    const choices = [{ label: "Yes" }, { label: "No" }];
    return new LapsedUserOnboardingSurvey({
      title,
      choices,
      canPickMany: false,
      placeHolder: "Would you like to schedule a 30 minute session?",
    });
  }
}

export class LapsedUserAdditionalCommentSurvey extends DendronQuickInputSurvey {
  async onAnswer(result: string) {
    AnalyticsUtils.track(SurveyEvents.LapsedUserAdditionalCommentAnswered, {
      result,
    });
    resolve();
  }

  onReject() {
    AnalyticsUtils.track(SurveyEvents.LapsedUserAdditionalCommentRejected);
  }

  static create() {
    const title =
      "Do you have any other comments to leave about your experience?";
    return new LapsedUserAdditionalCommentSurvey({ title });
  }
}

export class LapsedUserPlugDiscordSurvey extends DendronQuickPickSurvey {
  DISCORD_URL = "https://discord.gg/AE3NRw9";
  openDiscordLink: boolean = false;

  async onAnswer(result: vscode.QuickPickItem) {
    if (result.label === "Sure, take me to Discord.") {
      this.openDiscordLink = true;
    }
    AnalyticsUtils.track(SurveyEvents.LapsedUserDiscordPlugAnswered);
  }

  onReject() {
    AnalyticsUtils.track(SurveyEvents.LapsedUserDiscordPlugRejected);
  }

  static create() {
    const title = "Thanks for sharing feedback. One last thing!";
    const placeHolder =
      "We have a Discord community to help new users get started. Would you want an invite?";
    const choices = [
      { label: "Sure, take me to Discord." },
      { label: "I'm already there." },
      { label: "No thanks." },
    ];
    return new LapsedUserPlugDiscordSurvey({
      title,
      choices,
      placeHolder,
      canPickMany: false,
    });
  }
}
