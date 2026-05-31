import { type ReducedDEngine } from "@dendronhq/common-all";
import { URI } from "vscode-uri";
import { type ITelemetryClient } from "../../telemetry/common/ITelemetryClient";
import { type ILookupProvider } from "./lookup/ILookupProvider";
import { LookupQuickpickFactory } from "./lookup/LookupQuickpickFactory";
export declare class NoteLookupCmd {
    private factory;
    private wsRoot;
    private engine;
    private noteProvider;
    private _analytics;
    constructor(factory: LookupQuickpickFactory, wsRoot: URI, engine: ReducedDEngine, noteProvider: ILookupProvider, _analytics: ITelemetryClient);
    run(): Promise<void>;
}
