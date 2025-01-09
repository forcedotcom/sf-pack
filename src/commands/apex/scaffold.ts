import { DescribeSObjectResult } from 'jsforce';
import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from '../../helpers/command-base';
import { SfTasks as SfTasks } from '../../helpers/sf-tasks';
import Utils from '../../helpers/utils';
import { OptionsFactory } from '../../helpers/options-factory';
import { ScaffoldOptions } from '../../helpers/scaffold-options';
import SfProject from '../../helpers/sf-project';

export default class Scaffold extends CommandBase {
  public static description = CommandBase.messages.getMessage('apex.scaffold.commandDescription');

  public static examples = [
    `$ sf apex scaffold -u myOrgAlias -s Account,MyObject__c'
    Generates AccountTest.cls & MyObjectTest.cls Apex test classes (and cls-meta files) for the Account & MyObject__c SObject types. Random values assigned to required fields by default`,
    `$ sf apex scaffold -u myOrgAlias -o scaffold-options.json
    Generates Apex test classes (and cls-meta files) for specified CustomObjects. The specified options file is used.`,
  ];

  public static readonly flags = {
    sobjects: Flags.string({
      char: 's',
      description: CommandBase.messages.getMessage('apex.scaffold.sObjectsFlagDescription'),
    }),
    options: Flags.file({
      char: 'o',
      description: CommandBase.messages.getMessage('apex.scaffold.optionsFlagDescription'),
    }),
    ...CommandBase.commonFlags,
  };

  private static META_XML =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">\n' +
    '<apiVersion>API_VERSION_TOKEN</apiVersion>\n' +
    '<status>Active</status>\n' +
    '</ApexClass>';

  private static MAX_CLASS_NAME_LENGTH = 40;
  private schemas = new Map<string, DescribeSObjectResult>();
  private index = 0;

  protected async runInternal(): Promise<void> {
    const { flags } = await this.parse(Scaffold);
    let options: ScaffoldOptions;
    // Read/Write the options file if it does not exist already
    if (flags.options) {
      const optionsFilePath = flags.options;
      options = await OptionsFactory.get(ScaffoldOptions, optionsFilePath);
      if (!options) {
        this.raiseError(`Unable to read options file: ${optionsFilePath}.`);
      }
    } else {
      options = new ScaffoldOptions();
      await options.loadDefaults();
    }

    if (flags.sobjects) {
      const objList = flags.sobjects;
      options.sObjectTypes.push(...objList.split(','));
    }

    this.UX.log('Retrieving Schemas...');
    for (const sObjectType of options.sObjectTypes) {
      await this.getSchema(sObjectType.replace(' ', ''));
    }

    this.UX.log('Reading ./sf-project.json file...');
    const project = await SfProject.default();
    const defaultFolder: string = project.getDefaultDirectory();

    this.UX.log('Generating Apex cls & cls-meta files...');

    const rootPath = `./${defaultFolder}/main/default/classes/`;
    await Utils.mkDirPath(rootPath);

    for (const [schemaName, schema] of this.schemas) {
      this.UX.log('\t' + schemaName);
      const fileDetails = this.generateTestSetupCode(schemaName, schema, options);

      await Utils.writeFile(rootPath + `${fileDetails.name as string}.cls`, fileDetails.contents);

      await Utils.writeFile(
        rootPath + `${fileDetails.name as string}.cls-meta.xml`,
        Scaffold.META_XML.replace(/API_VERSION_TOKEN/, project.sourceApiVersion)
      );
    }
  }
  private async getSchema(sObjectType: string): Promise<DescribeSObjectResult> {
    let schema = this.schemas.get(sObjectType);
    if (!schema) {
      schema = await SfTasks.describeObject(this.org, sObjectType);
      if (!schema) {
        this.raiseError('The returned schema is null.');
      }
      if (!schema.fields) {
        this.raiseError('The returned schema does not contain a fields member.');
      }
      this.schemas.set(schema.name.split('__')[0], schema);
    }
    return schema;
  }

  private generateTestSetupCode(simpleName: string, schema: DescribeSObjectResult, options: ScaffoldOptions): any {
    // Don't exceed max class name length
    const noUnderscoreName = simpleName.replace(/_/g, '');
    const className = `${noUnderscoreName.substring(0, Scaffold.MAX_CLASS_NAME_LENGTH - 4)}Test`;
    const varName = `${className.substring(0, 1).toLowerCase()}${className.substring(1)}`;
    const pre = '\t\t\t';
    const classLines = [
      '// This class was generated by the acu-pack:apex:scaffold command.',
      '@IsTest',
      `public with sharing class ${className} {`,
      '',
      '\t@TestSetup',
      '\tstatic void setupTestData() {',
      '\t\t// Create instance',
      `\t\t${schema.name} ${varName} = new ${schema.name}( `,
    ];

    const codeLines = new Map<string, string>();
    for (const field of schema.fields) {
      // Skip optional fields?
      if (!options.includeOptionalFields && field.nillable) {
        continue;
      }
      if (field.createable) {
        const value = options.includeRandomValues ? this.generateFieldValue(field) : null;
        codeLines.set(field.name, `${pre}${field.name} = ${value}`);
      }
    }

    const sortedKeys = Utils.sortArray(Array.from(codeLines.keys()));
    for (const key of sortedKeys) {
      let classLine = codeLines.get(key as string);
      if (key !== sortedKeys[sortedKeys.length - 1]) {
        classLine += ',';
      }
      classLines.push(classLine);
    }

    classLines.push(...['\t\t);', `\t\tinsert ${varName};`, '\t}', '}']);
    return {
      name: className,
      contents: classLines.join('\n'),
    };
  }

  private generateFieldValue(field: any): string {
    // https://developer.salesforce.com/docs/atlas.en-us.pages.meta/pages/pages_variables_global_objecttype_schema_fields_reference.htm
    if (!field) {
      this.raiseError('The field argument cannot be null.');
    }
    const noUnderscoreName: string = field.name.split('__')[0].replace(/_/g, '');

    const getStr = (fld: any, maxLength?: number): string => {
      if (!fld) {
        this.raiseError('The fld argument cannot be null.');
      }

      const value: string = fld.name;
      let strLen: number = fld.length;
      if (!strLen || strLen === 0 || strLen > maxLength) {
        strLen = maxLength;
      }

      // trim if we are too long
      if (strLen && value.length > strLen) {
        return value.substring(0, strLen);
      }
      return value;
    };

    const getDec = (fld: any, maxLength?: number): string => {
      if (!fld) {
        this.raiseError('The fld argument cannot be null.');
      }

      let num = '';
      let numLen = fld.precision;
      if (!numLen || numLen === 0 || numLen > maxLength) {
        numLen = maxLength;
      }
      const scale = fld.scale ?? 0;
      for (let index = 1; index <= numLen - scale; index++) {
        num += get1Rand();
      }
      if (fld.scale > 0) {
        num += '.';
        for (let index = 1; index <= scale; index++) {
          num += get1Rand();
        }
      }
      return num;
    };

    const getRand = (min: number, max: number): number => {
      return Math.floor(Math.random() * (max - min) + min);
    };

    const get1Rand = (): number => {
      return getRand(0, 9);
    };

    const getPicklist = (picklistValues: any[], count: number): string[] => {
      const values: string[] = [];
      const index = getRand(0, picklistValues.length);
      for (const picklist of picklistValues.slice(index)) {
        if (!picklist.active) {
          continue;
        }
        values.push(picklist.value as string);
        if (values.length === count) {
          return values;
        }
      }
      return null;
    };

    const getValue = (fld: any): string => {
      if (!fld) {
        this.raiseError('The fld argument cannot be null.');
      }
      switch (fld.type) {
        case 'anytype':
        case 'string':
        case 'encryptedString':
        case 'textarea':
          return `'${getStr(fld)}'`;
        case 'base64':
          return `'${Buffer.from(getStr(fld)).toString('base64')}'`;
        case 'textarea1': {
          const lineCount = 3;
          // Calculate length of each line (subtract for \n) then divide
          const lineLength = Math.floor((fld.length - lineCount) / 3);
          const lines = [];
          for (let lineIndex = 0; lineIndex < lineCount; lineIndex++) {
            lines.push(`${getStr(fld, lineLength)}`);
          }
          return lines.join('+\n');
        }
        case 'int':
        case 'integer':
          return `${getDec(fld, 10)}`;
        case 'long':
          return `${getDec(fld, 16)}L`;
        case 'double':
        case 'percent':
          return `${getDec(fld, 10)}`;

        case 'currency':
          return `${getDec(fld)}`;

        case 'address':
          return `'123 ${fld.name as string} St.'`;

        case 'boolean':
          return `${Math.random() < 0.5 ? 'true' : 'false'}`;

        case 'date':
          return 'Date.today()';

        case 'datetime':
          return 'Datetime.now()';

        case 'time':
          return 'Datetime.getTime()';

        case 'email':
          return `'${fld.name as string}@${noUnderscoreName}.email.org'`;

        case 'phone': {
          const phone = `555-${getRand(100, 999)}-${getRand(1000, 9999)} ext ${++this.index}`;
          // phone max is 40
          return `'${phone.substr(0, 40)}'`;
        }
        case 'multipicklist': {
          if (fld.picklistValues?.length === 0) {
            this.UX.log(`Skipping: ${fld.name as string} (${fld.type as string}) - no picklist values.`);
          }
          const count = Math.floor(fld.picklistValues.length / 3);
          const values = getPicklist(fld.picklistValues as string[], count);
          return values ? `'${values.join(';').replace(/'/g, "\\'")}'` : null;
        }
        case 'picklist': {
          if (fld.picklistValues?.length === 0) {
            this.UX.log(`Skipping: ${fld.name as string} (${fld.type as string}) - no picklist values.`);
          }
          const value = getPicklist(fld.picklistValues as string[], 1);
          return value ? `'${value.join(';').replace(/'/g, "\\'")}'` : null;
        }
        case 'url':
          return `'https://www.${noUnderscoreName}.salesforce.com.${this.orgAlias}/index'`;

        case 'id':
        case 'reference':
        case 'combobox':
        case 'dataCategoryGroupReference':
        default:
          this.UX.log(`Skipping: ${fld.name as string} (${fld.type as string})`);
          return null;
      }
    };
    return getValue(field);
  }
}
