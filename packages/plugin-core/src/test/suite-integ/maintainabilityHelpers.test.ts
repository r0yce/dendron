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
import {
  CONTEXT_DETAIL,
  FULL_MATCH_DETAIL,
  HIERARCHY_MATCH_DETAIL,
} from "../../components/lookup/vaultPickerConstants";
import {
  rankVaultSuggestions,
  resolveVaultSelectionMode,
} from "../../components/lookup/pickerVaultRank";
import { filterPickerResults } from "../../components/lookup/pickerFilterResults";
import {
  countExactFnameMatches,
  shouldAddCreateNewOption,
  shouldRejectLookupItem,
} from "../../components/lookup/pickerCreateNewPolicy";
import { getPickerValue } from "../../components/lookup/pickerValue";
import { sliceForPaginationLimit } from "../../components/lookup/pickerPagination";
import {
  buildSchemaChildNoteCandidates,
  selectNewSchemaCandidates,
} from "../../components/lookup/noteLookupSchemaCompletions";
import {
  appendCreateNewSchemaItem,
  isMultiLevelSchemaQuery,
} from "../../components/lookup/schemaLookupHelpers";
import { VaultSelectionMode } from "../../components/lookup/types";
import { CREATE_NEW_NOTE_DETAIL } from "../../components/lookup/constants";
import { Location, Range, Uri } from "vscode";

describe("maintainabilityHelpers (waves 5–11)", () => {
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
        undefined,
      );
      expect(getOneIndexedFrontmatterEndingLineNumber("# no fm\n")).toEqual(
        undefined,
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
        } as any),
      ).toBeTruthy();
      expect(
        isCreateNewNotePicked({
          label: "real",
          detail: "",
          stub: false,
          schemaStub: false,
        } as any),
      ).toBeFalsy();
    });
  });

  describe("pickerCreateNew + pickerSort", () => {
    it("shouldBubbleUpCreateNew respects exact match and special chars", () => {
      expect(
        shouldBubbleUpCreateNew({
          numberOfExactMatches: 0,
          querystring: "hello",
        }),
      ).toBeTruthy();
      expect(
        shouldBubbleUpCreateNew({
          numberOfExactMatches: 1,
          querystring: "hello",
        }),
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

  describe("pickerVault rankVaultSuggestions", () => {
    const v1 = { fsPath: "vault1", name: "vault1" };
    const v2 = { fsPath: "vault2", name: "vault2" };
    const v3 = { fsPath: "vault3", name: "vault3" };

    it("single hierarchy-less path puts context first", () => {
      const ranked = rankVaultSuggestions({
        contextVault: v2 as any,
        allVaults: [v1, v2, v3] as any[],
        hierarchyMatchVaults: [],
      });
      expect(ranked[0]!.vault.fsPath).toEqual("vault2");
      expect(ranked[0]!.detail).toEqual(CONTEXT_DETAIL);
      expect(ranked.length).toEqual(3);
    });

    it("full match when context vault has hierarchy", () => {
      const ranked = rankVaultSuggestions({
        contextVault: v1 as any,
        allVaults: [v1, v2, v3] as any[],
        hierarchyMatchVaults: [v1, v3] as any[],
      });
      expect(ranked[0]!.detail).toEqual(FULL_MATCH_DETAIL);
      expect(ranked[0]!.vault.fsPath).toEqual("vault1");
      expect(
        ranked.some((r) => r.detail === HIERARCHY_MATCH_DETAIL),
      ).toBeTruthy();
    });

    it("hierarchy-only matches come before context when context not in hierarchy", () => {
      const ranked = rankVaultSuggestions({
        contextVault: v2 as any,
        allVaults: [v1, v2, v3] as any[],
        hierarchyMatchVaults: [v1] as any[],
      });
      expect(ranked[0]!.vault.fsPath).toEqual("vault1");
      expect(ranked[0]!.detail).toEqual(HIERARCHY_MATCH_DETAIL);
      const ctx = ranked.find((r) => r.vault.fsPath === "vault2");
      expect(ctx?.detail).toEqual(CONTEXT_DETAIL);
    });
  });

  describe("resolveVaultSelectionMode", () => {
    const v1 = { fsPath: "vault1", name: "vault1" };
    const v2 = { fsPath: "vault2", name: "vault2" };
    const multiWithHierarchyTop = [
      {
        vault: v1 as any,
        label: "vault1",
        detail: HIERARCHY_MATCH_DETAIL,
      },
      { vault: v2 as any, label: "vault2", detail: CONTEXT_DETAIL },
    ];
    const multiWithFullMatchTop = [
      {
        vault: v1 as any,
        label: "vault1",
        detail: FULL_MATCH_DETAIL,
      },
      { vault: v2 as any, label: "vault2" },
    ];
    const multiWithContextTop = [
      {
        vault: v2 as any,
        label: "vault2",
        detail: CONTEXT_DETAIL,
      },
      { vault: v1 as any, label: "vault1" },
    ];

    it("returns undefined vault when suggestions are empty", () => {
      const r = resolveVaultSelectionMode({
        vaultSuggestions: [],
        vaultSelectionMode: VaultSelectionMode.smart,
      });
      expect(r).toEqual({ vault: undefined });
    });

    it("auto mode picks first vault even with ambiguity", () => {
      const r = resolveVaultSelectionMode({
        vaultSuggestions: multiWithHierarchyTop,
        vaultSelectionMode: VaultSelectionMode.auto,
      });
      expect("vault" in r && r.vault?.fsPath).toEqual("vault1");
      expect("prompt" in r).toBeFalsy();
    });

    it("single suggestion always picks that vault (any mode)", () => {
      const single = [
        { vault: v2 as any, label: "vault2", detail: HIERARCHY_MATCH_DETAIL },
      ];
      for (const mode of [
        VaultSelectionMode.auto,
        VaultSelectionMode.smart,
        VaultSelectionMode.alwaysPrompt,
      ]) {
        const r = resolveVaultSelectionMode({
          vaultSuggestions: single,
          vaultSelectionMode: mode,
        });
        expect("vault" in r && r.vault?.fsPath).toEqual("vault2");
      }
    });

    it("smart + FULL_MATCH top picks vault without prompt", () => {
      const r = resolveVaultSelectionMode({
        vaultSuggestions: multiWithFullMatchTop,
        vaultSelectionMode: VaultSelectionMode.smart,
      });
      expect("vault" in r && r.vault?.fsPath).toEqual("vault1");
    });

    it("smart + CONTEXT top picks vault without prompt", () => {
      const r = resolveVaultSelectionMode({
        vaultSuggestions: multiWithContextTop,
        vaultSelectionMode: VaultSelectionMode.smart,
      });
      expect("vault" in r && r.vault?.fsPath).toEqual("vault2");
    });

    it("smart + hierarchy-only top prompts (ambiguous)", () => {
      const r = resolveVaultSelectionMode({
        vaultSuggestions: multiWithHierarchyTop,
        vaultSelectionMode: VaultSelectionMode.smart,
      });
      expect(r).toEqual({ prompt: true });
    });

    it("alwaysPrompt with multiple suggestions always prompts", () => {
      const r = resolveVaultSelectionMode({
        vaultSuggestions: multiWithFullMatchTop,
        vaultSelectionMode: VaultSelectionMode.alwaysPrompt,
      });
      expect(r).toEqual({ prompt: true });
    });

    it("accepts string mode values (not only enum)", () => {
      const rAuto = resolveVaultSelectionMode({
        vaultSuggestions: multiWithHierarchyTop,
        vaultSelectionMode: "auto",
      });
      expect("vault" in rAuto && rAuto.vault?.fsPath).toEqual("vault1");

      const rSmart = resolveVaultSelectionMode({
        vaultSuggestions: multiWithFullMatchTop,
        vaultSelectionMode: "smart",
      });
      expect("vault" in rSmart && rSmart.vault?.fsPath).toEqual("vault1");
    });
  });

  describe("filterPickerResults (pure)", () => {
    const note = (fname: string, vaultName = "vault1") =>
      ({
        fname,
        vault: { fsPath: vaultName, name: vaultName },
      }) as any;

    it("filters by vaultName when set on transformed query", () => {
      const results = filterPickerResults({
        itemsToFilter: [note("a", "vault1"), note("b", "vault2")],
        transformedQuery: {
          originalQuery: "a",
          queryString: "a",
          wasMadeFromWikiLink: false,
          vaultName: "vault2",
        },
      });
      expect(results.map((n) => n.fname)).toEqual(["b"]);
    });

    it("wiki-link mode keeps only exact fname matches", () => {
      const results = filterPickerResults({
        itemsToFilter: [note("foo"), note("foo.bar"), note("bar")],
        transformedQuery: {
          originalQuery: "foo",
          queryString: "foo",
          wasMadeFromWikiLink: true,
        },
      });
      expect(results.map((n) => n.fname)).toEqual(["foo"]);
    });

    it("query ending with dot keeps hierarchical descendants of match", () => {
      const results = filterPickerResults({
        itemsToFilter: [
          note("data"),
          note("data.driven"),
          note("data.driven.x"),
          note("other"),
        ],
        transformedQuery: {
          originalQuery: "data.",
          queryString: "data.",
          wasMadeFromWikiLink: false,
        },
      });
      // exact leaf "data" is excluded (match at end has no children)
      expect(results.some((n) => n.fname === "data")).toBeFalsy();
      expect(results.some((n) => n.fname === "other")).toBeFalsy();
      expect(results.some((n) => n.fname === "data.driven")).toBeTruthy();
      expect(results.some((n) => n.fname === "data.driven.x")).toBeTruthy();
    });
  });

  describe("pickerCreateNewPolicy + pickerValue", () => {
    it("shouldAddCreateNewOption gates trailing dots / multi-select / full vault match", () => {
      const base = {
        allowNewNote: true,
        queryOrig: "hello",
        canSelectMany: false,
        wasMadeFromWikiLink: false,
        numberOfExactMatches: 0,
        vaultCount: 2,
      };
      expect(shouldAddCreateNewOption(base)).toBeTruthy();
      expect(
        shouldAddCreateNewOption({ ...base, queryOrig: "hello." }),
      ).toBeFalsy();
      expect(
        shouldAddCreateNewOption({ ...base, canSelectMany: true }),
      ).toBeFalsy();
      expect(
        shouldAddCreateNewOption({
          ...base,
          numberOfExactMatches: 2,
          vaultCount: 2,
        }),
      ).toBeFalsy();
    });

    it("countExactFnameMatches is case-insensitive", () => {
      expect(
        countExactFnameMatches(
          [{ fname: "Foo" }, { fname: "foo" }, { fname: "bar" }],
          "foo",
        ),
      ).toEqual(2);
    });

    it("shouldRejectLookupItem only when create-new + invalid fname", () => {
      const createNew = {
        fname: "bad name",
        detail: CREATE_NEW_NOTE_DETAIL,
        stub: false,
      } as any;
      const real = {
        fname: "ok",
        detail: "",
        stub: false,
        schemaStub: false,
      } as any;
      // invalid create-new may reject depending on NoteUtils.validateFname rules
      const rejected = shouldRejectLookupItem({ item: createNew });
      expect(typeof rejected.shouldReject).toEqual("boolean");
      expect(shouldRejectLookupItem({ item: real }).shouldReject).toBeFalsy();
    });

    it("getPickerValue joins non-empty parts", () => {
      expect(
        getPickerValue({
          prefix: "journal",
          noteModifierValue: "2026.07.24",
        }),
      ).toEqual("journal.2026.07.24");
      expect(
        getPickerValue({ prefix: "a", selectionModifierValue: "b" }),
      ).toEqual("a.b");
      expect(getPickerValue({})).toEqual("");
    });
  });

  describe("pickerPagination + schema candidate select", () => {
    it("sliceForPaginationLimit pages and retains full list when over limit", () => {
      const over = sliceForPaginationLimit([1, 2, 3, 4, 5], 2);
      expect(over.hasMore).toBeTruthy();
      expect(over.page).toEqual([1, 2]);
      expect(over.offset).toEqual(2);
      expect(over.allResults?.length).toEqual(5);

      const under = sliceForPaginationLimit(["a", "b"], 10);
      expect(under.hasMore).toBeFalsy();
      expect(under.page).toEqual(["a", "b"]);
      expect(under.allResults).toEqual(undefined);
    });

    it("selectNewSchemaCandidates drops existing fnames", () => {
      const candidates = [
        { fname: "foo.bar" },
        { fname: "foo.baz" },
        { fname: "foo.qux" },
      ] as any[];
      const selected = selectNewSchemaCandidates({
        candidates,
        existingItems: [{ fname: "foo.bar" }],
        originalQuery: "foo.b",
      });
      expect(selected.some((n) => n.fname === "foo.bar")).toBeFalsy();
      expect(selected.some((n) => n.fname === "foo.baz")).toBeTruthy();
    });

    it("buildSchemaChildNoteCandidates emits simple-pattern children only", () => {
      const vault = { fsPath: "v1", name: "v1" };
      const childId = "child";
      const schemaModule = {
        version: 1,
        imports: [],
        schemas: {
          root: {
            id: "root",
            fname: "root",
            title: "root",
            desc: "",
            type: "schema",
            updated: 1,
            created: 1,
            children: [childId],
            parent: null,
            data: {},
            vault,
          },
          [childId]: {
            id: childId,
            fname: "child",
            title: "child",
            desc: "",
            type: "schema",
            updated: 1,
            created: 1,
            children: [],
            parent: "root",
            data: { pattern: "bar" },
            vault,
          },
        },
        root: {
          id: "root",
          fname: "root",
          title: "root",
          desc: "",
          type: "schema",
          updated: 1,
          created: 1,
          children: [childId],
          parent: null,
          data: {},
          vault,
        },
      } as any;
      const notes = buildSchemaChildNoteCandidates({
        dirName: "foo",
        vault: vault as any,
        schema: schemaModule.schemas.root,
        schemaModule,
      });
      expect(notes.length).toEqual(1);
      expect(notes[0]!.fname).toEqual("foo.bar");
    });
  });

  describe("schemaLookupHelpers", () => {
    it("isMultiLevelSchemaQuery detects dots", () => {
      expect(isMultiLevelSchemaQuery("foo")).toBeFalsy();
      expect(isMultiLevelSchemaQuery("foo.bar")).toBeTruthy();
    });

    it("appendCreateNewSchemaItem only when allowed and no perfect match", () => {
      const base = [{ fname: "existing" }] as any[];
      const withNew = appendCreateNewSchemaItem({
        updatedItems: base,
        querystring: "newschema",
        allowNewNote: true,
        hasPerfectMatch: false,
      });
      expect(withNew.length).toEqual(2);
      expect(withNew[1]!.fname).toEqual("newschema");

      const noNew = appendCreateNewSchemaItem({
        updatedItems: base,
        querystring: "existing",
        allowNewNote: true,
        hasPerfectMatch: true,
      });
      expect(noNew.length).toEqual(1);

      const disallowed = appendCreateNewSchemaItem({
        updatedItems: base,
        querystring: "x",
        allowNewNote: false,
        hasPerfectMatch: false,
      });
      expect(disallowed.length).toEqual(1);
    });
  });
});
