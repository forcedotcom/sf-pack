"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sf_plugins_core_1 = require("@salesforce/sf-plugins-core");
const command_base_1 = require("../../../helpers/command-base");
const sf_query_1 = require("../../../helpers/sf-query");
const sf_client_1 = require("../../../helpers/sf-client");
const utils_1 = require("../../../helpers/utils");
class Clear extends command_base_1.CommandBase {
    async runInternal() {
        const { flags } = await this.parse(Clear);
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
        // Clear Code Coverage Metadata
        const metaDataTypes = flags.metadatas ? flags.metadatas.split(',') : Clear.defaultMetadataTypes;
        let whereClause = '';
        if (flags.classOrTriggerNames) {
            const names = [...flags.classOrTriggerNames.split(',')].map((record) => `'${record}'`).join(',');
            whereClause = ` WHERE ApexClassorTrigger.Name in (${names})`;
        }
        this.UX.log('Clearing Code Coverage Data.');
        for (const metaDataType of metaDataTypes) {
            const query = `SELECT Id FROM ${metaDataType} ${whereClause}`;
            const records = await sf_query_1.SfQuery.queryOrg(this.org, query, true);
            if (records && records.length > 0) {
                this.UX.log(`Clearing ${records.length} ${metaDataType} records...`);
                let counter = 0;
                const sfClient = new sf_client_1.SfClient(this.org);
                for await (const result of sfClient.do(utils_1.RestAction.DELETE, metaDataType, records, 'Id', sf_client_1.ApiKind.TOOLING, [
                    sf_client_1.NO_CONTENT_CODE,
                ])) {
                    this.UX.log(`(${++counter}/${records.length}) Deleted id: ${result.getContent()}`);
                }
                this.UX.log('Cleared.');
            }
        }
    }
}
Clear.defaultJobStatusWaitMax = -1;
Clear.description = command_base_1.CommandBase.messages.getMessage('apex.coverage.clear.commandDescription');
// Don't include ApexCodeCoverage as these records appear to be auto-generate if they are deleted;
Clear.defaultMetadataTypes = ['ApexCodeCoverageAggregate'];
Clear.examples = [
    `$ sf apex coverage clear -u myOrgAlias
    Deletes the existing instances of ${Clear.defaultMetadataTypes.join(',')} from the specific Org.`,
];
Clear.flags = {
    metadatas: sf_plugins_core_1.Flags.string({
        char: 'm',
        description: command_base_1.CommandBase.messages.getMessage('apex.coverage.clear.metadataFlagDescription', [
            Clear.defaultMetadataTypes.join(','),
        ]),
    }),
    classOrTriggerNames: sf_plugins_core_1.Flags.string({
        char: 'n',
        description: command_base_1.CommandBase.messages.getMessage('apex.coverage.clear.classOrTriggerNamesFlagDescription'),
    }),
    ...command_base_1.CommandBase.commonFlags,
};
exports.default = Clear;
//# sourceMappingURL=clear.js.map