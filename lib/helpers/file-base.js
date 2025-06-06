import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from './command-base.js';
import Utils from './utils.js';
import { SfClient } from './sf-client.js';
export class FileBase extends CommandBase {
    static fileSObjectType = 'ContentVersion';
    static readonly;
    static flags = {
        records: Flags.file({
            char: 'r',
            description: CommandBase.messages.getMessage('api.file.recordsFlagDescription'),
            required: true,
        }),
        columns: Flags.string({
            char: 'c',
            description: CommandBase.messages.getMessage('api.file.columnsFlagDescription'),
            required: false,
        }),
        filespath: Flags.directory({
            char: 'f',
            description: CommandBase.messages.getMessage('api.file.filesPathFlagDescription'),
            required: false,
        }),
        allornothing: Flags.boolean({
            char: 'a',
            description: CommandBase.messages.getMessage('api.file.allOrNothingFlagDescription'),
            required: false,
        }),
        ...CommandBase.commonFlags,
        ...CommandBase.flags,
    };
    flags = null;
    metadataInfo = null;
    errors = [];
    sfClient = null;
    counter = 0;
    records = null;
    columns = null;
    filesPath = null;
    async runInternal() {
        // this.flags = (await this.parse(FileBase))?.flags;
        await this.parseFlags();
        this.metadataInfo = SfClient.metaDataInfo[FileBase.fileSObjectType];
        this.records = this.flags.records;
        this.columns = this.flags.columns ? this.flags.columns.split(',') : null;
        this.filesPath = this.flags.filespath;
        await this.preRun();
        this.debug('Executing api:file-base');
        this.debug(`MetadataInfo: ${JSON.stringify(this.metadataInfo)}`);
        if (!this.metadataInfo) {
            this.raiseError(`MetaDataInfo not found for: ${FileBase.fileSObjectType}.`);
            return;
        }
        this.debug(`Records: ${this.records}`);
        // Check required arguments
        if (!(await Utils.pathExists(this.records))) {
            this.raiseError(`Path does not exists: ${this.records}.`);
            return;
        }
        if (this.filesPath && !(await Utils.pathExists(this.filesPath))) {
            this.raiseError(`Path does not exists: ${this.filesPath}.`);
            return;
        }
        this.sfClient = new SfClient(this.org);
        for await (const recordRaw of Utils.parseCSVFile(this.records)) {
            if (this.errors.length > 0 && this.flags.allornothing) {
                break;
            }
            this.counter++;
            this.debug(`RAW ${FileBase.fileSObjectType} from CSV: ${JSON.stringify(recordRaw)}`);
            await this.doFileAction(recordRaw);
        }
        if (this.errors.length > 0) {
            this.UX.log('The following records failed:');
            for (const error of this.errors) {
                this.UX.log(error);
            }
            this.raiseError('Upload Failed');
        }
    }
    async preRun() {
    }
    async parseFlags() {
        this.flags = (await this.parse(FileBase))?.flags;
    }
}
//# sourceMappingURL=file-base.js.map