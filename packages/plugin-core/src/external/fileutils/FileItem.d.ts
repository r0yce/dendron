import { Uri } from "vscode";
export declare class FileItem {
    private IsDir;
    private SourcePath;
    private TargetPath;
    constructor(sourcePath: Uri | string, targetPath?: Uri | string, IsDir?: boolean);
    get name(): string;
    get path(): Uri;
    get targetPath(): Uri | undefined;
    get exists(): boolean;
    get isDir(): boolean;
    move(): Promise<FileItem>;
    duplicate(): Promise<FileItem>;
    remove(useTrash?: boolean): Promise<FileItem>;
    create(mkDir?: boolean): Promise<FileItem>;
    private ensureTargetPath;
    private toUri;
}
