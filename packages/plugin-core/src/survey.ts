/**
 * Survey orchestration (initial / lapsed / inactive).
 * Step classes live in surveyBase, surveyInitialSteps, surveyLapsedSteps.
 */
import { getStage, SurveyEvents } from "@dendronhq/common-all";
import {
  InactvieUserMsgStatusEnum,
  InitialSurveyStatusEnum,
  LapsedUserSurveyStatusEnum,
  MetadataService,
} from "@dendronhq/engine-server";
import _ from "lodash";
import * as vscode from "vscode";
import { Logger } from "./logger";
// Re-export step classes for callers/tests that imported from survey.
export { DendronQuickInputSurvey, DendronQuickPickSurvey } from "./surveyBase";
export {
  BackgroundSurvey,
  ContextSurvey,
  NewsletterSubscriptionSurvey,
  PriorToolsSurvey,
  PublishingUseCaseSurvey,
  UseCaseSurvey,
} from "./surveyInitialSteps";
export {
  LapsedUserAdditionalCommentSurvey,
  LapsedUserOnboardingSurvey,
  LapsedUserPlugDiscordSurvey,
  LapsedUserReasonSurvey,
} from "./surveyLapsedSteps";
import {
  BackgroundSurvey,
  ContextSurvey,
  NewsletterSubscriptionSurvey,
  PriorToolsSurvey,
  PublishingUseCaseSurvey,
  UseCaseSurvey,
} from "./surveyInitialSteps";
import {
  LapsedUserAdditionalCommentSurvey,
  LapsedUserOnboardingSurvey,
  LapsedUserPlugDiscordSurvey,
  LapsedUserReasonSurvey,
} from "./surveyLapsedSteps";
import { AnalyticsUtils } from "./utils/analytics";
import { VSCodeUtils } from "./vsCodeUtils";

export class SurveyUtils {
  /**
   * Asks three questions about background, use case, and prior tools used.
   */
  static async showInitialSurvey() {
    if (getStage() === "test") {
      return;
    }
    AnalyticsUtils.track(SurveyEvents.InitialSurveyPrompted);
    void Promise.resolve(
      vscode.window.showInformationMessage(
        "Welcome to Dendron! 🌱",
        {
          modal: true,
          detail:
            "Would you like to tell us a bit about yourself? This info will be used to provide a better onboarding experience. It will take less than a minute to complete.",
        },
        { title: "Proceed" },
        { title: "Skip Survey" },
      ),
    )
      .then(async (resp) => {
        if (resp?.title === "Proceed") {
          const contextSurvey = ContextSurvey.create();
          const backgroundSurvey = BackgroundSurvey.create();
          const useCaseSurvey = UseCaseSurvey.create();
          const publishingUseCaseSurvey = PublishingUseCaseSurvey.create();
          const priorToolSurvey = PriorToolsSurvey.create();
          const newsletterSubscritionSurvey =
            NewsletterSubscriptionSurvey.create();

          const contextResults = await contextSurvey.show(1, 6);
          const backgroundResults = await backgroundSurvey.show(2, 6);
          const useCaseResults = await useCaseSurvey.show(3, 6);
          const publishingUseCaseResults = await publishingUseCaseSurvey.show(
            4,
            6,
          );
          const priorToolsResults = await priorToolSurvey.show(5, 6);
          const newsletterSubscriptionResults =
            await newsletterSubscritionSurvey.show(6, 6);

          const answerCount = [
            contextResults,
            backgroundResults,
            useCaseResults,
            publishingUseCaseResults,
            priorToolsResults,
            newsletterSubscriptionResults,
          ].filter((value) => !_.isUndefined(value)).length;
          AnalyticsUtils.track(SurveyEvents.InitialSurveyAccepted, {
            answerCount,
          });

          MetadataService.instance().setInitialSurveyStatus(
            InitialSurveyStatusEnum.submitted,
          );

          vscode.window.showInformationMessage(
            "Survey submitted! Thanks for helping us make Dendron better 🌱",
          );
        } else {
          MetadataService.instance().setInitialSurveyStatus(
            InitialSurveyStatusEnum.cancelled,
          );
          vscode.window.showInformationMessage("Survey cancelled.");
          AnalyticsUtils.track(SurveyEvents.InitialSurveyRejected);
        }
      })
      .catch((error: unknown) => {
        Logger.error({
          msg: error instanceof Error ? error.message : String(error),
        });
      });
  }

  static async showLapsedUserSurvey() {
    if (getStage() === "test") {
      return;
    }
    AnalyticsUtils.track(SurveyEvents.LapsedUserSurveyPrompted);
    void Promise.resolve(
      vscode.window.showInformationMessage(
        "Could you share some feedback to help us improve?",
        { modal: true },
        { title: "Proceed" },
      ),
    )
      .then(async (resp) => {
        if (resp?.title === "Proceed") {
          const reasonSurvey = LapsedUserReasonSurvey.create();
          const onboardingSurvey = LapsedUserOnboardingSurvey.create();
          const additionalCommentSurvey =
            LapsedUserAdditionalCommentSurvey.create();
          const discordPlugSurvey = LapsedUserPlugDiscordSurvey.create();

          const reasonResults = await reasonSurvey.show(1, 4);
          const onboardingResults = await onboardingSurvey.show(2, 4);
          const additionCommentResult = await additionalCommentSurvey.show(
            3,
            4,
          );
          const discordPlugResult = await discordPlugSurvey.show(4, 4);

          if (onboardingSurvey.openOnboardingLink) {
            await vscode.commands.executeCommand(
              "vscode.open",
              vscode.Uri.parse(onboardingSurvey.CALENDLY_URL),
            );
          }

          if (discordPlugSurvey.openDiscordLink) {
            await vscode.commands.executeCommand(
              "vscode.open",
              vscode.Uri.parse(discordPlugSurvey.DISCORD_URL),
            );
          }

          const answerCount = [
            reasonResults,
            onboardingResults,
            additionCommentResult,
            discordPlugResult,
          ].filter((value) => !_.isUndefined(value)).length;
          AnalyticsUtils.track(SurveyEvents.LapsedUserSurveyAccepted, {
            answerCount,
          });

          MetadataService.instance().setLapsedUserSurveyStatus(
            LapsedUserSurveyStatusEnum.submitted,
          );

          vscode.window.showInformationMessage(
            "Survey submitted! Thanks for helping us make Dendron better 🌱",
          );
        } else {
          vscode.window.showInformationMessage("Survey cancelled.");
          AnalyticsUtils.track(SurveyEvents.LapsedUserSurveyRejected);
          MetadataService.instance().setLapsedUserSurveyStatus(
            LapsedUserSurveyStatusEnum.cancelled,
          );
        }
      })
      .catch((error: unknown) => {
        Logger.error({
          msg: error instanceof Error ? error.message : String(error),
        });
      });
  }

  static async showInactiveUserSurvey() {
    // do not show in test
    if (getStage() === "test") {
      return;
    }
    AnalyticsUtils.track(SurveyEvents.InactiveUserSurveyPrompted);
    void Promise.resolve(
      vscode.window.showInformationMessage(
        "Hey, we noticed you haven't used Dendron for a while. We would love to have you back! Could you give us some feedback on how we can do better?",
        { modal: true },
        { title: "Go to Survey" },
      ),
    )
      .then(async (resp) => {
        if (resp?.title === "Go to Survey") {
          const AIRTABLE_URL =
            "https://airtable.com/shry4eLgvVE6WR0Or?prefill_SurveyName=InactiveFeedback";
          VSCodeUtils.openLink(AIRTABLE_URL);

          MetadataService.instance().setInactiveUserMsgStatus(
            InactvieUserMsgStatusEnum.submitted,
          );
          vscode.window.showInformationMessage(
            "Thanks for helping us make Dendron better 🌱",
          );
          AnalyticsUtils.track(SurveyEvents.InactiveUserSurveyAccepted);
        } else {
          MetadataService.instance().setInactiveUserMsgStatus(
            InactvieUserMsgStatusEnum.cancelled,
          );
          vscode.window.showInformationMessage("Survey cancelled.");
          AnalyticsUtils.track(SurveyEvents.InactiveUserSurveyRejected);
        }
      })
      .catch((error: unknown) => {
        Logger.error({
          msg: error instanceof Error ? error.message : String(error),
        });
      });
  }
}
