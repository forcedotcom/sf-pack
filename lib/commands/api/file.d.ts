import { CommandBase } from '../../helpers/command-base.js';
export default class File extends CommandBase {
    static fileSObjectType: string;
    static readonly: any;
    static description: string;
    static examples: string[];
    static readonly flags: {
        records: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        columns: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        allornothing: import("@oclif/core/interfaces").BooleanFlag<boolean>;
    };
    protected metadataInfo: any;
    protected runInternal(): Promise<void>;
    protected postFile(objectName: string, objectRecord: any, filePath: string): Promise<any>;
    private sanitizeRecord;
}
