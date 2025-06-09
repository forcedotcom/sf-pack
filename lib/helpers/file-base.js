import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from './command-base.js';
import Utils from './utils.js';
import { SfClient } from './sf-client.js';
export class FileBase extends CommandBase {
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
        metadata: Flags.file({
            char: 'm',
            description: CommandBase.messages.getMessage('api.file.metadataFlagDescription'),
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
    metadataType = null;
    metadataName = null;
    async runInternal() {
        // this.flags = (await this.parse(FileBase))?.flags;
        await this.parseFlags();
        this.records = this.flags.records;
        this.columns = this.flags.columns ? this.flags.columns.split(',') : null;
        this.filesPath = this.flags.filespath;
        this.metadataType = this.flags.metadata ?? 'ContentVersion';
        this.metadataInfo = SfClient.metaDataInfo[this.metadataType];
        this.debug(`MetadataInfo: ${JSON.stringify(this.metadataInfo)}`);
        if (!this.metadataInfo) {
            this.raiseError(`MetaDataInfo not found for: ${this.metadataType}.`);
            return;
        }
        this.metadataName = `${this.metadataType}.${this.metadataInfo?.DataName}`;
        await this.preRun();
        this.debug('Executing api:file-base');
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
            this.debug(`RAW ${this.metadataType} from CSV: ${JSON.stringify(recordRaw)}`);
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