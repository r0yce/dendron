import { Logger } from "@aws-amplify/core";
export declare enum LOG_LEVEL {
    DEBUG = "DEBUG",
    INFO = "INFO",
    ERROR = "ERROR"
}
export declare function createLogger(name: string): Logger;
export declare function setLogLevel(lvl: LOG_LEVEL): void;
