export declare class GraphStyleService {
    static styleFilePath(): string;
    static doesStyleFileExist(): boolean;
    static createStyleFile(): void;
    static openStyleFile(): Promise<void>;
    static readStyleFile(): string | undefined;
    static getParsedStyles(): string | undefined;
}
