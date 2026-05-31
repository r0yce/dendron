import { FieldSet, Records } from "@dendronhq/airtable";
import { DEngineClient, NoteProps, NotePropsMeta, RespV3 } from "@dendronhq/common-all";
import { DLogger } from "@dendronhq/common-server";
import { NoteMetadataValidationProps } from "@dendronhq/engine-server";
import { JSONSchemaType } from "ajv";
import { URI } from "vscode-uri";
import { ExportPod, ExportPodConfig, ExportPodPlantOpts, PublishPod, PublishPodConfig, PublishPodPlantOpts } from "../basev3";
type AirtablePodCustomOptsCommon = {
    tableName: string;
    apiKey: string;
    baseId: string;
};
type AirtableExportPodCustomOpts = AirtablePodCustomOptsCommon & {
    srcHierarchy: string;
    srcFieldMapping: {
        [key: string]: SrcFieldMapping;
    };
    noCheckpointing?: boolean;
};
type AirtablePublishPodCustomOpts = AirtablePodCustomOptsCommon & {};
export type AirtableExportResp = {
    notes: NoteProps[];
    data: {
        created: Records<FieldSet>;
        updated: Records<FieldSet>;
    };
};
export type SrcFieldMappingResp = {
    create: AirtableFieldsMap[];
    update: (AirtableFieldsMap & {
        id: string;
    })[];
    lastCreated: number;
    lastUpdated: number;
};
export type SrcFieldMapping = SrcFieldMappingV2 | string;
export type SrcFieldMappingV2 = SimpleSrcField | MultiSelectField | SingleSelectField | LinkedRecordField;
export declare enum SpecialSrcFieldToKey {
    TAGS = "tags",
    LINKS = "links"
}
type SimpleSrcField = {
    to: string;
    type: "string" | "date" | "number" | "boolean";
} & NoteMetadataValidationProps;
type SelectField = {
    to: SpecialSrcFieldToKey | string;
    filter?: string;
};
type SingleSelectField = {
    type: "singleSelect";
} & SelectField;
type MultiSelectField = {
    type: "multiSelect";
} & SelectField;
type LinkedRecordField = {
    type: "linkedRecord";
    podId?: string;
} & SelectField;
export type AirtableFieldsMap = {
    fields: {
        [key: string]: string | number;
    };
};
export type AirtableExportConfig = ExportPodConfig & AirtableExportPodCustomOpts;
export type AirtablePublishConfig = PublishPodConfig & AirtablePublishPodCustomOpts;
type AirtableExportPodProcessProps = AirtableExportPodCustomOpts & {
    filteredNotes: NoteProps[];
    checkpoint: string;
    engine: DEngineClient;
};
export declare class AirtableUtils {
    static addRequiredFields(mapping: {
        [key: string]: SrcFieldMapping;
    }): {
        [x: string]: SrcFieldMapping;
    };
    static filterNotes(notes: NoteProps[], srcHierarchy: string): NoteProps[];
    static getAirtableIdFromNote(note: NotePropsMeta, podId?: string): string | undefined;
    /***
     * Chunk all calls into records of 10 (Airtable API limit and call using limiter)
     */
    static chunkAndCall(allRecords: AirtableFieldsMap[], func: (record: any[]) => Promise<Records<FieldSet>>): Promise<import("@dendronhq/airtable/lib/record")<import("@dendronhq/airtable/lib/field_set").FieldSet>[]>;
    /**
     * Maps a {@linkk SrcFieldMappingV2["type"]} to a field on {@link NoteProps}
     * @param param0
     * @returns
     */
    static handleSrcField({ fieldMapping, note, engine, }: {
        fieldMapping: SrcFieldMappingV2;
        note: NoteProps;
        engine: DEngineClient;
    }): Promise<RespV3<any>>;
    /**
     * Maps note props to airtable calls.
     * For existing notes, checks for `airtableId` prop to see if we need to run an update vs a create
     *
     * @param opts
     * @returns
     */
    static notesToSrcFieldMap(opts: {
        notes: NoteProps[];
        srcFieldMapping: {
            [key: string]: SrcFieldMapping;
        };
        logger: DLogger;
        engine: DEngineClient;
        podId?: string;
    }): Promise<RespV3<SrcFieldMappingResp>>;
    static updateAirtableIdForNewlySyncedNotes({ records, engine, logger, podId, }: {
        records: Records<FieldSet>;
        engine: DEngineClient;
        logger: DLogger;
        podId?: string;
    }): Promise<void>;
}
export declare class AirtablePublishPod extends PublishPod<AirtablePublishConfig> {
    static id: string;
    static description: string;
    get config(): JSONSchemaType<AirtablePublishConfig>;
    plant(opts: PublishPodPlantOpts): Promise<string>;
}
export declare class AirtableExportPod extends ExportPod<AirtableExportConfig, {
    created: Records<FieldSet>;
    updated: Records<FieldSet>;
}> {
    static id: string;
    static description: string;
    get config(): JSONSchemaType<AirtableExportConfig>;
    processNote(opts: AirtableExportPodProcessProps): Promise<{
        created: import("@dendronhq/airtable/lib/record")<import("@dendronhq/airtable/lib/field_set").FieldSet>[];
        updated: import("@dendronhq/airtable/lib/record")<import("@dendronhq/airtable/lib/field_set").FieldSet>[];
    }>;
    verifyDir(dest: URI): string;
    filterNotes(notes: NoteProps[], srcHierarchy: string): NoteProps[];
    plant(opts: ExportPodPlantOpts): Promise<AirtableExportResp>;
}
export {};
