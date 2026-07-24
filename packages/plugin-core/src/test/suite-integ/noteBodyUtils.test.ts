import { NoteUtils } from "@dendronhq/common-all";
import { describe, it } from "mocha";
import {
  extractOpenBullets,
  offlineAIScaffold,
  parseChatCompletionResponse,
  slugifyTaskTitle,
} from "../../utils/noteBodyUtils";
import { toWebviewNoteMeta } from "../../utils/webviewNoteMeta";
import { expect } from "../testUtilsv2";

describe("noteBodyUtils", () => {
  it("extractOpenBullets skips completed and keeps open items", () => {
    const body = [
      "# Inbox",
      "- buy milk",
      "- [ ] write report",
      "- [x] done already",
      "* star item",
      "- x",
      "",
    ].join("\n");
    const bullets = extractOpenBullets(body);
    expect(bullets).toEqual(["buy milk", "write report", "star item"]);
  });

  it("slugifyTaskTitle produces fname-safe slug", () => {
    expect(slugifyTaskTitle("Hello World!!")).toEqual("hello.world");
    expect(slugifyTaskTitle("  ")).toEqual("");
  });

  it("parseChatCompletionResponse handles openai + ollama shapes", () => {
    expect(
      parseChatCompletionResponse({
        choices: [{ message: { content: "hello" } }],
      })
    ).toEqual("hello");
    expect(
      parseChatCompletionResponse({ message: { content: "from-native" } })
    ).toEqual("from-native");
    expect(parseChatCompletionResponse({ response: "ollama-raw" })).toEqual(
      "ollama-raw"
    );
  });

  it("offlineAIScaffold mentions endpoint setup", () => {
    const out = offlineAIScaffold({
      prompt: "Summarize",
      noteFname: "foo",
      bodyPreview: "# Title\n\n- item one\n",
    });
    expect(out.includes("Offline scaffold")).toBeTruthy();
    expect(out.includes("item one")).toBeTruthy();
    expect(out.includes("Summarize")).toBeTruthy();
  });

  it("toWebviewNoteMeta strips body", () => {
    const note = NoteUtils.create({
      fname: "foo",
      vault: { fsPath: "vault" },
      body: "huge body content",
    });
    const meta = toWebviewNoteMeta(note as any);
    expect(meta?.body).toEqual("");
    expect(meta?.fname).toEqual("foo");
    expect(note.body).toEqual("huge body content");
  });
});
