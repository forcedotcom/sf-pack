import path from 'node:path';
import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from '../../helpers/command-base.js';
import Utils from '../../helpers/utils.js';
import { SfClient } from '../../helpers/sf-client.js';
import { EventLogOptions } from '../../helpers/eventlog-options.js';
import { OptionsFactory } from '../../helpers/options-factory.js';
export default class EventLog extends CommandBase {
    static description = CommandBase.messages.getMessage('api.eventlog.commandDescription');
    static examples = [
        `$ sf api eventlog  -u myOrgAlias -o options/eventlog-options.json
    Retrieves the EventLog files from the myOrgAlias Org for the option specified in the options/eventlog-options.json file.
    $ sf api eventlog -o options/eventlog-options.json
    Retrieves the EventLog files from the default Org for the option specified in the options/eventlog-options.json file.`,
    ];
    static flags = {
        options: Flags.string({
            char: 'o',
            description: CommandBase.messages.getMessage('api.eventlog.optionsFlagDescription')
        }),
        ...CommandBase.commonFlags,
        ...CommandBase.flags,
    };
    async runInternal() {
        const { flags } = await this.parse(EventLog);
        let options;
        if (flags.options) {
            const optionsPath = flags.options;
            options = await OptionsFactory.get(EventLogOptions, optionsPath);
            if (!options) {
                this.raiseError(`Unable to read options file: ${optionsPath}.`);
            }
        }
        else {
            options = new EventLogOptions();
            await options.loadDefaults();
        }
        const soql = options.soqlQuery;
        const sfClient = new SfClient(this.org);
        const response = await sfClient.query(soql);
        if (response.code !== 200) {
            this.UX.log('SOQL: ' + soql);
            this.raiseError(JSON.stringify(response));
        }
        else {
            // this.UX.log(JSON.stringify(response.body.records));
            // const instanceUrl = await sfClient.getInstanceUrl(false);
            if (response.body?.totalSize === 0) {
                this.UX.log('No EventLogFile records were returned by the query:');
                this.UX.log(soql);
                return;
            }
            for (const eventLog of response.body.records) {
                if (!eventLog.LogFile) {
                    this.raiseError('The EventLogFile SOQL query must specify the LogFile attribute.');
                    return;
                }
                if (!eventLog.Id) {
                    this.raiseError('The EventLogFile SOQL query must specify the Id attribute.');
                    return;
                }
                if (eventLog.LogFileLength && eventLog.LogFileLength === 0) {
                    this.UX.log(`The EventLog Id: ${eventLog.Id} has no data.`);
                    continue;
                }
                // const fileUrl = path.join(instanceUrl,eventLog.LogFile as string);
                // const result: RestResult = await Utils.getRestResult(RestAction.GET, fileUrl);
                const result = await sfClient.getById('EventLogFile.LogFile', eventLog.Id);
                if (result.code !== 200) {
                    this.UX.log(`Error getting LogFile for Id: ${eventLog.Id}.`);
                    this.UX.log(JSON.stringify(result));
                    continue;
                }
                const outFilePath = path.join(options.outputFolder, `${eventLog.Id}.csv`);
                // eslint-disable-next-line no-console
                this.UX.log(`Writing EventLogFile: ${outFilePath}`);
                const content = result.getContent();
                // eslint-disable-next-line no-console
                console.log(content);
                await Utils.writeFile(outFilePath, content);
            }
        }
    }
}
//# sourceMappingURL=eventlog.js.map