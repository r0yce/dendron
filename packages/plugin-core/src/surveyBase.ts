/**
 * Base survey UI shells (input box / quick pick with step progress).
 */
import * as vscode from "vscode";

export class DendronQuickInputSurvey {
  opts: {
    title: string;
    ignoreFocusOut: boolean;
    placeHolder?: string;
    prompt?: string;
  };

  constructor(opts: { title: string; placeHolder?: string; prompt?: string }) {
    this.opts = { ...opts, ignoreFocusOut: true };
  }

  async onAnswer(_opts: any): Promise<void> {
    return undefined;
  }

  onReject(_opts?: any): void {
    return undefined;
  }

  async show(step: number, total: number) {
    const progress = `Step ${step} of ${total}`;
    const title = this.opts.title;
    const showOpts = {
      ...this.opts,
      title: `${title} : ${progress}`,
    };
    const result = await vscode.window.showInputBox(showOpts);
    if (result) {
      await this.onAnswer(result);
    } else {
      this.onReject();
    }

    return result;
  }
}

export class DendronQuickPickSurvey {
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
  }) {
    const { choices, canPickMany, title } = opts;
    let placeHolder = opts.placeHolder;
    this.choices = choices;

    if (!placeHolder) {
      placeHolder = canPickMany ? "Check all that applies." : "Check one";
    }

    this.opts = { title, placeHolder, canPickMany, ignoreFocusOut: true };
  }

  getChoices(): readonly vscode.QuickPickItem[] {
    return this.choices;
  }

  async onAnswer(_opts: any): Promise<void> {
    return undefined;
  }

  onReject(_opts?: any): void {
    return undefined;
  }

  async show(step: number, total: number) {
    const progress = `Step ${step} of ${total}`;
    const title = this.opts.title;
    const showOpts = {
      ...this.opts,
      title: `${title} : ${progress}`,
    };
    const results = await vscode.window.showQuickPick(this.choices, showOpts);
    if (results) {
      await this.onAnswer(results);
    } else {
      this.onReject();
    }

    return results;
  }
}
