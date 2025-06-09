import { FileBase } from '../../../helpers/file-base.js';
import { RestResult } from '../../../helpers/utils.js';
export default class Get extends FileBase {
    static description: string;
    static examples: string[];
    static readonly flags: {
        records: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        columns: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        filespath: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        allornothing: import("@oclif/core/interfaces").BooleanFlag<boolean>;
        metadata: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        ext: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
    };
    protected parseFlags(): Promise<any>;
    protected doFileAction(recordRaw: object): Promise<RestResult>;
}
