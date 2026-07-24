import * as vscode from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { BasicCommand } from "./base";

type CommandOpts = { prompt?: string };
type CommandOutput = void;

/**
 * Sprint 3: Local AI assist scaffold (opt-in).
 *
 * Does not call cloud APIs by default. When `dendron.localAI.enabled` is true:
 * - builds a local prompt package from the active note
 * - if `dendron.localAI.endpoint` is set, POSTs JSON { prompt, note } and shows the response
 * - otherwise generates a deterministic local outline (offline scaffold)
 */
export class LocalAIAssistCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.LOCAL_AI_ASSIST.key;
  static requireActiveWorkspace = true;

  constructor(private _ext: IDendronExtension) {
    super();
  }

  async gatherInputs(opts?: CommandOpts): Promise<CommandOpts | undefined> {
    const cfg = vscode.workspace.getConfiguration();
    const enabled = cfg.get<boolean>("dendron.localAI.enabled", false);
    if (!enabled) {
      const pick = await vscode.window.showWarningMessage(
        "Local AI Assist is disabled (opt-in). Enable it in Settings → Dendron: Local AI Enabled?",
        "Open Settings",
        "Enable Now"
      );
      if (pick === "Open Settings") {
        await vscode.commands.executeCommand(
          "workbench.action.openSettings",
          "dendron.localAI"
        );
      } else if (pick === "Enable Now") {
        await cfg.update(
          "dendron.localAI.enabled",
          true,
          vscode.ConfigurationTarget.Workspace
        );
        vscode.window.showInformationMessage(
          "Local AI enabled for this workspace. Run the command again."
        );
      }
      return;
    }

    if (opts?.prompt) {
      return opts;
    }
    const prompt = await vscode.window.showInputBox({
      title: "Local AI Assist",
      placeHolder: "e.g. Summarize this note / Extract action items",
      prompt: "What should we do with the active note?",
      ignoreFocusOut: true,
    });
    if (prompt === undefined) {
      return;
    }
    return { prompt: prompt.trim() || "Summarize this note" };
  }

  async execute(opts: CommandOpts): Promise<CommandOutput> {
    const prompt = opts.prompt || "Summarize this note";
    const note = await this._ext.wsUtils.getActiveNote();
    if (!note) {
      vscode.window.showWarningMessage(
        "Open a Dendron note first, then run Local AI Assist."
      );
      return;
    }

    const bodyPreview = (note.body || "").slice(0, 4000);
    const cfg = vscode.workspace.getConfiguration();
    const endpoint = cfg.get<string>("dendron.localAI.endpoint", "")?.trim();

    let result: string;
    if (endpoint) {
      try {
        result = await this.callLocalEndpoint(endpoint, {
          prompt,
          note: {
            fname: note.fname,
            title: note.title,
            body: bodyPreview,
          },
        });
      } catch (err: any) {
        vscode.window.showErrorMessage(
          `Local AI endpoint failed: ${err?.message || String(err)}`
        );
        return;
      }
    } else {
      result = this.offlineScaffold({ prompt, noteFname: note.fname, bodyPreview });
    }

    const doc = await vscode.workspace.openTextDocument({
      content: [
        `# Local AI Assist`,
        ``,
        `**Note:** ${note.fname}`,
        `**Prompt:** ${prompt}`,
        `**Mode:** ${endpoint ? `endpoint \`${endpoint}\`` : "offline scaffold"}`,
        ``,
        `---`,
        ``,
        result,
        ``,
      ].join("\n"),
      language: "markdown",
    });
    await vscode.window.showTextDocument(doc, { preview: true });
  }

  private offlineScaffold(opts: {
    prompt: string;
    noteFname: string;
    bodyPreview: string;
  }): string {
    const lines = opts.bodyPreview
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const headings = lines.filter((l) => l.startsWith("#")).slice(0, 12);
    const bullets = lines
      .filter((l) => l.startsWith("- ") || l.startsWith("* "))
      .slice(0, 12);

    return [
      `## Offline scaffold (no model endpoint configured)`,
      ``,
      `This is a **local structure assist**, not a model completion.`,
      `Set \`dendron.localAI.endpoint\` to a local OpenAI-compatible URL to use a real model.`,
      ``,
      `### Your prompt`,
      opts.prompt,
      ``,
      `### Note structure`,
      headings.length
        ? headings.map((h) => `- ${h}`).join("\n")
        : `- (no headings found in first ${opts.bodyPreview.length} chars)`,
      ``,
      `### Candidate bullets`,
      bullets.length
        ? bullets.map((b) => `- ${b.replace(/^[-*]\s+/, "")}`).join("\n")
        : `- (no list items found)`,
      ``,
      `### Suggested next steps`,
      `- [ ] Refine the note title / hierarchy under \`${opts.noteFname}\``,
      `- [ ] Promote any capture bullets into task notes`,
      `- [ ] Link related concepts with wiki-links`,
      ``,
    ].join("\n");
  }

  private async callLocalEndpoint(
    endpoint: string,
    payload: {
      prompt: string;
      note: { fname: string; title: string; body: string };
    }
  ): Promise<string> {
    // Minimal OpenAI-compatible chat/completions shape for local servers (ollama, lmstudio, etc.)
    const body = {
      model: vscode.workspace
        .getConfiguration()
        .get<string>("dendron.localAI.model", "local"),
      messages: [
        {
          role: "system",
          content:
            "You are a local assistant for Dendron notes. Be concise and practical.",
        },
        {
          role: "user",
          content: `${payload.prompt}\n\n# ${payload.note.title} (${payload.note.fname})\n\n${payload.note.body}`,
        },
      ],
      temperature: 0.2,
    };

    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
    }
    const json = (await resp.json()) as any;
    const text =
      json?.choices?.[0]?.message?.content ||
      json?.message?.content ||
      json?.response ||
      JSON.stringify(json, null, 2);
    return String(text);
  }
}
