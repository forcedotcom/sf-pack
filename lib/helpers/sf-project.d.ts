export declare class PackageDirectory {
    path: string;
    default: boolean;
}
export default class SfProject {
    private static defaultInstance;
    packageDirectories: PackageDirectory[];
    namespace: string;
    sfdcLoginUrl: string;
    sourceApiVersion: string;
    constructor();
    static default(): Promise<SfProject>;
    static deserialize(projectFilePath?: string): Promise<SfProject>;
    getDefaultDirectory(): string;
}
