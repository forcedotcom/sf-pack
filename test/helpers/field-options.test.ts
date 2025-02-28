import path from 'node:path';
import { expect } from 'chai';
import { Field } from '@jsforce/jsforce-node';
import { FieldOptions } from '../../src/helpers/field-options.js';
import Setup from '../helpers/setup.js';

class TestFieldOptions extends FieldOptions {}

const simpleName = 'template__c';
const sObjectJsonFilePath = path.join(Setup.testFilesPath, simpleName + '.json');
const templateObject = await Setup.loadDescribeSObjectResult(sObjectJsonFilePath);
const fieldOptions = new TestFieldOptions();;


describe('FieldOptions Tests', () => {
  it('Can handle null', async () => {
    const result = fieldOptions.removeExcluded(null);
    expect(result).to.be.null;
  });

  it('Can excludeFields', async () => {
    fieldOptions.excludeRules = new Map<string,any>([
      ['createable', false]
    ]);
    const expectedFields: Field[] = [];
    for(const field of templateObject.fields) {
      if(field.createable) {
        expectedFields.push(field);
      }
    } 
    const result = fieldOptions.removeExcluded(templateObject.fields);
    expect(result).to.not.be.undefined;
    expect(result).to.not.be.null;

    expect(result.length).to.equal(expectedFields.length);
  });
}).timeout(0);