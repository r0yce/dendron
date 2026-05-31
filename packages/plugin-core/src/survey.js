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
exports.SurveyUtils = exports.LapsedUserPlugDiscordSurvey = exports.LapsedUserAdditionalCommentSurvey = exports.LapsedUserOnboardingSurvey = exports.LapsedUserReasonSurvey = exports.NewsletterSubscriptionSurvey = exports.PublishingUseCaseSurvey = exports.PriorToolsSurvey = exports.UseCaseSurvey = exports.BackgroundSurvey = exports.ContextSurvey = exports.DendronQuickPickSurvey = exports.DendronQuickInputSurvey = void 0;
const common_all_1 = require("@dendronhq/common-all");
const analytics_1 = require("./utils/analytics");
const vscode = __importStar(require("vscode"));
const lodash_1 = __importDefault(require("lodash"));
const logger_1 = require("./logger");
const path_1 = require("path");
const vsCodeUtils_1 = require("./vsCodeUtils");
const engine_server_1 = require("@dendronhq/engine-server");
class DendronQuickInputSurvey {
    opts;
    constructor(opts) {
        this.opts = { ...opts, ignoreFocusOut: true };
    }
    async onAnswer(_opts) {
        return undefined;
    }
    onReject(_opts) {
        return undefined;
    }
    async show(step, total) {
        const progress = `Step ${step} of ${total}`;
        const title = this.opts.title;
        const showOpts = {
            ...this.opts,
            title: `${title} : ${progress}`,
        };
        const result = await vscode.window.showInputBox(showOpts);
        if (result) {
            await this.onAnswer(result);
        }
        else {
            this.onReject();
        }
        return result;
    }
}
exports.DendronQuickInputSurvey = DendronQuickInputSurvey;
class DendronQuickPickSurvey {
    choices;
    opts;
    constructor(opts) {
        const { choices, canPickMany, title } = opts;
        let placeHolder = opts.placeHolder;
        this.choices = choices;
        if (!placeHolder) {
            placeHolder = canPickMany ? "Check all that applies." : "Check one";
        }
        this.opts = { title, placeHolder, canPickMany, ignoreFocusOut: true };
    }
    getChoices() {
        return this.choices;
    }
    async onAnswer(_opts) {
        return undefined;
    }
    onReject(_opts) {
        return undefined;
    }
    async show(step, total) {
        const progress = `Step ${step} of ${total}`;
        const title = this.opts.title;
        const showOpts = {
            ...this.opts,
            title: `${title} : ${progress}`,
        };
        const results = await vscode.window.showQuickPick(this.choices, showOpts);
        if (results) {
            await this.onAnswer(results);
        }
        else {
            this.onReject();
        }
        return results;
    }
}
exports.DendronQuickPickSurvey = DendronQuickPickSurvey;
class ContextSurvey extends DendronQuickPickSurvey {
    static CHOICES = {
        "For work": "work",
        "For personal use": "personal",
        "All of the above": "all",
        Other: "other",
    };
    async onAnswer(result) {
        let maybeOtherResult;
        const answer = ContextSurvey.CHOICES[result.label];
        if (answer === "other") {
            maybeOtherResult = await vscode.window.showInputBox({
                ignoreFocusOut: true,
                placeHolder: "Type anything that applies.",
                prompt: 'You have checked "Other". Please describe what other context you intend to use Dendron.',
                title: "In what context do you intend to use Dendron? - Other",
            });
        }
        analytics_1.AnalyticsUtils.identify({ useContext: answer });
        analytics_1.AnalyticsUtils.track(common_all_1.SurveyEvents.ContextSurveyConfirm, {
            status: common_all_1.ConfirmStatus.accepted,
            result: answer,
            other: maybeOtherResult,
        });
    }
    onReject() {
        analytics_1.AnalyticsUtils.track(common_all_1.SurveyEvents.ContextSurveyConfirm, {
            status: common_all_1.ConfirmStatus.rejected,
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
exports.ContextSurvey = ContextSurvey;
class BackgroundSurvey extends DendronQuickPickSurvey {
    async onAnswer(result) {
        let maybeOtherResult;
        if (result.label === "Other") {
            maybeOtherResult = await vscode.window.showInputBox({
                ignoreFocusOut: true,
                placeHolder: "Type anything that applies.",
                prompt: 'You have checked "Other". Please describe what other backgrounds you have.',
                title: "What is your background? - Other",
            });
        }
        analytics_1.AnalyticsUtils.identify({ role: result.label });
        analytics_1.AnalyticsUtils.track(common_all_1.SurveyEvents.BackgroundAnswered, {
            results: [result.label], // passing as array because this used to be a multi-select survey
            other: maybeOtherResult,
        });
    }
    onReject() {
        analytics_1.AnalyticsUtils.track(common_all_1.SurveyEvents.BackgroundRejected);
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
exports.BackgroundSurvey = BackgroundSurvey;
class UseCaseSurvey extends DendronQuickPickSurvey {
    async onAnswer(results) {
        let maybeOtherResult;
        if (results.some((result) => result.label === "Other")) {
            maybeOtherResult = await vscode.window.showInputBox({
                ignoreFocusOut: true,
                placeHolder: "Type anything that applies.",
                prompt: 'You have checked "Other". Please describe what other use cases you have.',
                title: "What do you want to use Dendron for? - Other",
            });
        }
        const resultsList = results.map((result) => result.label);
        analytics_1.AnalyticsUtils.identify({ useCases: resultsList });
        analytics_1.AnalyticsUtils.track(common_all_1.SurveyEvents.UseCaseAnswered, {
            results: resultsList,
            other: maybeOtherResult,
        });
    }
    onReject() {
        analytics_1.AnalyticsUtils.track(common_all_1.SurveyEvents.UseCaseRejected);
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
exports.UseCaseSurvey = UseCaseSurvey;
class PriorToolsSurvey extends DendronQuickPickSurvey {
    async onAnswer(results) {
        let maybeOtherResult;
        if (results.some((result) => result.label === "Other")) {
            maybeOtherResult = await vscode.window.showInputBox({
                ignoreFocusOut: true,
                placeHolder: "Type anything that applies.",
                prompt: 'You have checked "Other". Please describe what other tools you have used.',
                title: "Are you coming from an existing tool? - Other",
            });
        }
        const resultsList = results.map((result) => result.label);
        analytics_1.AnalyticsUtils.identify({ priorTools: resultsList });
        analytics_1.AnalyticsUtils.track(common_all_1.SurveyEvents.PriorToolsAnswered, {
            results: results.map((result) => result.label),
            other: maybeOtherResult,
        });
        // Store the results into metadata so that we can later alter functionality
        // based on the user's response
        engine_server_1.MetadataService.instance().priorTools = resultsList.map((result) => engine_server_1.PriorTools[result]);
    }
    onReject() {
        analytics_1.AnalyticsUtils.track(common_all_1.SurveyEvents.PriorToolsRejected);
    }
    static create() {
        const title = "Are you coming from an existing tool?";
        const choices = [
            { label: engine_server_1.PriorTools.No },
            { label: engine_server_1.PriorTools.Foam },
            { label: engine_server_1.PriorTools.Roam },
            { label: engine_server_1.PriorTools.Logseq },
            { label: engine_server_1.PriorTools.Notion },
            { label: engine_server_1.PriorTools.OneNote },
            { label: engine_server_1.PriorTools.Obsidian },
            { label: engine_server_1.PriorTools.Evernote },
            { label: engine_server_1.PriorTools.Confluence },
            { label: engine_server_1.PriorTools.GoogleKeep },
            { label: engine_server_1.PriorTools.Other },
        ];
        return new PriorToolsSurvey({ title, choices, canPickMany: true });
    }
}
exports.PriorToolsSurvey = PriorToolsSurvey;
class PublishingUseCaseSurvey extends DendronQuickPickSurvey {
    static CHOICES = {
        "Yes, publishing is a very important use case for me.": "yes/important",
        "Yes, but I would only like to publish my notes to people I choose to.": "yes/restricted",
        "I haven't considered publishing my notes, but I am willing to try if it's easy.": "curious",
        "No, I do not wish to publish my notes.": "no",
    };
    async onAnswer(result) {
        const answer = PublishingUseCaseSurvey.CHOICES[result.label];
        analytics_1.AnalyticsUtils.identify({ publishingUseCase: answer });
        analytics_1.AnalyticsUtils.track(common_all_1.SurveyEvents.PublishingUseCaseAnswered, {
            answer,
        });
    }
    onReject() {
        analytics_1.AnalyticsUtils.track(common_all_1.SurveyEvents.PublishingUseCaseRejected);
    }
    static create() {
        const title = "Dendron lets you publish your notes as a static website. Is this something you'd be interested in?";
        const choices = Object.keys(PublishingUseCaseSurvey.CHOICES).map((key) => {
            return { label: key };
        });
        return new PublishingUseCaseSurvey({ title, choices, canPickMany: false });
    }
}
exports.PublishingUseCaseSurvey = PublishingUseCaseSurvey;
class NewsletterSubscriptionSurvey extends DendronQuickInputSurvey {
    async onAnswer(result) {
        analytics_1.AnalyticsUtils.identify({ email: result });
        analytics_1.AnalyticsUtils.track(common_all_1.SurveyEvents.NewsletterSubscriptionAnswered);
        (0, path_1.resolve)();
    }
    onReject() {
        analytics_1.AnalyticsUtils.track(common_all_1.SurveyEvents.NewsletterSubscriptionRejected);
    }
    static create() {
        const title = "Would you like to subscribe to our newsletter?";
        const placeHolder = "Enter your e-mail";
        return new NewsletterSubscriptionSurvey({ title, placeHolder });
    }
}
exports.NewsletterSubscriptionSurvey = NewsletterSubscriptionSurvey;
class LapsedUserReasonSurvey extends DendronQuickPickSurvey {
    async onAnswer(result) {
        const label = result.label;
        let extra;
        let reason;
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
        analytics_1.AnalyticsUtils.track(common_all_1.SurveyEvents.LapsedUserReasonAnswered, {
            reason,
            extra,
        });
    }
    onReject() {
        analytics_1.AnalyticsUtils.track(common_all_1.SurveyEvents.LapsedUserReasonRejected);
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
exports.LapsedUserReasonSurvey = LapsedUserReasonSurvey;
class LapsedUserOnboardingSurvey extends DendronQuickPickSurvey {
    CALENDLY_URL = "https://calendly.com/d/mqtk-rf7q/onboard";
    openOnboardingLink = false;
    async onAnswer(result) {
        if (result.label === "Yes") {
            this.openOnboardingLink = true;
            vscode.window.showInformationMessage("Thank you for considering an onboarding session.", {
                modal: true,
                detail: "We will take you to the link after the survey.",
            }, { title: "Proceed with Survey" });
        }
        analytics_1.AnalyticsUtils.track(common_all_1.SurveyEvents.LapsedUserGettingStartedHelpAnswered, {
            result: result.label,
        });
    }
    onReject() {
        analytics_1.AnalyticsUtils.track(common_all_1.SurveyEvents.LapsedUserGettingStartedHelpRejected);
    }
    static create() {
        const title = "We offer one-on-one onboarding sessions the help new users get started.";
        const choices = [{ label: "Yes" }, { label: "No" }];
        return new LapsedUserOnboardingSurvey({
            title,
            choices,
            canPickMany: false,
            placeHolder: "Would you like to schedule a 30 minute session?",
        });
    }
}
exports.LapsedUserOnboardingSurvey = LapsedUserOnboardingSurvey;
class LapsedUserAdditionalCommentSurvey extends DendronQuickInputSurvey {
    async onAnswer(result) {
        analytics_1.AnalyticsUtils.track(common_all_1.SurveyEvents.LapsedUserAdditionalCommentAnswered, {
            result,
        });
        (0, path_1.resolve)();
    }
    onReject() {
        analytics_1.AnalyticsUtils.track(common_all_1.SurveyEvents.LapsedUserAdditionalCommentRejected);
    }
    static create() {
        const title = "Do you have any other comments to leave about your experience?";
        return new LapsedUserAdditionalCommentSurvey({ title });
    }
}
exports.LapsedUserAdditionalCommentSurvey = LapsedUserAdditionalCommentSurvey;
class LapsedUserPlugDiscordSurvey extends DendronQuickPickSurvey {
    DISCORD_URL = "https://discord.gg/AE3NRw9";
    openDiscordLink = false;
    async onAnswer(result) {
        if (result.label === "Sure, take me to Discord.") {
            this.openDiscordLink = true;
        }
        analytics_1.AnalyticsUtils.track(common_all_1.SurveyEvents.LapsedUserDiscordPlugAnswered);
    }
    onReject() {
        analytics_1.AnalyticsUtils.track(common_all_1.SurveyEvents.LapsedUserDiscordPlugRejected);
    }
    static create() {
        const title = "Thanks for sharing feedback. One last thing!";
        const placeHolder = "We have a Discord community to help new users get started. Would you want an invite?";
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
exports.LapsedUserPlugDiscordSurvey = LapsedUserPlugDiscordSurvey;
class SurveyUtils {
    /**
     * Asks three questions about background, use case, and prior tools used.
     */
    static async showInitialSurvey() {
        if ((0, common_all_1.getStage)() === "test") {
            return;
        }
        analytics_1.AnalyticsUtils.track(common_all_1.SurveyEvents.InitialSurveyPrompted);
        vscode.window
            .showInformationMessage("Welcome to Dendron! 🌱", {
            modal: true,
            detail: "Would you like to tell us a bit about yourself? This info will be used to provide a better onboarding experience. It will take less than a minute to complete.",
        }, { title: "Proceed" }, { title: "Skip Survey" })
            .then(async (resp) => {
            if (resp?.title === "Proceed") {
                const contextSurvey = ContextSurvey.create();
                const backgroundSurvey = BackgroundSurvey.create();
                const useCaseSurvey = UseCaseSurvey.create();
                const publishingUseCaseSurvey = PublishingUseCaseSurvey.create();
                const priorToolSurvey = PriorToolsSurvey.create();
                const newsletterSubscritionSurvey = NewsletterSubscriptionSurvey.create();
                const contextResults = await contextSurvey.show(1, 6);
                const backgroundResults = await backgroundSurvey.show(2, 6);
                const useCaseResults = await useCaseSurvey.show(3, 6);
                const publishingUseCaseResults = await publishingUseCaseSurvey.show(4, 6);
                const priorToolsResults = await priorToolSurvey.show(5, 6);
                const newsletterSubscriptionResults = await newsletterSubscritionSurvey.show(6, 6);
                const answerCount = [
                    contextResults,
                    backgroundResults,
                    useCaseResults,
                    publishingUseCaseResults,
                    priorToolsResults,
                    newsletterSubscriptionResults,
                ].filter((value) => !lodash_1.default.isUndefined(value)).length;
                analytics_1.AnalyticsUtils.track(common_all_1.SurveyEvents.InitialSurveyAccepted, {
                    answerCount,
                });
                engine_server_1.MetadataService.instance().setInitialSurveyStatus(engine_server_1.InitialSurveyStatusEnum.submitted);
                vscode.window.showInformationMessage("Survey submitted! Thanks for helping us make Dendron better 🌱");
            }
            else {
                engine_server_1.MetadataService.instance().setInitialSurveyStatus(engine_server_1.InitialSurveyStatusEnum.cancelled);
                vscode.window.showInformationMessage("Survey cancelled.");
                analytics_1.AnalyticsUtils.track(common_all_1.SurveyEvents.InitialSurveyRejected);
            }
        })
            .catch((error) => {
            logger_1.Logger.error({ msg: error instanceof Error ? error.message : String(error) });
        });
    }
    static async showLapsedUserSurvey() {
        if ((0, common_all_1.getStage)() === "test") {
            return;
        }
        analytics_1.AnalyticsUtils.track(common_all_1.SurveyEvents.LapsedUserSurveyPrompted);
        await vscode.window
            .showInformationMessage("Could you share some feedback to help us improve?", { modal: true }, { title: "Proceed" })
            .then(async (resp) => {
            if (resp?.title === "Proceed") {
                const reasonSurvey = LapsedUserReasonSurvey.create();
                const onboardingSurvey = LapsedUserOnboardingSurvey.create();
                const additionalCommentSurvey = LapsedUserAdditionalCommentSurvey.create();
                const discordPlugSurvey = LapsedUserPlugDiscordSurvey.create();
                const reasonResults = await reasonSurvey.show(1, 4);
                const onboardingResults = await onboardingSurvey.show(2, 4);
                const additionCommentResult = await additionalCommentSurvey.show(3, 4);
                const discordPlugResult = await discordPlugSurvey.show(4, 4);
                if (onboardingSurvey.openOnboardingLink) {
                    await vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(onboardingSurvey.CALENDLY_URL));
                }
                if (discordPlugSurvey.openDiscordLink) {
                    await vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(discordPlugSurvey.DISCORD_URL));
                }
                const answerCount = [
                    reasonResults,
                    onboardingResults,
                    additionCommentResult,
                    discordPlugResult,
                ].filter((value) => !lodash_1.default.isUndefined(value)).length;
                analytics_1.AnalyticsUtils.track(common_all_1.SurveyEvents.LapsedUserSurveyAccepted, {
                    answerCount,
                });
                engine_server_1.MetadataService.instance().setLapsedUserSurveyStatus(engine_server_1.LapsedUserSurveyStatusEnum.submitted);
                vscode.window.showInformationMessage("Survey submitted! Thanks for helping us make Dendron better 🌱");
            }
            else {
                vscode.window.showInformationMessage("Survey cancelled.");
                analytics_1.AnalyticsUtils.track(common_all_1.SurveyEvents.LapsedUserSurveyRejected);
                engine_server_1.MetadataService.instance().setLapsedUserSurveyStatus(engine_server_1.LapsedUserSurveyStatusEnum.cancelled);
            }
        })
            .catch((error) => {
            logger_1.Logger.error({ msg: error instanceof Error ? error.message : String(error) });
        });
    }
    static async showInactiveUserSurvey() {
        // do not show in test
        if ((0, common_all_1.getStage)() === "test") {
            return;
        }
        analytics_1.AnalyticsUtils.track(common_all_1.SurveyEvents.InactiveUserSurveyPrompted);
        await vscode.window
            .showInformationMessage("Hey, we noticed you haven't used Dendron for a while. We would love to have you back! Could you give us some feedback on how we can do better?", { modal: true }, { title: "Go to Survey" })
            .then(async (resp) => {
            if (resp?.title === "Go to Survey") {
                const AIRTABLE_URL = "https://airtable.com/shry4eLgvVE6WR0Or?prefill_SurveyName=InactiveFeedback";
                vsCodeUtils_1.VSCodeUtils.openLink(AIRTABLE_URL);
                engine_server_1.MetadataService.instance().setInactiveUserMsgStatus(engine_server_1.InactvieUserMsgStatusEnum.submitted);
                vscode.window.showInformationMessage("Thanks for helping us make Dendron better 🌱");
                analytics_1.AnalyticsUtils.track(common_all_1.SurveyEvents.InactiveUserSurveyAccepted);
            }
            else {
                engine_server_1.MetadataService.instance().setInactiveUserMsgStatus(engine_server_1.InactvieUserMsgStatusEnum.cancelled);
                vscode.window.showInformationMessage("Survey cancelled.");
                analytics_1.AnalyticsUtils.track(common_all_1.SurveyEvents.InactiveUserSurveyRejected);
            }
        })
            .catch((error) => {
            logger_1.Logger.error({ msg: error instanceof Error ? error.message : String(error) });
        });
    }
}
exports.SurveyUtils = SurveyUtils;
//# sourceMappingURL=survey.js.map