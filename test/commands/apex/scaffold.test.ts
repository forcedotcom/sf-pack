import path from 'node:path';
import { expect } from 'chai';
import Scaffold from '../../../src/commands/apex/scaffold.js';
import Setup from '../../helpers/setup.js';
import { ScaffoldOptions } from '../../../src/helpers/scaffold-options.js';

const simpleName = 'template__c';
const sObjectJsonFilePath = path.join(Setup.testFilesPath, simpleName + '.json');
const templateObject = await Setup.loadDescribeSObjectResult(sObjectJsonFilePath);
let scaffoldOptions: ScaffoldOptions = null;

describe('Scaffold Tests', function () {
  beforeEach(async () => {
    
  });

  afterEach(async () => {
    
  });


  it('It Can Handle Nulls', async () => {
    const result = Scaffold.generateObjectApex(null, null);
    expect(result).to.be.undefined;
  });

  it('It Can Handle Null DescribeSObjectResult', async () => {
    const result = Scaffold.generateObjectApex(null, scaffoldOptions);
    expect(result).to.be.undefined;
  });

  it('It Can Handle Null ScaffoldOptions', async () => {
    const result = Scaffold.generateObjectApex(templateObject, null);
    expect(result).to.be.undefined;
  });

  it('It Can generateTestSetupCode', async () => {
    scaffoldOptions = new ScaffoldOptions();
    await scaffoldOptions.loadDefaults();
    const result = Scaffold.generateObjectApex(templateObject, scaffoldOptions);
    
    expect(result).to.not.be.undefined;
    expect(result).to.not.be.null;

    const fields = scaffoldOptions.removeExcluded(templateObject.fields);
    const fieldNames = Array.from(result.keys());
    
    // for(const field of templateObject.fields) {
    //   expect(fieldNames).to.include(field.name, `Unable to find Field name: ${}`)
    // }
    expect(fieldNames.length).to.equal(fields.length);
  });

});
