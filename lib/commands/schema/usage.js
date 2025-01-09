"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const sf_plugins_core_1 = require("@salesforce/sf-plugins-core");
const command_base_1 = require("../../helpers/command-base");
const office_1 = require("../../helpers/office");
const sf_query_1 = require("../../helpers/sf-query");
const constants_1 = require("../../helpers/constants");
class Usage extends command_base_1.CommandBase {
    async runInternal() {
        const { flags } = await this.parse(Usage);
        const customObjects = [];
        const usageObjectNames = new Map();
        for (const metaName of flags.objects.split(',')) {
            const trimmed = metaName.trim();
            if (trimmed.endsWith(constants_1.default.CUSTOM_SUFFIX)) {
                customObjects.push(trimmed.split(constants_1.default.CUSTOM_SUFFIX)[0]);
            }
            else {
                usageObjectNames.set(trimmed, trimmed);
            }
        }
        // CustomFields for standard SF objects must be queried by Object Name
        // CustomFields for Custom SF objects must be queried by Object Id
        if (customObjects.length > 0) {
            const query = `SELECT Id, DeveloperName FROM CustomObject WHERE DeveloperName IN ('${customObjects.join('\',\'')}')`;
            const results = await sf_query_1.SfQuery.queryOrg(this.org, query, true);
            for (const result of results) {
                usageObjectNames.set(result.Id, `${result.DeveloperName}${constants_1.default.CUSTOM_SUFFIX}`);
            }
        }
        if (usageObjectNames.size === 0) {
            this.raiseError('No metadata types specified.');
        }
        const workbookMap = new Map();
        for (const nameOrId of usageObjectNames.keys()) {
            let query = `SELECT Id, DeveloperName FROM CustomField WHERE TableEnumOrId = '${nameOrId}'`;
            const fieldMap = new Map();
            for (const result of await sf_query_1.SfQuery.queryOrg(this.org, query, true)) {
                fieldMap.set(result.Id, result.DeveloperName);
            }
            query = `
          SELECT RefMetadataComponentName, MetadataComponentType, MetadataComponentName
          FROM MetadataComponentDependency
          WHERE 
            RefMetadataComponentId IN ('${Array.from(fieldMap.keys()).join('\',\'')}') AND 
            RefMetadataComponentType = 'CustomField'
          ORDER By RefMetadataComponentName`;
            const usageData = [['Field Name', 'Reference Type', 'Reference Name']];
            for (const result of await sf_query_1.SfQuery.queryOrg(this.org, query, true)) {
                usageData.push([
                    result.RefMetadataComponentName,
                    result.MetadataComponentType,
                    result.MetadataComponentName,
                ]);
            }
            workbookMap.set(usageObjectNames.get(nameOrId), usageData);
        }
        const reportPath = path
            .resolve(flags.report || Usage.defaultReportPath)
            .replace(/\{ORG\}/, this.orgAlias);
        this.UX.log(`Writing CustomField usage report: ${reportPath}`);
        try {
            office_1.Office.writeXlxsWorkbook(workbookMap, reportPath);
        }
        catch (err) {
            this.UX.log('Error writing usage report: ' + JSON.stringify(err.message));
            throw err;
        }
    }
}
Usage.description = command_base_1.CommandBase.messages.getMessage('schema.usage.commandDescription');
Usage.defaultReportPath = 'CustomFieldUsage-{ORG}.xlsx';
Usage.examples = [
    `$ sf schema usage -u myOrgAlias
    Generates a ${Usage.defaultReportPath.replace(/\{ORG\}/, 'myOrgAlias')} report detailing the CustomField usage for the specified objects.`,
];
Usage.flags = {
    objects: sf_plugins_core_1.Flags.string({
        char: 'm',
        description: command_base_1.CommandBase.messages.getMessage('schema.usage.objectsFlagDescription'),
        required: true
    }),
    report: sf_plugins_core_1.Flags.file({
        char: 'r',
        description: command_base_1.CommandBase.messages.getMessage('schema.usage.reportFlagDescription', [
            Usage.defaultReportPath,
        ])
    }),
    namespaces: sf_plugins_core_1.Flags.string({
        char: 'n',
        description: command_base_1.CommandBase.messages.getMessage('namespacesFlagDescription'),
    }),
    ...command_base_1.CommandBase.commonFlags,
};
exports.default = Usage;
//# sourceMappingURL=usage.js.map