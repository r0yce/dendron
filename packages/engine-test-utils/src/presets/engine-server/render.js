"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENGINE_RENDER_PRESETS = void 0;
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const utils_1 = require("./utils");
const NOTES = {
    BASIC: new common_test_utils_1.TestPresetEntryV4(async ({ engine }) => {
        const { data } = await engine.renderNote({
            id: "foo",
        });
        return [
            {
                actual: true,
                expected: await common_test_utils_1.AssertUtils.assertInString({
                    body: data,
                    match: ["<p>foo body</p>"],
                }),
                msg: "foo",
            },
        ];
    }, {
        preSetupHook: async (opts) => {
            return utils_1.ENGINE_HOOKS.setupBasic(opts);
        },
    }),
    EMPTY_NOTE: new common_test_utils_1.TestPresetEntryV4(async ({ engine }) => {
        const { data } = await engine.renderNote({
            id: "empty",
        });
        expect(data).toMatchSnapshot();
        return [
            {
                actual: true,
                expected: await common_test_utils_1.AssertUtils.assertInString({
                    body: data,
                    match: [`<h1 id="empty">Empty</h1>`],
                }),
                msg: "empty string",
            },
        ];
    }, {
        preSetupHook: async (opts) => {
            return common_test_utils_1.NoteTestUtilsV4.createNote({
                ...opts,
                fname: "empty",
                vault: opts.vaults[0],
            });
        },
    }),
    CUSTOM_FM: new common_test_utils_1.TestPresetEntryV4(async ({ engine }) => {
        const { data } = await engine.renderNote({
            id: "fm",
        });
        expect(data).toMatchSnapshot();
        return [
            {
                actual: true,
                expected: await common_test_utils_1.AssertUtils.assertInString({
                    body: data,
                    match: [`<p>egg</p>`, `<p>title: Fm</p>`],
                }),
                msg: "custom fm render",
            },
        ];
    }, {
        preSetupHook: async (opts) => {
            return common_test_utils_1.NoteTestUtilsV4.createNote({
                ...opts,
                fname: "fm",
                custom: {
                    foo: "egg",
                },
                vault: opts.vaults[0],
                body: "{{ fm.foo }}\n\ntitle: {{ fm.title }}",
            });
        },
    }),
    NOTE_REF_TO_TASK_NOTE: new common_test_utils_1.TestPresetEntryV4(async ({ engine }) => {
        const { data } = await engine.renderNote({
            id: "alpha-id",
        });
        return [
            {
                actual: true,
                expected: await common_test_utils_1.AssertUtils.assertInString({
                    body: data,
                    match: [
                        `<li><a href="task-note-id"><input type="checkbox" disabled class="task-before task-status" checked>Task Note</a></li>`,
                    ],
                }),
                msg: "custom fm render",
            },
        ];
    }, {
        preSetupHook: async (opts) => {
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "alpha",
                body: "- [[task-note]]",
                vault: opts.vaults[0],
                wsRoot: opts.wsRoot,
                props: { id: "alpha-id" },
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "beta",
                body: "![[alpha]]",
                vault: opts.vaults[0],
                wsRoot: opts.wsRoot,
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "task-note",
                body: "",
                custom: {
                    status: "done",
                },
                vault: opts.vaults[0],
                wsRoot: opts.wsRoot,
                props: { id: "task-note-id" },
            });
        },
    }),
    // Test rendering note after a ref was updated
    UPDATED_NOTE_REF: new common_test_utils_1.TestPresetEntryV4(async ({ engine }) => {
        const { data } = await engine.renderNote({
            id: "omega",
        });
        // Now let's update foo note which is referenced by omega
        const fooNote = (await engine.getNote("foo")).data;
        fooNote.body = "changed body";
        fooNote.updated += 10;
        await engine.writeNote(fooNote);
        const { data: updated } = await engine.renderNote({
            id: "omega",
        });
        return [
            {
                actual: true,
                expected: await common_test_utils_1.AssertUtils.assertInString({
                    body: data,
                    match: ["<p>foo body</p>"],
                }),
            },
            {
                actual: true,
                expected: await common_test_utils_1.AssertUtils.assertInString({
                    body: updated,
                    match: ["<p>changed body</p>"],
                }),
            },
        ];
    }, {
        preSetupHook: async (opts) => {
            const { wsRoot, vaults } = opts;
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "omega",
                wsRoot,
                vault: vaults[0],
                body: "![[foo]] ",
            });
            return utils_1.ENGINE_HOOKS.setupBasic(opts);
        },
    }),
};
exports.ENGINE_RENDER_PRESETS = {
    NOTES,
};
//# sourceMappingURL=render.js.map