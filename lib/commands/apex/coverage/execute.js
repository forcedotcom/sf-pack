"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sf_plugins_core_1 = require("@salesforce/sf-plugins-core");
const command_base_1 = require("../../../helpers/command-base");
const sf_query_1 = require("../../../helpers/sf-query");
const sf_tasks_1 = require("../../../helpers/sf-tasks");
class Execute extends command_base_1.CommandBase {
    async runInternal() {
        const { flags } = await this.parse(Execute);
        this.UX.log('Checking for pending tests...');
        let recordCount = 0;
        for await (recordCount of sf_query_1.SfQuery.waitForApexTests(this.org, null)) {
            if (recordCount === 0) {
                break;
            }
        }
        if (recordCount !== 0) {
            this.raiseError(`${recordCount} Apex Test(s) are still executing - please try again later.`);
        }
        // Execute tests (with CodeCoverage) ?
        const results = await sf_tasks_1.SfTasks.enqueueApexTests(this.org, [], true);
        if (results.isError) {
            // The DailyAsyncApexTests limit might have been reached
            if (results.code === 500) {
                this.raiseError('Unable to queue Apex Test(s) - check DailyAsyncApexTests limit.');
            }
            else {
                results.throw();
            }
        }
        this.UX.log('Apex Tests Queued');
        // Are we waiting?
        if (flags.wait === 0) {
            return;
        }
        const waitCountMaxSeconds = (flags.wait || Execute.defaultJobStatusWaitMax) * 60;
        for await (recordCount of sf_query_1.SfQuery.waitForApexTests(this.org, results.body, waitCountMaxSeconds)) {
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
Execute.defaultJobStatusWaitMax = -1;
Execute.description = command_base_1.CommandBase.messages.getMessage('apex.coverage.execute.commandDescription');
Execute.examples = [
    `$ sf apex coverage execute -u myOrgAlias
    Enqueues Apex Tests to be run in myOrgAlias with Code Coverage metrics. The command block until all tests have completed.`,
    `$ sf  apex coverage execute -u myOrgAlias -w 30
    Enqueues Apex Tests to be run in myOrgAlias with Code Coverage metrics and waits up to 30 minutes for test completion.`,
    `$ sf apex coverage execute -u myOrgAlias -w 0
    Enqueues Apex Tests to be run in myOrgAlias with Code Coverage metrics and returns immediately.`,
];
Execute.flags = {
    wait: sf_plugins_core_1.Flags.integer({
        char: 'w',
        description: command_base_1.CommandBase.messages.getMessage('apex.coverage.execute.waitDescription', [
            Execute.defaultJobStatusWaitMax,
        ]),
    }),
    ...command_base_1.CommandBase.commonFlags,
};
exports.default = Execute;
//# sourceMappingURL=execute.js.map