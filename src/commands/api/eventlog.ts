import path from 'node:path';
import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from '../../helpers/command-base.js';
import Utils, { RestResult } from '../../helpers/utils.js';
import { SfClient } from '../../helpers/sf-client.js';
import { EventLogOptions } from '../../helpers/eventlog-options.js';
import { OptionsFactory } from '../../helpers/options-factory.js';

export default class EventLog extends CommandBase {
  public static description = CommandBase.messages.getMessage('api.eventlog.commandDescription');

  public static examples = [
    `$ sf api eventlog  -u myOrgAlias -o options/eventlog-options.json
    Retrieves the EventLog files from the myOrgAlias Org for the option specified in the options/eventlog-options.json file.
    $ sf api eventlog -o options/eventlog-options.json
    Retrieves the EventLog files from the default Org for the option specified in the options/eventlog-options.json file.`,
  ];

  public static readonly flags = {
    options: Flags.string({
      char: 'o',
      description: CommandBase.messages.getMessage('api.eventlog.optionsFlagDescription')
    }),
    ...CommandBase.commonFlags,
    ...CommandBase.flags,
  };
  
  protected async runInternal(): Promise<void> {
    const { flags } = await this.parse(EventLog);
    
    let options: EventLogOptions;
    if (flags.options) {
      const optionsPath: string = flags.options;
      options = await OptionsFactory.get(EventLogOptions, optionsPath);
      if (!options) {
        this.raiseError(`Unable to read options file: ${optionsPath}.`);
      }
    } else {
      options = new EventLogOptions();
      await options.loadDefaults();
    }
    const soql = options.soqlQuery;
    const sfClient = new SfClient(this.org);

    const response: RestResult = await sfClient.query(soql);
    if(response.code !== 200) {
      this.UX.log('SOQL: ' + soql);
      this.raiseError(JSON.stringify(response));
    } else {
      if(response.body?.totalSize === 0) {
        this.UX.log('No EventLogFile records were returned by the query.');
        this.UX.log('SOQL: ' + soql);
        return;
      }

      for (const eventLog of response.body.records) {
        
        if(!eventLog.LogFile) {
          this.UX.log('SOQL: ' + soql);
          this.raiseError('The EventLogFile SOQL query must specify the LogFile attribute.');
          return;
        }
        if(!eventLog.Id) {
          this.UX.log('SOQL: ' + soql);
          this.raiseError('The EventLogFile SOQL query must specify the Id attribute.');
          return;
        }
        if(eventLog.LogFileLength === 0) {
          this.UX.log(`The EventLog Id: ${eventLog.Id} has no data.`);
          continue;
        }
        
        const result = await sfClient.getById('EventLogFile.LogFile', eventLog.Id as string);
        if(result.code !== 200) {
          this.UX.log(`Error getting LogFile for Id: ${eventLog.Id}.`);
          this.UX.log(JSON.stringify(result));
          continue;
        }
        const outFilePath: string = path.join(options.outputFolder,`${eventLog.Id}.csv`);

        this.UX.log(`Writing EventLogFile: ${outFilePath}`);
        await Utils.writeFile(outFilePath, result.getContent());
      }
    }
  }
}
