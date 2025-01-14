import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from '../../../helpers/command-base.js';
import { SfQuery } from '../../../helpers/sf-query.js';
import { SfClient, NO_CONTENT_CODE, ApiKind } from '../../../helpers/sf-client.js';
import { RestAction } from '../../../helpers/utils.js';

export default class Clear extends CommandBase {
  public static defaultJobStatusWaitMax = -1;
  public static description = CommandBase.messages.getMessage('apex.coverage.clear.commandDescription');
  // Don't include ApexCodeCoverage as these records appear to be auto-generate if they are deleted;
  public static defaultMetadataTypes = ['ApexCodeCoverageAggregate'];
  public static examples = [
    `$ sf apex coverage clear -u myOrgAlias
    Deletes the existing instances of ${Clear.defaultMetadataTypes.join(',')} from the specific Org.`,
  ];

  public static readonly flags = {
    metadatas: Flags.string({
      char: 'm',
      description: CommandBase.messages.getMessage('apex.coverage.clear.metadataFlagDescription', [
        Clear.defaultMetadataTypes.join(','),
      ]),
    }),
    classOrTriggerNames: Flags.string({
      char: 'n',
      description: CommandBase.messages.getMessage('apex.coverage.clear.classOrTriggerNamesFlagDescription'),
    }),
    ...CommandBase.commonFlags,
    ...CommandBase.flags,
  };

  protected async runInternal(): Promise<void> {
    const { flags } = await this.parse(Clear);
    this.UX.log('Checking for pending tests...');

    let recordCount = 0;
    for await (recordCount of SfQuery.waitForApexTests(this.org, null)) {
      if (recordCount === 0) {
        break;
      }
    }
    if (recordCount !== 0) {
      this.raiseError(`${recordCount} Apex Test(s) are still executing - please try again later.`);
    }

    // Clear Code Coverage Metadata
    const metaDataTypes: string[] = flags.metadatas ? flags.metadatas.split(',') : Clear.defaultMetadataTypes;

    let whereClause = '';
    if (flags.classOrTriggerNames) {
      const names = [...flags.classOrTriggerNames.split(',')].map((record) => `'${record}'`).join(',');
      whereClause = ` WHERE ApexClassorTrigger.Name in (${names})`;
    }

    this.UX.log('Clearing Code Coverage Data.');
    for (const metaDataType of metaDataTypes) {
      const query = `SELECT Id FROM ${metaDataType} ${whereClause}`;
      const records = await SfQuery.queryOrg(this.org, query, true);
      if (records && records.length > 0) {
        this.UX.log(`Clearing ${records.length} ${metaDataType} records...`);
        let counter = 0;
        const sfClient = new SfClient(this.org);
        for await (const result of sfClient.do(RestAction.DELETE, metaDataType, records, 'Id', ApiKind.TOOLING, [
          NO_CONTENT_CODE,
        ])) {
          this.UX.log(`(${++counter}/${records.length}) Deleted id: ${result.getContent() as string}`);
        }
        this.UX.log('Cleared.');
      }
    }
  }
}
