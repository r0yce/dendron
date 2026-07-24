import { describe, it } from "mocha";
import { expect } from "../testUtilsv2";
import {
  getFrontmatterEndingOffsetPosition,
  getOneIndexedFrontmatterEndingLineNumber,
  hasAnchorsToUpdate,
} from "../../utils/md/anchors";
import {
  filterCreateNewItem,
  filterDefaultItems,
  getQueryUpToLastDot,
  isCreateNewNotePicked,
  isInputEmpty,
} from "../../components/lookup/pickerFilters";
import { shouldBubbleUpCreateNew } from "../../components/lookup/pickerCreateNew";
import { sortBySimilarity } from "../../components/lookup/pickerSort";
import {
  CREATE_NEW_LABEL,
  MORE_RESULTS_LABEL,
} from "../../components/lookup/constants";
import { Location, Range, Uri } from "vscode";

describe("maintainabilityHelpers (wave 5)", () => {
  describe("md/anchors", () => {
    it("finds frontmatter ending offset and 1-indexed line", () => {
      const body = "---\nid: abc\n---\n\n# Hello\n";
      const offset = getFrontmatterEndingOffsetPosition(body);
      expect(typeof offset).toEqual("number");
      expect(offset! > 0).toBeTruthy();
      const line = getOneIndexedFrontmatterEndingLineNumber(body);
      // line of the closing --- is 3 in this document
      expect(line).toEqual(3);
    });

    it("returns undefined without frontmatter end marker", () => {
      expect(getFrontmatterEndingOffsetPosition("# no fm\n")).toEqual(
        undefined
      );
      expect(getOneIndexedFrontmatterEndingLineNumber("# no fm\n")).toEqual(
        undefined
      );
    });

    it("hasAnchorsToUpdate detects header and block anchors", () => {
      const loc = new Location(Uri.file("/tmp/x.md"), new Range(0, 0, 0, 1));
      const ref = {
        location: loc,
        matchText: "[[foo#heading]]",
        note: {} as any,
      };
      expect(hasAnchorsToUpdate(ref, ["heading"])).toBeTruthy();
      expect(hasAnchorsToUpdate(ref, ["other"])).toBeFalsy();

      const blockRef = {
        location: loc,
        matchText: "[[foo#^blockid]]",
        note: {} as any,
      };
      expect(hasAnchorsToUpdate(blockRef, ["blockid"])).toBeTruthy();
    });
  });

  describe("pickerFilters", () => {
    it("filters create-new and default items", () => {
      const items = [
        { label: "foo", fname: "foo" },
        { label: CREATE_NEW_LABEL, fname: "new" },
        { label: MORE_RESULTS_LABEL, fname: "more" },
      ] as any[];
      expect(filterCreateNewItem(items).map((i) => i.label)).toEqual([
        "foo",
        MORE_RESULTS_LABEL,
      ]);
      expect(filterDefaultItems(items).map((i) => i.label)).toEqual(["foo"]);
    });

    it("getQueryUpToLastDot and isInputEmpty", () => {
      expect(getQueryUpToLastDot("a.b.c")).toEqual("a.b");
      expect(getQueryUpToLastDot("abc")).toEqual("");
      expect(isInputEmpty(undefined)).toBeTruthy();
      expect(isInputEmpty("")).toBeTruthy();
      expect(isInputEmpty("x")).toBeFalsy();
    });

    it("isCreateNewNotePicked for stubs and create-new detail", () => {
      expect(
        isCreateNewNotePicked({
          label: "x",
          detail: "Note does not exist. Create?",
          stub: false,
        } as any)
      ).toBeTruthy();
      expect(
        isCreateNewNotePicked({
          label: "real",
          detail: "",
          stub: false,
          schemaStub: false,
        } as any)
      ).toBeFalsy();
    });
  });

  describe("pickerCreateNew + pickerSort", () => {
    it("shouldBubbleUpCreateNew respects exact match and special chars", () => {
      expect(
        shouldBubbleUpCreateNew({
          numberOfExactMatches: 0,
          querystring: "hello",
        })
      ).toBeTruthy();
      expect(
        shouldBubbleUpCreateNew({
          numberOfExactMatches: 1,
          querystring: "hello",
        })
      ).toBeFalsy();
    });

    it("sortBySimilarity ranks closer fname first", () => {
      const notes = [
        { fname: "zzz" },
        { fname: "hello.world" },
        { fname: "abc" },
      ] as any[];
      const sorted = sortBySimilarity(notes, "hello.world");
      expect(sorted[0]!.fname).toEqual("hello.world");
    });
  });
});
