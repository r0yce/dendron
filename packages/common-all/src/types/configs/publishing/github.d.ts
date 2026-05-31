import { z } from "../../../parse";
export declare enum GithubEditViewModeEnum {
    tree = "tree",
    edit = "edit"
}
export type GithubEditViewMode = keyof typeof GithubEditViewModeEnum;
/**
 * Namespace for publishing related github configs
 */
export type GithubConfig = {
    cname?: string | undefined;
    enableEditLink: boolean;
    editLinkText?: string | undefined;
    editBranch?: string | undefined;
    editViewMode?: GithubEditViewMode | undefined;
    editRepository?: string | undefined;
};
export declare function genDefaultGithubConfig(): GithubConfig;
export declare const githubSchema: z.ZodObject<{
    cname: z.ZodOptional<z.ZodString>;
    enableEditLink: z.ZodDefault<z.ZodBoolean>;
    editLinkText: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    editBranch: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    editViewMode: z.ZodDefault<z.ZodOptional<z.ZodUnion<[z.ZodLiteral<GithubEditViewModeEnum.tree>, z.ZodLiteral<GithubEditViewModeEnum.edit>]>>>;
    editRepository: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    cname?: string | undefined;
    editRepository?: string | undefined;
    enableEditLink: boolean;
    editLinkText: string;
    editBranch: string;
    editViewMode: GithubEditViewModeEnum;
}, {
    cname?: string | undefined;
    enableEditLink?: boolean | undefined;
    editLinkText?: string | undefined;
    editBranch?: string | undefined;
    editViewMode?: GithubEditViewModeEnum | undefined;
    editRepository?: string | undefined;
}>;
