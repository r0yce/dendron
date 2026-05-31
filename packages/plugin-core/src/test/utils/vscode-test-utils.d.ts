import sinon from "sinon";
export declare class VSCodeTestUtils {
    static mockUserConfigDir(): sinon.SinonStub<[], {
        userConfigDir: string;
        delimiter: string;
        osName: string;
    }>;
    static stubWSFolders(wsRoot: string | undefined): sinon.SinonStub<any[], any>;
}
