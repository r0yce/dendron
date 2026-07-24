import * as vscode from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import {
  offlineAIScaffold,
  parseChatCompletionResponse,
} from "../utils/noteBodyUtils";
import { BasicCommand } from "./base";

type CommandOpts = { prompt?: string };
type CommandOutput = void;

/** Default OpenAI-compatible Ollama chat completions URL. */
export const DEFAULT_OLLAMA_ENDPOINT =
  "http://127.0.0.1:11434/v1/chat/completions";
/** Default model tag for Ollama users (pull with `ollama pull llama3.2`). */
export const DEFAULT_OLLAMA_MODEL = "llama3.2";

/**
 * Sprint 3: Local AI assist scaffold (opt-in).
 *
 * Does not call cloud APIs by default. When `dendron.localAI.enabled` is true:
 * - builds a local prompt package from the active note
 * - if `dendron.localAI.endpoint` is set, POSTs OpenAI-compatible chat JSON
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
      result = offlineAIScaffold({
        prompt,
        noteFname: note.fname,
        bodyPreview,
      });
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

  private async callLocalEndpoint(
    endpoint: string,
    payload: {
      prompt: string;
      note: { fname: string; title: string; body: string };
    }
  ): Promise<string> {
    // OpenAI-compatible chat/completions for Ollama, LM Studio, etc.
    const model = vscode.workspace
      .getConfiguration()
      .get<string>("dendron.localAI.model", DEFAULT_OLLAMA_MODEL);
    const body = {
      model,
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

    const controller = new AbortController();
    const timeoutMs = 30000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
      }
      const json = await resp.json();
      return parseChatCompletionResponse(json);
    } catch (err: any) {
      if (err?.name === "AbortError") {
        throw new Error(
          `Local AI timed out after ${timeoutMs}ms. Is Ollama running? Try: ollama serve && ollama pull ${model}`
        );
      }
      const msg = err?.message || String(err);
      if (
        /ECONNREFUSED|fetch failed|NetworkError|Failed to fetch/i.test(msg)
      ) {
        throw new Error(
          `Cannot reach local AI at ${endpoint}. Is Ollama running? Example: ollama serve && ollama pull ${model}`
        );
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}
