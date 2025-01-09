import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from '../../../helpers/command-base';
import { SfQuery } from '../../../helpers/sf-query';
import { SfTasks } from '../../../helpers/sf-tasks';

export default class Execute extends CommandBase {
  public static defaultJobStatusWaitMax = -1;
  public static description = CommandBase.messages.getMessage('apex.coverage.execute.commandDescription');
  public static examples = [
    `$ sf apex coverage execute -u myOrgAlias
    Enqueues Apex Tests to be run in myOrgAlias with Code Coverage metrics. The command block until all tests have completed.`,
    `$ sf  apex coverage execute -u myOrgAlias -w 30
    Enqueues Apex Tests to be run in myOrgAlias with Code Coverage metrics and waits up to 30 minutes for test completion.`,
    `$ sf apex coverage execute -u myOrgAlias -w 0
    Enqueues Apex Tests to be run in myOrgAlias with Code Coverage metrics and returns immediately.`,
  ];

  public static readonly flags = {
    wait: Flags.integer({
      char: 'w',
      description: CommandBase.messages.getMessage('apex.coverage.execute.waitDescription', [
        Execute.defaultJobStatusWaitMax,
      ]),
    }),
    ...CommandBase.commonFlags,
  };

  protected async runInternal(): Promise<void> {
    const { flags } = await this.parse(Execute);
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

    // Execute tests (with CodeCoverage) ?
    const results = await SfTasks.enqueueApexTests(this.org, [], true);
    if(results.isError) {
      // The DailyAsyncApexTests limit might have been reached
      if(results.code === 500) {
        this.raiseError('Unable to queue Apex Test(s) - check DailyAsyncApexTests limit.');
      } else {
        results.throw();
      }
    }
    this.UX.log('Apex Tests Queued');

    // Are we waiting?
    if (flags.wait === 0) {
      return;
    }

    const waitCountMaxSeconds = (flags.wait || Execute.defaultJobStatusWaitMax) * 60;
    for await (recordCount of SfQuery.waitForApexTests(this.org, results.body as string, waitCountMaxSeconds)) {
      if (recordCount === 0) {
        break;
      }
      this.UX.log(`${recordCount} Apex Test(s) remaining.`);
    }

    if (recordCount !== 0) {
      this.raiseError(`${recordCount} Apex Test(s) are still executing - please try again later.`);
      return;
    }
    this.UX.log('Apex Tests Completed');
  }
}
