/**
 * Type shim for csv-writer to avoid compiling its source .ts with strict options.
 *
 * csv-writer@1.6 ships "types": "src/index.ts" (source, not declarations).
 */
declare module "csv-writer" {
  export interface ObjectCsvWriterParams {
    path: string;
    header: Array<{ id: string; title: string }>;
  }

  export interface ObjectCsvWriter {
    writeRecords(records: object[]): Promise<void>;
  }

  export function createObjectCsvWriter(
    params: ObjectCsvWriterParams
  ): ObjectCsvWriter;
}