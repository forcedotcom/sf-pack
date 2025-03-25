import { OptionsBase } from './options.js';
import { SfCore } from './sf-core.js';
import SchemaUtils from './schema-utils.js';

export default class SchemaOptions extends OptionsBase {
  private static CURRENT_VERSION = 1.0;
  public excludeCustomObjectNames: string[] = [];
  public includeCustomObjectNames: string[] = [];
  public outputDefMap = new Map<string, string[]>();

  public excludeFieldIfTrueFilter: string;
  public includeValidationRules: boolean;

  protected get currentVersion(): number {
    return SchemaOptions.CURRENT_VERSION;
  }

  public getDynamicCode(sheetName: string = null): string {
    let code = 'main(); function main() { const row=[];';

    if (this.excludeFieldIfTrueFilter) {
      code += `if( ${this.excludeFieldIfTrueFilter} ) { return []; } `;
    }
    const outputDefs = sheetName
      ? this.outputDefMap.get(sheetName)
      : this.outputDefMap.get(this.outputDefMap.keys[0] as string);

    if (outputDefs) {
      for (const outputDef of outputDefs) {
        const parts = outputDef.split('|');
        // skip entitydefinition metadata - need to query for these
        if (parts[1].includes(`${SchemaUtils.ENTITY_DEFINITION}.`)) {
          code += "row.push('');";
        } else {
          code += `row.push(${parts[1]});`;
        }
      }
    }
    code += 'return row; }';

    return code;
  }

  public getEntityDefinitionFields(sheetName: string = null): string[] {
    const fields: string[] = [];
    const outputDefs = sheetName
      ? this.outputDefMap.get(sheetName)
      : this.outputDefMap.get(this.outputDefMap.keys[0] as string);

    const entDefSearch = `${SchemaUtils.ENTITY_DEFINITION}.`;
    if (outputDefs) {
      for (const outputDef of outputDefs) {
        const parts = outputDef.split('|');
        if (parts[1].includes(entDefSearch)) {
          fields.push(parts[1].replace(entDefSearch, ''));
        }
      }
    }
    return fields;
  }

  public getDefinitionHeaders(sheetName: string = null): string[] {
    const headers = this.getDefinitionMap(sheetName);
    return headers ? Array.from(headers.keys()) : null;
  }

  public getDefinitionMap(sheetName: string = null): Map<string, string> {
    const defMap = new Map<string, string>();
    const outputDefs = sheetName
      ? this.outputDefMap.get(sheetName)
      : this.outputDefMap.get(this.outputDefMap.keys[0] as string);

    if (outputDefs) {
      for (const outputDef of outputDefs) {
        const parts = outputDef.split('|');
        defMap.set(parts[0], parts[1]);
      }
    }
    return defMap;
  }

  protected async deserialize(serializedOptions: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const options = JSON.parse(serializedOptions) as SchemaOptions;
        this.excludeFieldIfTrueFilter = options.excludeFieldIfTrueFilter;

        if (options.excludeCustomObjectNames) {
          this.excludeCustomObjectNames = options.excludeCustomObjectNames;
        }
        if (options.includeCustomObjectNames) {
          this.includeCustomObjectNames = options.includeCustomObjectNames;
        }
        if (options.includeValidationRules) {
          this.includeValidationRules = options.includeValidationRules;
        }
        if (options.outputDefMap) {
          this.outputDefMap = new Map(options.outputDefMap);
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  protected async serialize(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        resolve(
          JSON.stringify(
            {
              excludeCustomObjectNames: this.excludeCustomObjectNames ? this.excludeCustomObjectNames : [],
              includeCustomObjectNames: this.includeCustomObjectNames ? this.includeCustomObjectNames : [],
              excludeFieldIfTrueFilter: this.excludeFieldIfTrueFilter ? this.excludeFieldIfTrueFilter : '',
              includeValidationRules: this.includeValidationRules ? true : false,
              outputDefMap: Array.from(this.outputDefMap.entries()),
            },
            null,
            SfCore.jsonSpaces
          )
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  protected loadDefaults(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.outputDefMap.set('fields', [
          `SObjectName|${SchemaUtils.CONTEXT_SCHEMA}.name`,
          `Name|${SchemaUtils.CONTEXT_FIELD_NAME}`,
          `Description|${SchemaUtils.ENTITY_DEFINITION}.Description`,
          `Label|${SchemaUtils.CONTEXT_FIELD}.label`,
          `Datatype|${SchemaUtils.CONTEXT_FIELD}.type`,
          `Length|${SchemaUtils.CONTEXT_FIELD}.length`,
          `Precision|${SchemaUtils.CONTEXT_FIELD}.precision`,
          `Scale|${SchemaUtils.CONTEXT_FIELD}.scale`,
          `Digits|${SchemaUtils.CONTEXT_FIELD}.digits`,
          `IsCustom|${SchemaUtils.CONTEXT_FIELD}.custom`,
          `IsDeprecatedHidden|${SchemaUtils.CONTEXT_FIELD}.deprecatedAndHidden`,
          `IsAutonumber|${SchemaUtils.CONTEXT_FIELD}.autoNumber`,
          `DefaultValue|${SchemaUtils.CONTEXT_FIELD}.defaultValue`,
          `IsFormula|${SchemaUtils.CONTEXT_FIELD}.calculated`,
          `Formula|${SchemaUtils.CONTEXT_FIELD}.calculatedFormula`,
          `IsRequired|!${SchemaUtils.CONTEXT_FIELD}.nillable`,
          `IsExternalId|${SchemaUtils.CONTEXT_FIELD}.externalId`,
          `IsUnique|${SchemaUtils.CONTEXT_FIELD}.unique`,
          `IsCaseSensitive|${SchemaUtils.CONTEXT_FIELD}.caseSensitive`,
          `IsPicklist|${SchemaUtils.CONTEXT_FIELD}.picklistValues.length>0`,
          `IsPicklistDependent|${SchemaUtils.CONTEXT_FIELD}.dependentPicklist`,
          `PicklistValues|getPicklistValues(${SchemaUtils.CONTEXT_FIELD}).join(',')`,
          `PicklistValueDefault|getPicklistDefaultValue(${SchemaUtils.CONTEXT_FIELD})`,
          `IsLookup|${SchemaUtils.CONTEXT_FIELD}.referenceTo.length>0`,
          `LookupTo|${SchemaUtils.CONTEXT_FIELD}.referenceTo.join(',')`,
          `IsCreateable|${SchemaUtils.CONTEXT_FIELD}.createable`,
          `IsUpdateable|${SchemaUtils.CONTEXT_FIELD}.updateable`,
          `IsEncrypted|${SchemaUtils.CONTEXT_FIELD}.encrypted`,
          `HelpText|${SchemaUtils.CONTEXT_FIELD}.inlineHelpText`,
        ]);
        this.outputDefMap.set('childRelationships', [
          `ParentObjectName|${SchemaUtils.CONTEXT_SCHEMA}.name`,
          `ChildRelationShipName|${SchemaUtils.CONTEXT_FIELD}.relationshipName`,
          `ChildObjectName|${SchemaUtils.CONTEXT_FIELD}.childSObject`,
          `LookUpFieldOnChildObject|${SchemaUtils.CONTEXT_FIELD}.field`,
        ]);
        this.outputDefMap.set('recordTypeInfos', [
          `SObjectName|${SchemaUtils.CONTEXT_SCHEMA}.name`,
          `RecordTypeName|${SchemaUtils.CONTEXT_FIELD}.name`,
          `RecordTypeLabel|${SchemaUtils.CONTEXT_FIELD}.developerName`,
          `IsMaster|${SchemaUtils.CONTEXT_FIELD}.master`,
        ]);
        this.outputDefMap.set('validationRules', [
          'DeveloperName|name',
          'Active|active',
          'Description|description',
          'ErrorDisplayField|errorDisplayField',
          'ErrorMessage|errorMessage',
          'ErrorConditionFormula|errorConditionFormula',
        ]);
        this.excludeFieldIfTrueFilter = '';
      } catch (err) {
        reject(err);
      }
      resolve();
    });
  }
}
