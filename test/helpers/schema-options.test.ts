import { expect } from 'chai';
import { OptionsFactory } from '../../src/helpers/options-factory.js';
import SchemaOptions from '../../src/helpers/schema-options.js';
import SchemaUtils from '../../src/helpers/schema-utils.js';
import Setup from './setup.js';

const optionsPath = Setup.getTmpPath('options.json');

describe('SchemaOptions Tests', () => {
  it('Creates New Object', async () => {
    const testOptions = await OptionsFactory.get(SchemaOptions);
    // It contains default data
    expect(testOptions).is.not.null;
    expect(testOptions.outputDefMap).is.not.null;
    for (const [name, outputDefs] of testOptions.outputDefMap) {
      expect(name).is.not.null;
      expect(outputDefs).is.not.null;
      expect(outputDefs.length).to.not.equal(0);
    }
    expect(testOptions.excludeFieldIfTrueFilter).to.equal('');
  });
  describe('getDynamicCode Tests', () => {
    it('Works without outputDefs', async () => {
      const testOptions = await OptionsFactory.get(SchemaOptions);
      testOptions.outputDefMap = new Map<string, string[]>();
      const dynamicCode = testOptions.getDynamicCode();
      expect(dynamicCode).is.not.null;
      expect(dynamicCode).to.equal('main(); function main() { const row=[];return row; }');
    });
    it('Works with outputDefs', async () => {
      const testOptions = await OptionsFactory.get(SchemaOptions);
      const dynamicCode = testOptions.getDynamicCode('fields');

      expect(dynamicCode).is.not.null;
      expect(dynamicCode).to.contain('main(); function main() { const row=[];');
      expect(dynamicCode).to.not.contain(`if( ${testOptions.excludeFieldIfTrueFilter} ) { return []; } `);

      const recordTypeInfosDynamicCode = testOptions.getDynamicCode('recordTypeInfos');
      expect(recordTypeInfosDynamicCode).is.not.null;
      expect(recordTypeInfosDynamicCode).to.contain('main(); function main() { const row=[];');
      expect(recordTypeInfosDynamicCode).to.not.contain(
        `if( ${testOptions.excludeFieldIfTrueFilter} ) { return []; } `
      );

      const childObjectDynamicCode = testOptions.getDynamicCode('childRelationships');
      expect(childObjectDynamicCode).is.not.null;
      expect(childObjectDynamicCode).to.contain('main(); function main() { const row=[];');
      expect(childObjectDynamicCode).to.not.contain(`if( ${testOptions.excludeFieldIfTrueFilter} ) { return []; } `);

      for (const outputDef of testOptions.outputDefMap.get('fields')) {
        if (!outputDef.includes(SchemaUtils.ENTITY_DEFINITION)) {
          expect(dynamicCode).to.contain(`row.push(${outputDef.split('|')[1]});`);
        }
      }

      for (const outputDef of testOptions.outputDefMap.get('recordTypeInfos')) {
        expect(recordTypeInfosDynamicCode).to.contain(`row.push(${outputDef.split('|')[1]});`);
      }

      for (const outputDef of testOptions.outputDefMap.get('childRelationships')) {
        const field = outputDef.split('|')[1];
        expect(childObjectDynamicCode).to.contain(`row.push(${field});`);
      }
    });
    it('Works with excludeFieldIfTrueFilter', async () => {
      const testOptions = await OptionsFactory.get(SchemaOptions);
      testOptions.excludeFieldIfTrueFilter = 'item.name == "mjm"';
      const dynamicCode = testOptions.getDynamicCode('fields');

      expect(dynamicCode).is.not.null;
      expect(dynamicCode).to.contain('main(); function main() { const row=[];');

      expect(dynamicCode).to.contain(`if( ${testOptions.excludeFieldIfTrueFilter} ) { return []; } `);

      for (const outputDef of testOptions.outputDefMap.get('fields')) {
        if (!outputDef.includes(SchemaUtils.ENTITY_DEFINITION)) {
          expect(dynamicCode).to.contain(`row.push(${outputDef.split('|')[1]});`);
        }
      }
    });
    it('Handles Nulls', async () => {
      const schemaOptions = new SchemaOptions();
      expect(await schemaOptions.load(null)).to.be.undefined;
    });
    it('Loads options', async () => {
      const schemaOptions = new SchemaOptions();
      schemaOptions.excludeCustomObjectNames = [];
      schemaOptions.includeCustomObjectNames = [];
      schemaOptions.outputDefMap = new Map<string, string[]>();
      expect(await schemaOptions.load(optionsPath)).to.not.be.null;
    });
    it('Loads options (fields)', async () => {
      const schemaOptions = new SchemaOptions();
      await schemaOptions.load(null);
      schemaOptions.outputDefMap.set('fields', [
        `SchemaName|${SchemaUtils.CONTEXT_SCHEMA}.name`,
        `FieldName|${SchemaUtils.CONTEXT_FIELD}.name`,
        `Label|${SchemaUtils.CONTEXT_SCHEMA}.label`,
        `Datatype|${SchemaUtils.CONTEXT_SCHEMA}.type`,
        `Length|${SchemaUtils.CONTEXT_SCHEMA}.length`,
        `HelpText|${SchemaUtils.CONTEXT_SCHEMA}.inlineHelpText`,
        `PicklistValues|getPicklistValues(${SchemaUtils.CONTEXT_FIELD}).join(',')`,
        `PicklistValueDefault|getPicklistDefaultValue(${SchemaUtils.CONTEXT_FIELD})`,
      ]);
      let fields = schemaOptions.getEntityDefinitionFields();
      expect(fields).to.not.be.null;
      // expect(fields.length).to.be.greaterThan(0);

      fields = schemaOptions.getEntityDefinitionFields('fields');
      expect(fields).to.not.be.null;
      // expect(fields.length).to.be.greaterThan(0);

      fields = schemaOptions.getEntityDefinitionFields('bogus');
      expect(fields).to.not.be.null;
    });
    it('Loads options (recordTypeInfos)', async () => {
      const schemaOptions = new SchemaOptions();
      await schemaOptions.load(null);
      schemaOptions.outputDefMap.set('recordTypeInfos', [
        `SObjectName|${SchemaUtils.CONTEXT_SCHEMA}.name`,
        `RecordTypeName|${SchemaUtils.CONTEXT_FIELD}.name`,
        `RecordTypeLabel|${SchemaUtils.CONTEXT_FIELD}.developerName`,
        `IsMaster|${SchemaUtils.CONTEXT_FIELD}.master`,
      ]);
      const recordTypeInfos = schemaOptions.getEntityDefinitionFields('recordTypeInfos');
      expect(recordTypeInfos).to.not.be.null;
      expect(recordTypeInfos.length).to.equal(0);
    });
    it(`Saves`, async () => {
      let schemaOptions = new SchemaOptions();
      schemaOptions.outputDefMap.set('fields', [
        `SchemaName|${SchemaUtils.CONTEXT_SCHEMA}.name`,
        `FieldName|${SchemaUtils.CONTEXT_FIELD}.name`,
        `Label|${SchemaUtils.CONTEXT_SCHEMA}.label`,
        `Datatype|${SchemaUtils.CONTEXT_SCHEMA}.type`,
        `Length|${SchemaUtils.CONTEXT_SCHEMA}.length`,
        `HelpText|${SchemaUtils.CONTEXT_SCHEMA}.inlineHelpText`,
        `PicklistValues|getPicklistValues(${SchemaUtils.CONTEXT_FIELD}).join(',')`,
        `PicklistValueDefault|getPicklistDefaultValue(${SchemaUtils.CONTEXT_FIELD})`,
      ]);
      await schemaOptions.save(optionsPath);

      schemaOptions = await OptionsFactory.get(SchemaOptions, optionsPath);
      // It contains default data
      expect(schemaOptions).is.not.null;
    });
  });
});
