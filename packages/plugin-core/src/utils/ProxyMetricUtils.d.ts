import { RefactoringCommandUsedPayload } from "@dendronhq/common-all";
export declare class ProxyMetricUtils {
    static trackRefactoringProxyMetric(opts: {
        props: RefactoringCommandUsedPayload;
        extra: {
            [key: string]: any;
        };
    }): void;
}
