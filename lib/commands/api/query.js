import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from '../../helpers/command-base.js';
import { SfClient } from '../../helpers/sf-client.js';
export default class Query extends CommandBase {
    static description = CommandBase.messages.getMessage('api.query.commandDescription');
    static examples = [
        `$ sf api query -u myOrgAlias -q "SELECT Id, Name FROM Account"
    Performs the specified SOQL query against the query API endpoint and writes the JSON result to the console.`,
    ];
    static flags = {
        query: Flags.string({
            char: 'q',
            description: CommandBase.messages.getMessage('api.query.soqlFlagDescription'),
            required: true,
        }),
        ...CommandBase.commonFlags,
        ...CommandBase.flags,
    };
    async runInternal() {
        const { flags } = await this.parse(Query);
        const soql = flags.query;
        const sfClient = new SfClient(this.org);
        const response = await sfClient.query(soql);
        if (response.code !== 200) {
            this.raiseError(JSON.stringify(response));
        }
        else {
            this.UX.log(JSON.stringify(response));
            this.UX.log(JSON.stringify(response.body.records));
        }
    }
}
//# sourceMappingURL=query.js.map