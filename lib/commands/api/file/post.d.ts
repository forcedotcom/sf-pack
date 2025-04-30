import { FileBase } from '../../../helpers/file-base.js';
import { RestResult } from '../../../helpers/utils.js';
export default class Post extends FileBase {
    static description: string;
    static examples: string[];
    static readonly flags: {
        records: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        columns: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        filespath: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        allornothing: import("@oclif/core/interfaces").BooleanFlag<boolean>;
    };
    protected doFileAction(recordRaw: object): Promise<RestResult>;
    protected postFile(objectName: string, objectRecord: any, filePath: string): Promise<any>;
    protected sanitizeRecord(raw: object, columns?: string[]): any;
}
