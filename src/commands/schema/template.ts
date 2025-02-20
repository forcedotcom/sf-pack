import path from 'node:path';
import { DescribeSObjectResult, Field } from '@jsforce/jsforce-node';
import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from '../../helpers/command-base.js';
import { SfTasks } from '../../helpers/sf-tasks.js';
import { OptionsFactory } from '../../helpers/options-factory.js';
import { Office } from '../../helpers/office.js';
import { TemplateOptions } from '../../helpers/template-options.js';
import { SfCore } from '../../helpers/sf-core.js';

export default class Template extends CommandBase {
  public static description = CommandBase.messages.getMessage('schema.template.commandDescription');

  public static defaultReportPath = 'DataTemplate-{ORG}.xlsx';

  public static examples = [
    `$ sf schema template -u myOrgAlias
    Generates a ${Template.defaultReportPath.replace(
      /\{ORG\}/,
      'myOrgAlias'
    )} file from an Org's configured Object & Field metadata.`,
  ];

  public static readonly flags = {
    report: Flags.file({
      char: 'r',
      description: CommandBase.messages.getMessage('schema.template.reportFlagDescription', [
        Template.defaultReportPath,
      ])
    }),
    namespaces: Flags.string({
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

  protected options: TemplateOptions;

  protected async runInternal(): Promise<void> {
    const { flags } = await this.parse(Template);
    // Read/Write the options file if it does not exist already
    this.options = await OptionsFactory.get(TemplateOptions, flags.options as string);

    let sortedTypeNames: Set<string> = null;
    if (flags.metadata) {
      sortedTypeNames = new Set<string>((flags.metadata as string).split(','));
    }
    sortedTypeNames = new Set<string>(['Account', 'Case', 'Lead']);

    if(sortedTypeNames.size === 0) {
      this.UX.log('Nothing to do - no Metadata Types specified (-m).');
      return;
    }

    let counter = 0;
    const schemas = new Set<string>();
    const workbook = new Map<string, string[][]>();
    
    for (const metaDataType of sortedTypeNames) {
      this.UX.log(`Gathering (${++counter}/${sortedTypeNames.size}) ${metaDataType} schema...`);
      try {
        const schema: DescribeSObjectResult = await SfTasks.describeObject(this.org, metaDataType);
        // Avoid duplicates (Account)
        if (schemas.has(schema.name)) {
          continue;
        }

        // Get alphabetical map
        const fieldMap = new Map<string,Field>();
        for (const field of schema.fields) {
          fieldMap.set(field.name, field);
        }

        const valueRow: string[] = [];
        for(const fieldName of fieldMap.keys()) {
          const field = fieldMap.get(fieldName);

          if(this.options.excludeFieldTypes?.includes(field.type)) {
            continue;
          }
          let value: string = null;
            try{
              value = SfCore.generateValue(field) as string;
            } catch (err) {
              value = err.message;
            }
            valueRow.push(value);
        }
        const sheetData: string[][] = [];
        sheetData.push([...fieldMap.keys()]);
        sheetData.push([...valueRow]);

        workbook.set(metaDataType, sheetData);

      } catch (err) {
        this.UX.log(`FAILED: ${err.message as string}.`);
      }
    }
    const reportPathFlag = flags.report as string;
    const reportPath = path.resolve(reportPathFlag || Template.defaultReportPath).replace(/\{ORG\}/, this.orgAlias);
    Office.writeXlxsWorkbook(workbook, reportPath);

    // Write options JSON incase there have been structure changes since it was last saved.
    if (flags.options) {
      await this.options.save(flags.options as string);
    }
  }
}
