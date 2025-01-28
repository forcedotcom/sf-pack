import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from '../../helpers/command-base.js';
import { RestResult } from '../../helpers/utils.js';
import { SfClient } from '../../helpers/sf-client.js';

export default class Query extends CommandBase {
  public static description = CommandBase.messages.getMessage('api.query.commandDescription');

  public static examples = [
    `$ sf api query -u myOrgAlias -q "SELECT Id, Name FROM Account"
    Performs the specified SOQL query against the query API endpoint and writes the JSON result to the console.`,
  ];

  public static readonly flags = {
    query: Flags.string({
      char: 'q',
      description: CommandBase.messages.getMessage('api.query.soqlFlagDescription'),
      required: true,
    }),
    ...CommandBase.commonFlags,
    ...CommandBase.flags,
  };

  protected async runInternal(): Promise<void> {
    const { flags } = await this.parse(Query);
    const soql = flags.query as string;
    const sfClient = new SfClient(this.org);

    const response: RestResult = await sfClient.query(soql);
    if(response.code !== 200) {
      this.raiseError(JSON.stringify(response));
    } else {
      this.UX.log(JSON.stringify(response));
      this.UX.log(JSON.stringify(response.body.records));
    }
  }
}
