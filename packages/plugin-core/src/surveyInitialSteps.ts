/**
 * Initial onboarding survey step classes.
 */
import { ConfirmStatus, SurveyEvents } from "@dendronhq/common-all";
import { MetadataService, PriorTools } from "@dendronhq/engine-server";
import { resolve } from "path";
import * as vscode from "vscode";
import { DendronQuickInputSurvey, DendronQuickPickSurvey } from "./surveyBase";
import { AnalyticsUtils } from "./utils/analytics";

export class ContextSurvey extends DendronQuickPickSurvey {
  static CHOICES: { [index: string]: string } = {
    "For work": "work",
    "For personal use": "personal",
    "All of the above": "all",
    Other: "other",
  };

  async onAnswer(result: vscode.QuickPickItem) {
    let maybeOtherResult: string | undefined;
    const answer = ContextSurvey.CHOICES[result.label];
    if (answer === "other") {
      maybeOtherResult = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: "Type anything that applies.",
        prompt:
          'You have checked "Other". Please describe what other context you intend to use Dendron.',
        title: "In what context do you intend to use Dendron? - Other",
      });
    }

    AnalyticsUtils.identify({ useContext: answer });
    AnalyticsUtils.track(SurveyEvents.ContextSurveyConfirm, {
      status: ConfirmStatus.accepted,
      result: answer,
      other: maybeOtherResult,
    });
  }

  onReject() {
    AnalyticsUtils.track(SurveyEvents.ContextSurveyConfirm, {
      status: ConfirmStatus.rejected,
    });
  }

  static create() {
    const title = "In what context do you intend to use Dendron?";
    const choices = Object.keys(ContextSurvey.CHOICES).map((key) => {
      return { label: key };
    });
    return new ContextSurvey({ title, choices, canPickMany: false });
  }
}

export class BackgroundSurvey extends DendronQuickPickSurvey {
  async onAnswer(result: vscode.QuickPickItem) {
    let maybeOtherResult: string | undefined;
    if (result.label === "Other") {
      maybeOtherResult = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: "Type anything that applies.",
        prompt:
          'You have checked "Other". Please describe what other backgrounds you have.',
        title: "What is your background? - Other",
      });
    }

    AnalyticsUtils.identify({ role: result.label });
    AnalyticsUtils.track(SurveyEvents.BackgroundAnswered, {
      results: [result.label], // passing as array because this used to be a multi-select survey
      other: maybeOtherResult,
    });
  }

  onReject() {
    AnalyticsUtils.track(SurveyEvents.BackgroundRejected);
  }

  static create() {
    const title = "What is your primary background?";
    const choices = [
      { label: "Software Developer" },
      { label: "Technical Writer" },
      { label: "Researcher" },
      { label: "Dev Ops" },
      { label: "Manager" },
      { label: "Student" },
      { label: "Other" },
    ];
    return new BackgroundSurvey({ title, choices, canPickMany: false });
  }
}

export class UseCaseSurvey extends DendronQuickPickSurvey {
  async onAnswer(results: vscode.QuickPickItem[]) {
    let maybeOtherResult: string | undefined;
    if (results.some((result) => result.label === "Other")) {
      maybeOtherResult = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: "Type anything that applies.",
        prompt:
          'You have checked "Other". Please describe what other use cases you have.',
        title: "What do you want to use Dendron for? - Other",
      });
    }
    const resultsList = results.map((result) => result.label);
    AnalyticsUtils.identify({ useCases: resultsList });
    AnalyticsUtils.track(SurveyEvents.UseCaseAnswered, {
      results: resultsList,
      other: maybeOtherResult,
    });
  }

  onReject() {
    AnalyticsUtils.track(SurveyEvents.UseCaseRejected);
  }

  static create() {
    const title = "What do you want to use Dendron for?";
    const choices = [
      { label: "Personal knowledge base" },
      { label: "Team knowledge base" },
      { label: "Todos and Agenda" },
      { label: "Meeting notes" },
      { label: "Research" },
      { label: "Other" },
    ];
    return new UseCaseSurvey({ title, choices, canPickMany: true });
  }
}

export class PriorToolsSurvey extends DendronQuickPickSurvey {
  async onAnswer(results: vscode.QuickPickItem[]) {
    let maybeOtherResult: string | undefined;
    if (results.some((result) => result.label === "Other")) {
      maybeOtherResult = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: "Type anything that applies.",
        prompt:
          'You have checked "Other". Please describe what other tools you have used.',
        title: "Are you coming from an existing tool? - Other",
      });
    }
    const resultsList = results.map((result) => result.label);
    AnalyticsUtils.identify({ priorTools: resultsList });
    AnalyticsUtils.track(SurveyEvents.PriorToolsAnswered, {
      results: results.map((result) => result.label),
      other: maybeOtherResult,
    });

    // Store the results into metadata so that we can later alter functionality
    // based on the user's response
    MetadataService.instance().priorTools = resultsList.map(
      (result) => PriorTools[result as keyof typeof PriorTools],
    );
  }

  onReject() {
    AnalyticsUtils.track(SurveyEvents.PriorToolsRejected);
  }

  static create() {
    const title = "Are you coming from an existing tool?";
    const choices = [
      { label: PriorTools.No },
      { label: PriorTools.Foam },
      { label: PriorTools.Roam },
      { label: PriorTools.Logseq },
      { label: PriorTools.Notion },
      { label: PriorTools.OneNote },
      { label: PriorTools.Obsidian },
      { label: PriorTools.Evernote },
      { label: PriorTools.Confluence },
      { label: PriorTools.GoogleKeep },
      { label: PriorTools.Other },
    ];
    return new PriorToolsSurvey({ title, choices, canPickMany: true });
  }
}

export class PublishingUseCaseSurvey extends DendronQuickPickSurvey {
  static CHOICES: { [index: string]: string } = {
    "Yes, publishing is a very important use case for me.": "yes/important",
    "Yes, but I would only like to publish my notes to people I choose to.":
      "yes/restricted",
    "I haven't considered publishing my notes, but I am willing to try if it's easy.":
      "curious",
    "No, I do not wish to publish my notes.": "no",
  };

  async onAnswer(result: vscode.QuickPickItem) {
    const answer = PublishingUseCaseSurvey.CHOICES[result.label];
    AnalyticsUtils.identify({ publishingUseCase: answer });
    AnalyticsUtils.track(SurveyEvents.PublishingUseCaseAnswered, {
      answer,
    });
  }

  onReject() {
    AnalyticsUtils.track(SurveyEvents.PublishingUseCaseRejected);
  }

  static create() {
    const title =
      "Dendron lets you publish your notes as a static website. Is this something you'd be interested in?";
    const choices = Object.keys(PublishingUseCaseSurvey.CHOICES).map((key) => {
      return { label: key };
    });
    return new PublishingUseCaseSurvey({ title, choices, canPickMany: false });
  }
}

export class NewsletterSubscriptionSurvey extends DendronQuickInputSurvey {
  async onAnswer(result: string) {
    AnalyticsUtils.identify({ email: result });
    AnalyticsUtils.track(SurveyEvents.NewsletterSubscriptionAnswered);
    resolve();
  }

  onReject() {
    AnalyticsUtils.track(SurveyEvents.NewsletterSubscriptionRejected);
  }

  static create() {
    const title = "Would you like to subscribe to our newsletter?";
    const placeHolder = "Enter your e-mail";
    return new NewsletterSubscriptionSurvey({ title, placeHolder });
  }
}
