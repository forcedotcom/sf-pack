import { Flags } from '@salesforce/sf-plugins-core';
import { SaveError } from '@jsforce/jsforce-node';
import { CommandBase } from '../../helpers/command-base.js';
import Utils, { RestResult } from '../../helpers/utils.js';
import { SfClient } from '../../helpers/sf-client.js';
import Constants from '../../helpers/constants.js';

export default class File extends CommandBase {
  public static fileSObjectType = 'ContentVersion';

  public static readonly;

  public static description = CommandBase.messages.getMessage('api.file.post.commandDescription');

  public static examples = [
    `$ sf api file -u myOrgAlias -r ContentVersions.csv
    Uploads the ContentVersion records defined in ContentVersions.csv. 
    NOTE: filename = PathOnClient, filePath = ContentVersion then PathOnClient`,
    `$ sf api file -u myOrgAlias -r ContentVersions.csv -c ContentDocumentId,VersionData,PathOnClient
    Uploads the ContentVersion records defined in ContentVersions.csv using only the columns: ContentDocumentId,VersionData,PathOnClient. 
    NOTE: filename = PathOnClient, filePath = ContentVersion then PathOnClient`,
    `$ sf api file -u myOrgAlias -r ContentVersions.csv -a
    Uploads the ContentVersion records defined in ContentVersions.csv. The whole process will stop on the first failure.
    NOTE: filename = PathOnClient, filePath = ContentVersion then PathOnClient`,
  ];

  public static readonly flags = {
    records: Flags.string({
      char: 'r',
      description: CommandBase.messages.getMessage('api.file.post.recordsFlagDescription'),
      required: true,
    }),
    columns: Flags.string({
      char: 'c',
      description: CommandBase.messages.getMessage('api.file.post.columnsFlagDescription'),
      required: false,
    }),
    allornothing: Flags.boolean({
      char: 'a',
      description: CommandBase.messages.getMessage('api.file.post.allOrNothingFlagDescription'),
      required: false,
    }),
    ...CommandBase.commonFlags,
    ...CommandBase.flags,
  };

  protected metadataInfo: any = null;

  protected async runInternal(): Promise<void> {
    const { flags } = await this.parse(File);
    const objectName = File.fileSObjectType;
    this.metadataInfo = SfClient.metaDataInfo[objectName];
    const records: string = flags.records;
    const columns: string[] = flags.columns ? flags.columns.split(',') : null;
    this.debug('Executing api:file:post');

    this.debug(`MetdataInfo: ${JSON.stringify(this.metadataInfo)}`);
    if (!this.metadataInfo) {
      this.raiseError(`MetaDataInfo not found for: ${objectName}.`);
      return;
    }

    this.debug(`Records: ${records}`);
    if (!(await Utils.pathExists(records))) {
      this.raiseError(`Path does not exists: ${records}.`);
      return;
    }

    const sfClient = new SfClient(this.org);
    const errors: string[] = [];
    let counter = 0;
    for await (const recordRaw of Utils.parseCSVFile(records)) {
      if (errors.length > 0 && flags.allornothing) {
        break;
      }
      counter++;
      this.debug(`RAW ${objectName} from CSV: ${JSON.stringify(recordRaw)}`);

      const record = this.sanitizeRecord(recordRaw as object, columns);
      const fileName: string = record[this.metadataInfo.Filename];
      const filePath: string = record[this.metadataInfo.DataName] ?? fileName;

      if (!filePath) {
        errors.push(`No file path found for record: ${JSON.stringify(record)}.`);
        continue;
      }

      if (!(await Utils.pathExists(filePath))) {
        this.raiseError(`Path does not exists: ${filePath}.`);
        return;
      }
      const stats = await Utils.getPathStat(filePath);

      // Do we need to use a multi-part POST?
      let result: RestResult = null;
      try {
        if (stats.size > Constants.CONENTVERSION_MAX_SIZE) {
          result = await sfClient.postObjectMultipart(objectName, record, fileName, filePath);
        } else {
          result = await this.postFile(objectName, record, filePath);
        }
      } catch (err) {
        result = new RestResult();
        result.code = 0;
        result.isError = true;
        result.body = `Exception: ${err.message as string}`;
      }
      if (result.isError) {
        errors.push(`Error uploading: (${counter}) ${filePath} (${result.code}) => ${result.body as string}}`);
        this.debug(`Error api:file:post failed: ${filePath} (${result.code})=> ${result.body as string}`);
      }
      this.UX.log(`(${counter}) ${objectName} ${result.isError ? 'FAILED' : result.id} for file: ${fileName}`);
    }

    if (errors.length > 0) {
      this.UX.log('The following records failed:');
      for (const error of errors) {
        this.UX.log(error);
      }
      this.raiseError('Upload Failed');
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected async postFile(objectName: string, objectRecord: any, filePath: string): Promise<any> {
    this.debug(`POSTing: ${objectName} `);
    this.debug(`POSTing: ${JSON.stringify(objectRecord)}`);
    const result: RestResult = new RestResult();

    const base64Body = await Utils.readFile(filePath, Utils.ReadFileBase64EncodingOption);
    objectRecord[this.metadataInfo.DataName] = base64Body;

    const postResult = await this.org
      .getConnection()
      .sobject(objectName)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      .insert(objectRecord)[0];

    if (postResult.success) {
      result.id = postResult.id;
    } else {
      const saveError = postResult as SaveError;
      result.code = Number(saveError.errorCode);
      result.body = JSON.stringify(saveError);
    }
    return result;
  }

  private sanitizeRecord(raw: object, columns: string[] = []): any {
    if (columns) {
      const newRaw = {};
      for (const column of columns) {
        if (column in raw) {
          newRaw[column] = raw[column];
        } else {
          this.raiseError(
            `The specified column/field ('${column}') does not exist in CSV record: ${JSON.stringify(raw)}`
          );
        }
      }
      const keys: string[] = Object.keys(raw);
      for (const key of keys) {
        if (columns.includes(key)) {
          continue;
        }
        delete raw[key];
      }
    } else {
      for (const key of ['Id', 'FileType']) {
        if (key in raw) {
          delete raw[key];
        }
      }
    }
    return raw;
  }
}
