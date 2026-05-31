import { DEngineClient, DNodePropsQuickInputV2, NoteQuickInput, TransformedQueryString } from "@dendronhq/common-all";
import { DendronQuickPickerV2 } from "./types";
export declare const PAGINATE_LIMIT = 50;
export declare class NotePickerUtils {
    static createItemsFromSelectedWikilinks(): Promise<DNodePropsQuickInputV2[] | undefined>;
    static createNoActiveItem({ fname, detail, }: {
        fname: string;
        detail: string;
    }): DNodePropsQuickInputV2;
    static createNewWithTemplateItem({ fname, }: {
        fname: string;
    }): DNodePropsQuickInputV2;
    static getInitialValueFromOpenEditor(): string;
    static getSelection(picker: DendronQuickPickerV2): NoteQuickInput[];
    static fetchRootQuickPickResults: ({ engine, }: {
        engine: DEngineClient;
    }) => Promise<(import("@dendronhq/common-all").DNodeExplicitProps & {
        fname: string;
        links: import("@dendronhq/common-all").DLink[];
        anchors: {
            [index: string]: import("@dendronhq/common-all").DNoteAnchorPositioned | undefined;
        };
        type: import("@dendronhq/common-all").DNodeType;
        stub?: boolean;
        schemaStub?: boolean;
        parent: import("@dendronhq/common-all").DNodePointer | null;
        children: import("@dendronhq/common-all").DNodePointer[];
        data: any;
        body: string;
        custom?: any;
        schema?: {
            moduleId: string;
            schemaId: string;
        } | undefined;
        vault: import("@dendronhq/common-all").DVault;
        contentHash?: string | undefined;
        color?: string | undefined;
        tags?: string | string[] | undefined;
        image?: import("@dendronhq/common-all").DNodeImage | undefined;
        traits?: string[];
    } & {
        label: string;
        detail?: string;
        alwaysShow?: boolean;
    })[]>;
    /**
     * Get picker results without input from the user
     */
    static fetchPickerResultsNoInput({ picker, }: {
        picker: DendronQuickPickerV2;
    }): Promise<DNodePropsQuickInputV2[]>;
    private static enhanceNoteForQuickInput;
    static fetchPickerResults(opts: {
        picker: DendronQuickPickerV2;
        transformedQuery: TransformedQueryString;
        originalQS: string;
    }): Promise<(import("@dendronhq/common-all").DNodeExplicitProps & {
        fname: string;
        links: import("@dendronhq/common-all").DLink[];
        anchors: {
            [index: string]: import("@dendronhq/common-all").DNoteAnchorPositioned | undefined;
        };
        type: import("@dendronhq/common-all").DNodeType;
        stub?: boolean;
        schemaStub?: boolean;
        parent: import("@dendronhq/common-all").DNodePointer | null;
        children: import("@dendronhq/common-all").DNodePointer[];
        data: any;
        body: string;
        custom?: any;
        schema?: {
            moduleId: string;
            schemaId: string;
        } | undefined;
        vault: import("@dendronhq/common-all").DVault;
        contentHash?: string | undefined;
        color?: string | undefined;
        tags?: string | string[] | undefined;
        image?: import("@dendronhq/common-all").DNodeImage | undefined;
        traits?: string[];
    } & {
        label: string;
        detail?: string;
        alwaysShow?: boolean;
    })[]>;
    static getPickerValue(picker: DendronQuickPickerV2): string;
}
