import { NoteUtils } from "@dendronhq/common-all";
import { describe, it } from "mocha";
import {
  countOpenInboxBullets,
  extractOpenBullets,
  markBulletsProcessedInBody,
  offlineAIScaffold,
  parseChatCompletionResponse,
  parseOpenBulletLines,
  slugifyTaskTitle,
} from "../../utils/noteBodyUtils";
import { escapeHtml, escapeAttr } from "../../utils/htmlEscape";
import { toWebviewNoteMeta } from "../../utils/webviewNoteMeta";
import { expect } from "../testUtilsv2";
import { TaskNoteUtils } from "@dendronhq/common-all";

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

  it("countOpenInboxBullets and parseOpenBulletLines agree on open items", () => {
    const body = "- a\n- [x] done\n- b\n";
    expect(countOpenInboxBullets(body)).toEqual(2);
    const lines = parseOpenBulletLines(body);
    expect(lines.length).toEqual(2);
    expect(lines[0]!.text).toEqual("a");
  });

  it("markBulletsProcessedInBody checkmarks selected lines", () => {
    const body = "- todo one\n- keep\n";
    const out = markBulletsProcessedInBody(body, ["- todo one"]);
    expect(out.includes("- [x] todo one")).toBeTruthy();
    expect(out.includes("- keep")).toBeTruthy();
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

  it("htmlEscape escapes tags and attrs", () => {
    expect(escapeHtml(`<a href="x">`)).toEqual("&lt;a href=&quot;x&quot;&gt;");
    expect(escapeAttr("a'b")).toEqual("a&#39;b");
  });

  it("TaskNoteUtils board column and open helpers", () => {
    const openNote = NoteUtils.create({
      fname: "task.a",
      vault: { fsPath: "v" },
      custom: { status: "" },
    });
    const doneNote = NoteUtils.create({
      fname: "task.b",
      vault: { fsPath: "v" },
      custom: { status: "done" },
    });
    const wipNote = NoteUtils.create({
      fname: "task.c",
      vault: { fsPath: "v" },
      custom: { status: "wip" },
    });
    expect(TaskNoteUtils.isTaskNote(openNote as any)).toBeTruthy();
    expect(TaskNoteUtils.isOpenTaskNote(openNote as any)).toBeTruthy();
    expect(TaskNoteUtils.isOpenTaskNote(doneNote as any)).toBeFalsy();
    expect(TaskNoteUtils.getBoardColumn(openNote as any)).toEqual("open");
    expect(TaskNoteUtils.getBoardColumn(doneNote as any)).toEqual("done");
    expect(TaskNoteUtils.getBoardColumn(wipNote as any)).toEqual("wip");
  });
});
