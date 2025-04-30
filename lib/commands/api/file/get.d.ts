import { FileBase } from '../../../helpers/file-base.js';
import { RestResult } from '../../../helpers/utils.js';
export default class Get extends FileBase {
    static description: string;
    static examples: string[];
    protected metadataName: string;
    protected preRun(): any;
    protected doFileAction(recordRaw: object): Promise<RestResult>;
}
