import * as vscode from "vscode";
export declare class DendronQuickInputSurvey {
    opts: {
        title: string;
        ignoreFocusOut: boolean;
        placeHolder?: string;
        prompt?: string;
    };
    constructor(opts: {
        title: string;
        placeHolder?: string;
        prompt?: string;
    });
    onAnswer(_opts: any): Promise<void>;
    onReject(_opts?: any): void;
    show(step: number, total: number): Promise<string | undefined>;
}
export declare class DendronQuickPickSurvey {
    choices: readonly vscode.QuickPickItem[];
    opts: {
        canPickMany: boolean;
        title: string;
        ignoreFocusOut: boolean;
        placeHolder?: string;
    };
    constructor(opts: {
        choices: vscode.QuickPickItem[];
        canPickMany: boolean;
        title: string;
        placeHolder?: string;
    });
    getChoices(): readonly vscode.QuickPickItem[];
    onAnswer(_opts: any): Promise<void>;
    onReject(_opts?: any): void;
    show(step: number, total: number): Promise<vscode.QuickPickItem | undefined>;
}
export declare class ContextSurvey extends DendronQuickPickSurvey {
    static CHOICES: {
        [index: string]: string;
    };
    onAnswer(result: vscode.QuickPickItem): Promise<void>;
    onReject(): void;
    static create(): ContextSurvey;
}
export declare class BackgroundSurvey extends DendronQuickPickSurvey {
    onAnswer(result: vscode.QuickPickItem): Promise<void>;
    onReject(): void;
    static create(): BackgroundSurvey;
}
export declare class UseCaseSurvey extends DendronQuickPickSurvey {
    onAnswer(results: vscode.QuickPickItem[]): Promise<void>;
    onReject(): void;
    static create(): UseCaseSurvey;
}
export declare class PriorToolsSurvey extends DendronQuickPickSurvey {
    onAnswer(results: vscode.QuickPickItem[]): Promise<void>;
    onReject(): void;
    static create(): PriorToolsSurvey;
}
export declare class PublishingUseCaseSurvey extends DendronQuickPickSurvey {
    static CHOICES: {
        [index: string]: string;
    };
    onAnswer(result: vscode.QuickPickItem): Promise<void>;
    onReject(): void;
    static create(): PublishingUseCaseSurvey;
}
export declare class NewsletterSubscriptionSurvey extends DendronQuickInputSurvey {
    onAnswer(result: string): Promise<void>;
    onReject(): void;
    static create(): NewsletterSubscriptionSurvey;
}
export declare class LapsedUserReasonSurvey extends DendronQuickPickSurvey {
    onAnswer(result: vscode.QuickPickItem): Promise<void>;
    onReject(): void;
    static create(): LapsedUserReasonSurvey;
}
export declare class LapsedUserOnboardingSurvey extends DendronQuickPickSurvey {
    CALENDLY_URL: string;
    openOnboardingLink: boolean;
    onAnswer(result: vscode.QuickPickItem): Promise<void>;
    onReject(): void;
    static create(): LapsedUserOnboardingSurvey;
}
export declare class LapsedUserAdditionalCommentSurvey extends DendronQuickInputSurvey {
    onAnswer(result: string): Promise<void>;
    onReject(): void;
    static create(): LapsedUserAdditionalCommentSurvey;
}
export declare class LapsedUserPlugDiscordSurvey extends DendronQuickPickSurvey {
    DISCORD_URL: string;
    openDiscordLink: boolean;
    onAnswer(result: vscode.QuickPickItem): Promise<void>;
    onReject(): void;
    static create(): LapsedUserPlugDiscordSurvey;
}
export declare class SurveyUtils {
    /**
     * Asks three questions about background, use case, and prior tools used.
     */
    static showInitialSurvey(): Promise<void>;
    static showLapsedUserSurvey(): Promise<void>;
    static showInactiveUserSurvey(): Promise<void>;
}
