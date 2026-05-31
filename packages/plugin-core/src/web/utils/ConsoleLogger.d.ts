import { DLogger } from "@dendronhq/common-all";
/**
 * Simple DLogger implementation that just logs to console. Works universally on
 * all platforms.
 */
export declare class ConsoleLogger implements DLogger {
    name?: string | undefined;
    level: any;
    debug(msg: any): void;
    info(msg: any): void;
    error(msg: any): void;
}
