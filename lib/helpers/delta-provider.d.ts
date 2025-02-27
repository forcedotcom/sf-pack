import { DeltaOptions } from './delta-options.js';
export declare class Delta {
    deltaKind: string;
    deltaFile: string;
    constructor(deltaKind: string, deltaFile: string);
}
export declare abstract class DeltaProvider {
    static deltaTypeKind: {
        NONE: string;
        A: string;
        M: string;
        D: string;
    };
    deltaOptions: DeltaOptions;
    logFilePath: string;
    abstract name: string;
    abstract deltaLineToken: string;
    abstract deltas: Map<string, any>;
    static getFullCopyPath(filePath: string, fullCopyDirNames: string[], allowFullCopyPathWithExt?: boolean): string | null;
    run(deltaOptions: DeltaOptions): Promise<any>;
    loadDeltaFile(deltaFilePath?: string): Promise<void>;
    logMessage(message: string, includeConsole?: boolean): Promise<void>;
    validateDeltaOptions(deltaOptions: DeltaOptions): Promise<string | null>;
    abstract processDeltaLine(deltaLine: string): void;
    abstract getMessage(name: string): string;
    abstract diff(source: string): AsyncGenerator<Delta, any, any>;
}
