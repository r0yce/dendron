import { TypedUseSelectorHook } from "react-redux";
import { RootState } from "./store";
export declare const useIDEAppDispatch: () => import("redux").Dispatch<import("redux").AnyAction> & import("redux-thunk").ThunkDispatch<{
    ide: import("./slice").IDEState;
}, null, import("redux").AnyAction> & import("redux-thunk").ThunkDispatch<{
    ide: import("./slice").IDEState;
}, undefined, import("redux").AnyAction>;
export declare const useIDEAppSelector: TypedUseSelectorHook<RootState>;
