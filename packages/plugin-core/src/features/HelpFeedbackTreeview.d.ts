import * as vscode from "vscode";
declare enum MenuItem {
    getStarted = "Get Started",
    readDocs = "Read Documentation",
    seeFaq = "See FAQ",
    reviewIssues = "Review Issues",
    reportIssue = "Report Issue",
    joinCommunity = "Join our Community!",
    followUs = "Follow our Progress"
}
/**
 * Creates a tree view for the basic 'Help and Feedback' panel in the Dendron
 * Custom View Container
 * @returns
 */
export default function setupHelpFeedbackTreeView(): vscode.TreeView<MenuItem>;
export {};
