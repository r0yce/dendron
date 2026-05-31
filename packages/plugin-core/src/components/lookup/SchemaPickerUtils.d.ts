import { DendronQuickPickerV2 } from "./types";
export declare class SchemaPickerUtils {
    static fetchPickerResultsWithCurrentValue({ picker, }: {
        picker: DendronQuickPickerV2;
    }): Promise<import("@dendronhq/common-all").DNodePropsQuickInputV2[]>;
    static fetchPickerResults(opts: {
        picker: DendronQuickPickerV2;
        qs: string;
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
}
