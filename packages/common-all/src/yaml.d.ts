import { Result } from "neverthrow";
import type { AnyJson } from "./types";
import { DendronError } from "./error";
export declare const fromStr: (str: string, overwriteDuplicate?: boolean) => Result<AnyJson, DendronError>;
export declare const toStr: (data: any) => Result<string, DendronError<import("http-status-codes/build/cjs/status-codes").StatusCodes | undefined>>;
