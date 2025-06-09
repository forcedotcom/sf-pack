import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from './command-base.js';
import Utils, { RestResult } from './utils.js';
import { SfClient } from './sf-client.js';

export abstract class FileBase extends CommandBase {
  public static readonly;

  public static readonly flags = {
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

  protected flags: any = null;

  protected metadataInfo: any = null;

  protected errors: string[] = [];

  protected sfClient: SfClient = null;

  protected counter = 0;

  protected records: string = null;

  protected columns: string[] = null;

  protected filesPath: string = null;

  protected metadataType: string = null;

  protected metadataName: string = null;

  protected async runInternal(): Promise<void> {
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

      await this.doFileAction(recordRaw as object);

    }

    if (this.errors.length > 0) {
      this.UX.log('The following records failed:');
      for (const error of this.errors) {
        this.UX.log(error);
      }
      this.raiseError('Upload Failed');
    }
  }

  protected async preRun(): Promise<any> {

  }

  protected async parseFlags(): Promise<void> {
    this.flags = (await this.parse(FileBase))?.flags;
  }
  
  protected abstract doFileAction(record: object): Promise<RestResult>;
}
