import { CommandBase } from '../../../helpers/command-base.js';
import { Delta } from '../../../helpers/delta-provider.js';
import { DeltaOptions } from '../../../helpers/delta-options.js';
export default class Git extends CommandBase {
    static description: string;
    static examples: string[];
    static gitDeltaProvider: {
        new (): {
            name: string;
            deltaLineToken: string;
            deltas: Map<string, string>;
            processDeltaLine(deltaLine: string): void;
            getMessage(name: string): string;
            diff(source?: string): AsyncGenerator<Delta, any, any>;
            validateDeltaOptions(deltaOptions: DeltaOptions): Promise<string>;
            deltaOptions: DeltaOptions;
            logFilePath: string;
            run(deltaOptions: DeltaOptions): Promise<any>;
            loadDeltaFile(deltaFilePath?: string): Promise<void>;
            logMessage(message: string, includeConsole?: boolean): Promise<void>;
        };
        deltaTypeKind: {
            NONE: string;
            A: string;
            M: string;
            D: string;
        };
        getFullCopyPath(filePath: string, fullCopyDirNames: string[], allowFullCopyPathWithExt?: boolean): string | null;
    };
    static readonly flags: any;
    protected name: string;
    protected deltas: Map<string, string>;
    protected runInternal(): Promise<void>;
}
