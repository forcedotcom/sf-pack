import { CommandBase } from './command-base.js';
import { RestResult } from './utils.js';
import { SfClient } from './sf-client.js';
export declare abstract class FileBase extends CommandBase {
    static readonly: any;
    static readonly flags: {
        records: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        columns: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        filespath: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        allornothing: import("@oclif/core/interfaces").BooleanFlag<boolean>;
        metadata: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
    };
    protected flags: any;
    protected metadataInfo: any;
    protected errors: string[];
    protected sfClient: SfClient;
    protected counter: number;
    protected records: string;
    protected columns: string[];
    protected filesPath: string;
    protected metadataType: string;
    protected metadataName: string;
    protected runInternal(): Promise<void>;
    protected preRun(): Promise<any>;
    protected parseFlags(): Promise<void>;
    protected abstract doFileAction(record: object): Promise<RestResult>;
}
