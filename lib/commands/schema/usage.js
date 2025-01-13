import path from 'node:path';
import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from '../../helpers/command-base.js';
import { Office } from '../../helpers/office.js';
import { SfQuery } from '../../helpers/sf-query.js';
import Constants from '../../helpers/constants.js';
export default class Usage extends CommandBase {
    static description = CommandBase.messages.getMessage('schema.usage.commandDescription');
    static defaultReportPath = 'CustomFieldUsage-{ORG}.xlsx';
    static examples = [
        `$ sf schema usage -u myOrgAlias
    Generates a ${Usage.defaultReportPath.replace(/\{ORG\}/, 'myOrgAlias')} report detailing the CustomField usage for the specified objects.`,
    ];
    static flags = {
        objects: Flags.string({
            char: 'm',
            description: CommandBase.messages.getMessage('schema.usage.objectsFlagDescription'),
            required: true,
        }),
        report: Flags.file({
            char: 'r',
            description: CommandBase.messages.getMessage('schema.usage.reportFlagDescription', [Usage.defaultReportPath]),
        }),
        namespaces: Flags.string({
            char: 'n',
            description: CommandBase.messages.getMessage('namespacesFlagDescription'),
        }),
        ...CommandBase.commonFlags,
        ...CommandBase.flags,
    };
    async runInternal() {
        const { flags } = await this.parse(Usage);
        const customObjects = [];
        const usageObjectNames = new Map();
        for (const metaName of flags.objects.split(',')) {
            const trimmed = metaName.trim();
            if (trimmed.endsWith(Constants.CUSTOM_SUFFIX)) {
                customObjects.push(trimmed.split(Constants.CUSTOM_SUFFIX)[0]);
            }
            else {
                usageObjectNames.set(trimmed, trimmed);
            }
        }
        // CustomFields for standard SF objects must be queried by Object Name
        // CustomFields for Custom SF objects must be queried by Object Id
        if (customObjects.length > 0) {
            const query = `SELECT Id, DeveloperName FROM CustomObject WHERE DeveloperName IN ('${customObjects.join("','")}')`;
            const results = await SfQuery.queryOrg(this.org, query, true);
            for (const result of results) {
                usageObjectNames.set(result.Id, `${result.DeveloperName}${Constants.CUSTOM_SUFFIX}`);
            }
        }
        if (usageObjectNames.size === 0) {
            this.raiseError('No metadata types specified.');
        }
        const workbookMap = new Map();
        for (const nameOrId of usageObjectNames.keys()) {
            let query = `SELECT Id, DeveloperName FROM CustomField WHERE TableEnumOrId = '${nameOrId}'`;
            const fieldMap = new Map();
            for (const result of await SfQuery.queryOrg(this.org, query, true)) {
                fieldMap.set(result.Id, result.DeveloperName);
            }
            query = `
          SELECT RefMetadataComponentName, MetadataComponentType, MetadataComponentName
          FROM MetadataComponentDependency
          WHERE 
            RefMetadataComponentId IN ('${Array.from(fieldMap.keys()).join("','")}') AND 
            RefMetadataComponentType = 'CustomField'
          ORDER By RefMetadataComponentName`;
            const usageData = [['Field Name', 'Reference Type', 'Reference Name']];
            for (const result of await SfQuery.queryOrg(this.org, query, true)) {
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
            Office.writeXlxsWorkbook(workbookMap, reportPath);
        }
        catch (err) {
            this.UX.log('Error writing usage report: ' + JSON.stringify(err.message));
            throw err;
        }
    }
}
//# sourceMappingURL=usage.js.map