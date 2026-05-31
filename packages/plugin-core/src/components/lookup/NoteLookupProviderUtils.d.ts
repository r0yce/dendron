import { DLogger } from "@dendronhq/common-server";
import { ILookupControllerV3 } from "./LookupControllerV3Interface";
export declare class NoteLookupProviderUtils {
    static cleanup(opts: {
        id: string;
        controller: ILookupControllerV3;
    }): void;
    static subscribe(opts: {
        id: string;
        controller: ILookupControllerV3;
        logger: DLogger;
        onDone?: Function;
        onError?: Function;
        onChangeState?: Function;
        onHide?: Function;
    }): Promise<any | undefined>;
}
