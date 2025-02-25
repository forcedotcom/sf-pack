import path from 'node:path';
import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from '../../helpers/command-base.js';
import { SfTasks } from '../../helpers/sf-tasks.js';
import { OptionsFactory } from '../../helpers/options-factory.js';
import { TemplateOptions } from '../../helpers/template-options.js';
import { SfCore } from '../../helpers/sf-core.js';
import Utils from '../../helpers/utils.js';
export default class Template extends CommandBase {
    static description = CommandBase.messages.getMessage('schema.template.commandDescription');
    static defaultReportPath = 'DataTemplate-{ORG}.csv';
    static examples = [
        `$ sf schema template -u myOrgAlias
    Generates one or more ${Template.defaultReportPath.replace(/\{ORG\}/, 'myOrgAlias')} CSV import files for an Org's configured metadata.`,
    ];
    static flags = {
        report: Flags.file({
            char: 'r',
            description: CommandBase.messages.getMessage('schema.template.reportFlagDescription', [
                Template.defaultReportPath,
            ])
        }),
        metadata: Flags.string({
            char: 'm',
            description: CommandBase.messages.getMessage('schema.template.metadataFlagDescription'),
        }),
        options: Flags.file({
            char: 'o',
            description: CommandBase.messages.getMessage('schema.template.optionsFlagDescription'),
        }),
        ...CommandBase.commonFlags,
        ...CommandBase.flags,
    };
    options;
    async runInternal() {
        const { flags } = await this.parse(Template);
        // Read/Write the options file if it does not exist already
        this.options = await OptionsFactory.get(TemplateOptions, flags.options);
        let sortedTypeNames = null;
        if (flags.metadata) {
            sortedTypeNames = new Set(flags.metadata.split(','));
        }
        // sortedTypeNames = new Set<string>(['Account', 'Case', 'Lead']);
        if (!sortedTypeNames?.size) {
            this.UX.log('Nothing to do - no Metadata Types specified (-m).');
            return;
        }
        let counter = 0;
        const schemas = new Set();
        const workbook = new Map();
        for (const metaDataType of sortedTypeNames) {
            this.UX.log(`Gathering (${++counter}/${sortedTypeNames.size}) ${metaDataType} schema...`);
            try {
                const schema = await SfTasks.describeObject(this.org, metaDataType);
                // Avoid duplicates (Account)
                if (schemas.has(schema.name)) {
                    continue;
                }
                // Get alphabetical map
                const fieldMap = new Map();
                for (const field of schema.fields) {
                    fieldMap.set(field.name, field);
                }
                const fieldNames = Utils.sortArray(Array.from(fieldMap.keys()));
                const headerRow = [];
                const valueRow = [];
                for (const fieldName of fieldNames) {
                    const field = fieldMap.get(fieldName);
                    if (this.options.excludeFieldTypes?.includes(field.type)) {
                        continue;
                    }
                    if (!this.options.includeReadOnly && field.updateable !== true) {
                        continue;
                    }
                    headerRow.push(field.label);
                    let value = null;
                    try {
                        value = SfCore.generateValue(field);
                    }
                    catch (err) {
                        value = err.message;
                    }
                    valueRow.push(value);
                }
                const sheetData = [];
                sheetData.push([...headerRow]);
                sheetData.push([...valueRow]);
                workbook.set(metaDataType, sheetData);
            }
            catch (err) {
                this.UX.log(`FAILED: ${err.message}.`);
            }
        }
        const reportPathFlag = flags.report;
        const reportFilePath = path.resolve(reportPathFlag || Template.defaultReportPath.replace(/\{ORG\}/, this.orgAlias));
        const ext = path.extname(reportFilePath);
        const fileName = reportFilePath.replace(ext, '');
        for (const metadataName of workbook.keys()) {
            const filePath = `${fileName}.${metadataName}${ext}`;
            this.UX.log(`Writing ${filePath}`);
            await Utils.writeCSVFile(filePath, workbook.get(metadataName));
        }
        // Write options JSON incase there have been structure changes since it was last saved.
        if (flags.options) {
            await this.options.save(flags.options);
        }
    }
}
//# sourceMappingURL=template.js.map