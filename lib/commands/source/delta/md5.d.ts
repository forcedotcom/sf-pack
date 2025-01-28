import { CommandBase } from '../../../helpers/command-base.js';
import { Delta } from '../../../helpers/delta-provider.js';
export default class Md5 extends CommandBase {
    static description: string;
    static examples: string[];
    static md5DeltaProvider: {
        new (): {
            deltaLineToken: string;
            name: string;
            deltas: Map<string, any>;
            processDeltaLine(deltaLine: string): void;
            getMessage(name: string): string;
            diff(source: string): AsyncGenerator<Delta, any, any>;
            logFile: string;
            deltaOptions: import("../../../helpers/delta-options.js").DeltaOptions;
            run(deltaOptions: import("../../../helpers/delta-options.js").DeltaOptions): Promise<any>;
            loadDeltaFile(deltaFilePath?: string): Promise<void>;
            logMessage(message: string, includeConsole?: boolean): Promise<void>;
            validateDeltaOptions(deltaOptions: import("../../../helpers/delta-options.js").DeltaOptions): Promise<string>;
        };
        deltaTypeKind: {
            NONE: string;
            A: string;
            M: string;
            D: string;
        };
        getFullCopyPath(filePath: string, fullCopyDirNames: string[], allowFullCopyPathWithExt?: boolean): string;
    };
    static readonly flags: any;
    protected name: string;
    protected deltas: Map<string, string>;
    protected runInternal(): Promise<void>;
}
