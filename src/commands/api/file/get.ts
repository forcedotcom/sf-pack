import path from 'node:path';
import { CommandBase } from '../../../helpers/command-base.js';
import { FileBase } from '../../../helpers/file-base.js';
import Utils, { RestResult } from '../../../helpers/utils.js';
import { ApiKind } from '../../../helpers/sf-client.js';

export default class Get extends FileBase {
  public static description = CommandBase.messages.getMessage('api.file.get.commandDescription');
  
  public static examples = [
    `$ sf api file get -u myOrgAlias -r ContentVersions.csv  -f ./output/files
    Downloads the ContentVersion records defined in ContentVersions.csv and writes them to './output/files/{Id}'.`,
    'NOTE: the ContentVersion.csv file must have an Id column'
  ];

  protected metadataName: string = null;

  protected override preRun(): any {
    this.metadataName = `${FileBase.fileSObjectType}.${this.metadataInfo.DataName}`;  
  }
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected async doFileAction(recordRaw: object): Promise<RestResult> {
    this.debug(`GETting: ${FileBase.fileSObjectType} `);
    this.debug(`GETting: ${JSON.stringify(recordRaw)}`);

    const id = recordRaw[this.metadataInfo.Id] as string;

    if(!id) {
      this.raiseError('No Id column found in records file');
      return;
    }

    const result = await this.sfClient.getById(this.metadataName, id, ApiKind.DEFAULT)
  
    if (result.isError) {
      const errorMessage = `Error GETting: (${this.counter}) ${id} (${result.code}) => ${result.body as string}}`;
      this.errors.push(errorMessage);
      this.debug(errorMessage);
      return result;
    }
    
    const content = result.getContent();
    const outFilePath: string = path.join(this.filesPath, result.id);
    await Utils.writeFile(outFilePath, result.isBinary ? content: JSON.stringify(content));
    
    this.UX.log(`(${this.counter}) ${result.isError ? 'FAILED: ' + result.id : 'wrote: ' + outFilePath}`);
    return result;
  }
}
