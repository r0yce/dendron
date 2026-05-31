import { DEngineClient, DVault } from "@dendronhq/common-all";
import { CreateNoteOptsV4 } from "../noteUtils";
type CreateNotePresetOptsV4 = {
    wsRoot: string;
    vault: DVault;
    genRandomId?: boolean;
    fname?: string;
    noWrite?: boolean;
    body?: string;
    props?: CreateNoteOptsV4["props"];
};
export declare const NOTE_BODY_PRESETS_V4: {
    NOTE_REF: string;
    NOTE_REF_TARGET_BODY: string;
};
type CreateNoteFactoryOpts = Omit<CreateNoteOptsV4, "vault" | "wsRoot"> & {
    selection?: [number, number, number, number];
};
export declare const CreateNoteFactory: (opts: CreateNoteFactoryOpts) => {
    create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
    createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
        engine: DEngineClient;
    }) => Promise<import("@dendronhq/common-all").NoteProps>;
    fname: string;
    selection: [number, number, number, number];
    body: string | undefined;
};
export declare const NOTE_PRESETS_V4: {
    NOTE_EMPTY: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    /**
     * fname: foo
     * body: foo body
     */
    NOTE_SIMPLE: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_SIMPLE_OTHER: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_SIMPLE_CHILD: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_SIMPLE_GRANDCHILD: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_WITH_CUSTOM_ATT: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_DOMAIN_NAMESPACE: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_DOMAIN_NAMESPACE_CHILD: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    /**
     *  ^5xetq2e7t2z4
     * fname: alpha
     * body: [[beta]]
     */
    NOTE_WITH_TARGET: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    /**
     *  fname: beta
     *  body: [[alpha]]
     */
    NOTE_WITH_LINK: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_WITH_LINK_CANDIDATE_TARGET: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_WITH_ALIAS_LINK: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_WITH_ANCHOR_TARGET: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_WITH_ANCHOR_LINK: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_WITH_BLOCK_ANCHOR_TARGET: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_WITH_CAPS_AND_SPACE: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_WITH_FM_VARIABLES: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_WITH_FM_TAG: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_WITH_NOTE_REF_SIMPLE: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_WITH_NOTE_REF_SIMPLE_TARGET: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_WITH_BLOCK_REF_SIMPLE: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_WITH_BLOCK_RANGE_REF_SIMPLE: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_WITH_REF_OFFSET: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_WITH_WILDCARD_CHILD_REF: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_WITH_WILDCARD_HEADER_REF: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_WITH_WILDCARD_COMPLEX: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_WITH_NOTE_REF_TARGET: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_WITH_NOTE_REF_LINK: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_WITH_WIKILINK_SIMPLE: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_WITH_WIKILINK_SIMPLE_TARGET: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_WITH_WIKILINK_TOP_HIERARCHY: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_WITH_WIKILINK_TOP_HIERARCHY_TARGET: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_WITH_USERTAG: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_WITH_TAG: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_WITH_LOWER_CASE_TITLE: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_WITH_UPPER_CASE_TITLE: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
    NOTE_WITH_UNDERSCORE_TITLE: {
        create: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, }: CreateNotePresetOptsV4) => Promise<import("@dendronhq/common-all").NoteProps>;
        createWithEngine: ({ vault, wsRoot, genRandomId, noWrite, body, fname, props, engine, }: CreateNotePresetOptsV4 & {
            engine: DEngineClient;
        }) => Promise<import("@dendronhq/common-all").NoteProps>;
        fname: string;
        selection: [number, number, number, number];
        body: string | undefined;
    };
};
export {};
