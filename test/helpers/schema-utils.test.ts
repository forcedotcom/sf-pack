import { expect } from 'chai';
import { OptionsFactory } from '../../src/helpers/options-factory.js';
import SchemaOptions from '../../src/helpers/schema-options.js';
import SchemaUtils from '../../src/helpers/schema-utils.js';
import Utils from '../../src/helpers/utils.js';
import Setup from './setup.js';

describe('SchemaUtils Tests', () => {
  const schema = {
    name: 'Schema0',
    fields: [
      {
        label: 'Field 0',
        length: 1,
        mask: null,
        maskType: null,
        name: 'Field0',
        inlineHelpText: 'Help Text 0',
        picklistValues: [
          {
            active: true,
            value: 'PL1',
            defaultValue: true,
          },
          {
            active: true,
            value: 'PL2',
          },
        ],
      },
      {
        label: 'Field 1',
        length: 2,
        mask: null,
        maskType: null,
        name: 'Field1',
        inlineHelpText: 'Help Text 1',
        picklistValues: [
          {
            active: true,
            value: 'PL1',
            defaultValue: true,
          },
          {
            active: true,
            value: 'PL2',
          },
        ],
      },
    ],
    childRelationships: [
      {
        childSObject: 'childObject',
        field: 'field1__c',
        relationshipName: 'fields__r',
      },
    ],
    recordTypeInfos: [
      {
        name: 'recordType',
        developerName: 'recordType',
        master: true,
      },
      {
        name: 'recordType1',
        developerName: 'recordType1',
        master: false,
      },
    ],
  };
  let testOptions: SchemaOptions;

  beforeEach(async () => {
    testOptions = await OptionsFactory.get(SchemaOptions);
    testOptions.outputDefMap.clear();
    testOptions.outputDefMap.set('fields', [
      `SchemaName|${SchemaUtils.CONTEXT_SCHEMA}.name`,
      `FieldName|${SchemaUtils.CONTEXT_FIELD}.name`,
      `Label|${SchemaUtils.CONTEXT_SCHEMA}.label`,
      `Datatype|${SchemaUtils.CONTEXT_SCHEMA}.type`,
      `Length|${SchemaUtils.CONTEXT_SCHEMA}.length`,
      `HelpText|${SchemaUtils.CONTEXT_SCHEMA}.inlineHelpText`,
      `PicklistValues|getPicklistValues(${SchemaUtils.CONTEXT_FIELD}).join(',')`,
      `PicklistValueDefault|getPicklistDefaultValue(${SchemaUtils.CONTEXT_FIELD})`,
    ]);

    testOptions.outputDefMap.set('recordTypeInfos', [
      `SObjectName|${SchemaUtils.CONTEXT_SCHEMA}.name`,
      `RecordTypeName|${SchemaUtils.CONTEXT_FIELD}.name`,
      `RecordTypeLabel|${SchemaUtils.CONTEXT_FIELD}.developerName`,
      `IsMaster|${SchemaUtils.CONTEXT_FIELD}.master`,
    ]);
    testOptions.outputDefMap.set(`childRelationships`, [
      `SObjectName|${SchemaUtils.CONTEXT_SCHEMA}.name`,
      `RecordTypeName|${SchemaUtils.CONTEXT_FIELD}.name`,
      `RecordTypeLabel|${SchemaUtils.CONTEXT_FIELD}.developerName`,
      `IsMaster|${SchemaUtils.CONTEXT_FIELD}.master`,
    ]);
    testOptions.excludeFieldIfTrueFilter = '';
  });
  describe('getDynamicSchemaData Tests', () => {
    it('Can Handle Nulls', () => {
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-return */
      expect(() => Array.from(SchemaUtils.getDynamicSchemaData(null, null, null))).to.throw(
        'The schema argument cannot be null.'
      );
    });
    it('Can Handle bad schema', () => {
      const schemaTest = {};
      schemaTest['test'] = [];
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-return */
      expect(() => Array.from(SchemaUtils.getDynamicSchemaData(schemaTest, null, null))).to.throw(
        'The schema argument does not contains a fields member.'
      );
    });

    it('Can Handle Null code', () => {
      const schemaTest = {};
      schemaTest['fields'] = [];
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-return */
      expect(() => Array.from(SchemaUtils.getDynamicSchemaData(schemaTest, null, null))).to.throw(
        'The dynamicCode argument cannot be null.'
      );
    });

    it('Can Handle Null Collection', () => {
      const schemaTest = {};
      schemaTest['fields'] = [];
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-return */
      expect(() => Array.from(SchemaUtils.getDynamicSchemaData(schemaTest, 'dynamic code', null))).to.throw(
        'The collection argument cannot be null.'
      );
    });

    it('Works with schema', () => {
      testOptions.excludeFieldIfTrueFilter = '';
      for (const [name, outputDefs] of testOptions.outputDefMap) {
        const collection: any[] = schema[name];
        expect(collection).to.not.be.null;

        const code = testOptions.getDynamicCode(name);
        expect(code).to.not.be.null;

        for (const row of SchemaUtils.getDynamicSchemaData(schema, code, collection)) {
          expect(row).is.not.null;
          expect(row.length).equals(outputDefs.length);
        }
      }
    });
    it('Works with schema and exclude filter', () => {
      testOptions.excludeFieldIfTrueFilter = `${SchemaUtils.CONTEXT_FIELD}.label == "Field 0"`;
      const rows = [];
      const outputDefs = testOptions.outputDefMap.get('fields');
      const code = testOptions.getDynamicCode('fields');
      for (const row of SchemaUtils.getDynamicSchemaData(schema, code, schema.fields)) {
        expect(row).is.not.null;
        if (row.length !== 0) {
          expect(row.length).equals(outputDefs.length);
          rows.push(row);
        }
      }
      expect(rows.length).equals(schema.fields.length - 1);
    });
    it('Get Schema name from file', async () => {
      let count = 0;
      for await (const fileName of Utils.getFiles(Setup.sourceForceAppRoot, true)) {
        expect(SchemaUtils.getMetadataBaseName(fileName)).to.not.be.null;
        count++;
      }
      expect(count).to.be.greaterThan(0);
    });
  });
});
