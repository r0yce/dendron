import { PreSetupHookFunction } from "@dendronhq/common-test-utils";
/**
 * Notes created:
 *   - vault1:
 *     - foo
 *     - foo.ch1
 *   - vault2:
 *     - bar
 */
export declare const setupBasic: PreSetupHookFunction;
/**
 <pre>
 /vault1
 ├── bar.ch1.gch1.ggch1.md
 ├── bar.ch1.gch1.md
 ├── bar.ch1.md
 ├── bar.md
 ├── foo.ch1.gch1.ggch1.md
 ├── foo.ch1.gch1.md
 ├── foo.ch1.gch2.md
 ├── foo.ch1.md
 ├── foo.ch2.md
 ├── foo.md
 ├── root.md
 └── root.schema.yml

/vault2
 ├── root.md
 └── root.schema.yml

 /vault3
 ├── root.md
 └── root.schema.yml
</pre>
 * */
export declare const setupHierarchyForLookupTests: PreSetupHookFunction;
export declare const setupJournals: PreSetupHookFunction;
export declare const setupBasicMulti: PreSetupHookFunction;
/**
 *
 * - foo
 * ```
 * ![[foo.one]]
 * ```
 *
 * - foo.one
 * ```
 * # Foo.One
 * ![[foo.two]]
 * Regular wikilink: [[foo.two]]
 * ```
 *
 * - foo.two
 * ```
 * # Foo.Two
 * blah
 * ```
 *
 *
 */
export declare const setupNoteRefRecursive: PreSetupHookFunction;
/**
 * Diamond schema is laid out such that:
 *    bar
 *   /   \
 * ch1   ch2
 *   \   /
 *    gch
 * */
export declare const setupSchemaWithDiamondGrandchildren: PreSetupHookFunction;
export declare const setupSchemaPreseet: PreSetupHookFunction;
/**
 * Diamond schema is laid out such that:
 *    bar
 *   /   \
 * ch1   ch2 (namespace: true)
 *   \   /
 *    gch
 * */
export declare const setupSchemaWithDiamondAndParentNamespace: PreSetupHookFunction;
/**
 * Sets up schema which includes a schema that has Diamond grandchildren
 *
 * */
export declare const setupSchemaWithIncludeOfDiamond: PreSetupHookFunction;
/**
 * Sets up workspace which has a schema that uses YAML expansion syntax ('<<' type of expansion). */
export declare const setupSchemaWithExpansion: PreSetupHookFunction;
export declare const setupInlineSchema: PreSetupHookFunction;
export declare const setupSchemaPresetWithNamespaceTemplateBase: PreSetupHookFunction;
export declare const setupSchemaPresetWithNamespaceTemplateMulti: PreSetupHookFunction;
export declare const setupSchemaPresetWithNamespaceTemplate: PreSetupHookFunction;
export declare const setupEmpty: PreSetupHookFunction;
export declare const setupLinks: PreSetupHookFunction;
export declare const setupLinksMulti: PreSetupHookFunction;
export declare const setupLinksBase: PreSetupHookFunction;
/** Creates 2 notes with same fname in 2 different vaults, and a note named
 * "test" in second vault with both valid and invalid wikilinks.
 *
 * See [[scratch.2021.07.15.205433.inconsistent-ref-and-link-behavior]] for the
 * invalid behaviors that this is intended to test for. The only difference is
 * that vaultThree is the real vault and vault3 is the bad one.
 *
 * @returns the test note with the wikilinks.
 */
export declare const setupMultiVaultSameFname: PreSetupHookFunction;
export declare const setupLinksWithVaultBase: PreSetupHookFunction;
export declare const setupRefs: PreSetupHookFunction;
export declare const ENGINE_HOOKS_BASE: {
    WITH_LINKS: PreSetupHookFunction;
};
export declare const ENGINE_HOOKS: {
    setupBasic: PreSetupHookFunction;
    setupHierarchyForLookupTests: PreSetupHookFunction;
    setupSchemaPreseet: PreSetupHookFunction;
    setupSchemaWithDiamondGrandchildren: PreSetupHookFunction;
    setupSchemaWithIncludeOfDiamond: PreSetupHookFunction;
    setupSchemaWithDiamondAndParentNamespace: PreSetupHookFunction;
    setupSchemaPresetWithNamespaceTemplate: PreSetupHookFunction;
    setupInlineSchema: PreSetupHookFunction;
    setupSchemaWithExpansion: PreSetupHookFunction;
    setupNoteRefRecursive: PreSetupHookFunction;
    setupJournals: PreSetupHookFunction;
    setupEmpty: PreSetupHookFunction;
    setupLinks: PreSetupHookFunction;
    setupRefs: PreSetupHookFunction;
};
export declare const ENGINE_HOOKS_MULTI: {
    setupBasicMulti: PreSetupHookFunction;
    setupLinksMulti: PreSetupHookFunction;
    setupSchemaPresetWithNamespaceTemplateMulti: PreSetupHookFunction;
    setupMultiVaultSameFname: PreSetupHookFunction;
};
