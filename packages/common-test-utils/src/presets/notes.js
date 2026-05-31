"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTE_PRESETS_V4 = exports.CreateNoteFactory = exports.NOTE_BODY_PRESETS_V4 = void 0;
const lodash_1 = __importDefault(require("lodash"));
const noteUtils_1 = require("../noteUtils");
exports.NOTE_BODY_PRESETS_V4 = {
    NOTE_REF: `![[dendron.pro.dendron-next-server#quickstart,1:#*]]`,
    NOTE_REF_TARGET_BODY: "# Header1\nbody1\n# \nbody2",
};
const SIMPLE_SELECTION = [7, 0, 7, 12];
const CreateNoteFactory = (opts) => {
    const func = ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }) => {
        const _opts = {
            ...opts,
            vault,
            wsRoot,
            genRandomId,
            noWrite,
        };
        if (!lodash_1.default.isUndefined(body)) {
            _opts.body = body;
        }
        if (!lodash_1.default.isUndefined(props)) {
            _opts.props = props;
        }
        if (!lodash_1.default.isUndefined(fname)) {
            _opts.fname = fname;
        }
        return noteUtils_1.NoteTestUtilsV4.createNote(_opts);
    };
    const createWithEngineFunc = ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }) => {
        const _opts = {
            ...opts,
            vault,
            wsRoot,
            genRandomId,
            noWrite,
            engine,
        };
        if (!lodash_1.default.isUndefined(body)) {
            _opts.body = body;
        }
        if (!lodash_1.default.isUndefined(props)) {
            _opts.props = props;
        }
        if (!lodash_1.default.isUndefined(fname)) {
            _opts.fname = fname;
        }
        return noteUtils_1.NoteTestUtilsV4.createNoteWithEngine(_opts);
    };
    return {
        create: func,
        createWithEngine: createWithEngineFunc,
        fname: opts.fname,
        selection: opts.selection || SIMPLE_SELECTION,
        body: opts.body,
    };
};
exports.CreateNoteFactory = CreateNoteFactory;
// presets are documented in [[Presets|dendron://dendron.docs/pkg.common-test-utils.ref.presets]] for easy refeerence
exports.NOTE_PRESETS_V4 = {
    NOTE_EMPTY: (0, exports.CreateNoteFactory)({ fname: "empty", body: "" }),
    /**
     * fname: foo
     * body: foo body
     */
    NOTE_SIMPLE: (0, exports.CreateNoteFactory)({ fname: "foo", body: "foo body" }),
    NOTE_SIMPLE_OTHER: (0, exports.CreateNoteFactory)({ fname: "bar", body: "bar body" }),
    NOTE_SIMPLE_CHILD: (0, exports.CreateNoteFactory)({
        fname: "foo.ch1",
        body: "foo.ch1 body",
    }),
    NOTE_SIMPLE_GRANDCHILD: (0, exports.CreateNoteFactory)({
        fname: "foo.ch1.gch1",
        body: "foo.ch1.gch1 body",
    }),
    NOTE_WITH_CUSTOM_ATT: (0, exports.CreateNoteFactory)({
        fname: "foo",
        custom: {
            bond: 42,
        },
    }),
    NOTE_DOMAIN_NAMESPACE: (0, exports.CreateNoteFactory)({ fname: "pro" }),
    NOTE_DOMAIN_NAMESPACE_CHILD: (0, exports.CreateNoteFactory)({
        fname: "pro.foo",
        body: "pro.foo.body",
    }),
    // START CHANGE
    /**
     *  ^5xetq2e7t2z4
     * fname: alpha
     * body: [[beta]]
     */
    NOTE_WITH_TARGET: (0, exports.CreateNoteFactory)({ fname: "alpha", body: "[[beta]]" }),
    /**
     *  fname: beta
     *  body: [[alpha]]
     */
    NOTE_WITH_LINK: (0, exports.CreateNoteFactory)({ fname: "beta", body: "[[alpha]]" }),
    NOTE_WITH_LINK_CANDIDATE_TARGET: (0, exports.CreateNoteFactory)({
        fname: "gamma",
        body: "alpha",
    }),
    NOTE_WITH_ALIAS_LINK: (0, exports.CreateNoteFactory)({
        fname: "beta",
        body: "[[some label|alpha]]",
    }),
    NOTE_WITH_ANCHOR_TARGET: (0, exports.CreateNoteFactory)({
        fname: "alpha",
        body: [`# H1`, `# H2 ^8a`, `# H3`, "", "Some Content"].join("\n"),
    }),
    NOTE_WITH_ANCHOR_LINK: (0, exports.CreateNoteFactory)({
        fname: "beta",
        body: `[[alpha#h3]]`,
    }),
    NOTE_WITH_BLOCK_ANCHOR_TARGET: (0, exports.CreateNoteFactory)({
        fname: "anchor-target",
        body: [
            "Lorem ipsum dolor amet",
            "Maiores exercitationem officiis adipisci voluptate",
            "",
            "^block-id",
            "",
            "Alias eos velit aspernatur",
        ].join("\n"),
    }),
    NOTE_WITH_CAPS_AND_SPACE: (0, exports.CreateNoteFactory)({
        fname: "000 Index.md",
        body: "[[alpha]]",
    }),
    NOTE_WITH_FM_VARIABLES: (0, exports.CreateNoteFactory)({
        fname: "fm-variables",
        body: "Title is {{ fm.title }}",
    }),
    NOTE_WITH_FM_TAG: (0, exports.CreateNoteFactory)({
        fname: "fm-tag",
        props: {
            tags: "foo",
        },
        body: "",
    }),
    //  ^ar2re45pswxu
    NOTE_WITH_NOTE_REF_SIMPLE: (0, exports.CreateNoteFactory)({
        fname: "simple-note-ref",
        body: "![[simple-note-ref.one]]",
    }),
    // ^zp9pa2jancj0
    NOTE_WITH_NOTE_REF_SIMPLE_TARGET: (0, exports.CreateNoteFactory)({
        fname: "simple-note-ref.one",
        body: ["# Header ", "body text"].join("\n"),
    }),
    NOTE_WITH_BLOCK_REF_SIMPLE: (0, exports.CreateNoteFactory)({
        fname: "simple-block-ref",
        body: "![[simple-block-ref.one#intro]]",
    }),
    NOTE_WITH_BLOCK_RANGE_REF_SIMPLE: (0, exports.CreateNoteFactory)({
        fname: "simple-block-range-ref",
        body: "![[simple-block-range-ref.one#head1:#head3]]",
    }),
    NOTE_WITH_REF_OFFSET: (0, exports.CreateNoteFactory)({
        fname: "ref-offset",
        body: "![[ref-offset.one#head1,1]]",
    }),
    NOTE_WITH_WILDCARD_CHILD_REF: (0, exports.CreateNoteFactory)({
        fname: "wildcard-child-ref",
        body: "![[wildcard-child-ref.*]]",
    }),
    NOTE_WITH_WILDCARD_HEADER_REF: (0, exports.CreateNoteFactory)({
        fname: "wildcard-header-ref",
        body: "![[wildcard-header-ref.one#head1:#*]]",
    }),
    NOTE_WITH_WILDCARD_COMPLEX: (0, exports.CreateNoteFactory)({
        fname: "wildcard-complex-ref",
        body: "![[wildcard-complex.*#head1,1]]",
    }),
    NOTE_WITH_NOTE_REF_TARGET: (0, exports.CreateNoteFactory)({
        fname: "alpha",
        body: exports.NOTE_BODY_PRESETS_V4.NOTE_REF_TARGET_BODY,
    }),
    NOTE_WITH_NOTE_REF_LINK: (0, exports.CreateNoteFactory)({
        fname: "beta",
        body: "![[alpha]]",
    }),
    NOTE_WITH_WIKILINK_SIMPLE: (0, exports.CreateNoteFactory)({
        fname: "simple-wikilink",
        body: "[[simple-wikilink.one]]",
    }),
    NOTE_WITH_WIKILINK_SIMPLE_TARGET: (0, exports.CreateNoteFactory)({
        fname: "simple-wikilink.one",
        body: ["# Header ", "body text"].join("\n"),
    }),
    NOTE_WITH_WIKILINK_TOP_HIERARCHY: (0, exports.CreateNoteFactory)({
        fname: "wikilink-top-hierarchy",
        body: "[[wikilink-top-hierarchy-target]]",
    }),
    NOTE_WITH_WIKILINK_TOP_HIERARCHY_TARGET: (0, exports.CreateNoteFactory)({
        fname: "wikilink-top-hierarchy-target",
        body: ["# Header ", "body text"].join("\n"),
    }),
    NOTE_WITH_USERTAG: (0, exports.CreateNoteFactory)({
        fname: "usertag",
        body: "@johndoe",
    }),
    NOTE_WITH_TAG: (0, exports.CreateNoteFactory)({
        fname: "footag",
        body: "#foobar",
    }),
    NOTE_WITH_LOWER_CASE_TITLE: (0, exports.CreateNoteFactory)({
        fname: "aaron",
        body: "aaron",
        props: {
            title: "aaron",
        },
    }),
    NOTE_WITH_UPPER_CASE_TITLE: (0, exports.CreateNoteFactory)({
        fname: "aardvark",
        body: "aardvark",
        props: {
            title: "Aardvark",
        },
    }),
    NOTE_WITH_UNDERSCORE_TITLE: (0, exports.CreateNoteFactory)({
        fname: "_underscore",
        body: "underscore",
    }),
};
//# sourceMappingURL=notes.js.map