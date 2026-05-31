import { DWorkspaceV2, WorkspaceType } from "@dendronhq/common-all";
import { DendronBaseWorkspace } from "./baseWorkspace";
export declare class DendronCodeWorkspace extends DendronBaseWorkspace implements DWorkspaceV2 {
    type: WorkspaceType;
}
