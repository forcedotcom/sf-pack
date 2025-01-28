import { expect } from 'chai';
import { ScaffoldOptions } from '../../src/helpers/scaffold-options.js';
import Utils from '../../src/helpers/utils.js';
import { OptionsFactory } from '../../src/helpers/options-factory.js';

const optionsPath = './options.json';

describe('ScaffoldOptions Tests', () => {
  beforeEach('Cleanup', async () => {
    await Utils.deleteFile(optionsPath);
  });
  it('Loads Defaults', async () => {
    let scaffoldOptions = new ScaffoldOptions();
    await scaffoldOptions.loadDefaults();
    expect(scaffoldOptions.includeOptionalFields).is.false;
    expect(scaffoldOptions.includeRandomValues).is.false;
    expect(scaffoldOptions.sObjectTypes).to.be.an('array');
    expect(scaffoldOptions.sObjectTypes.length).equals(0);

    await scaffoldOptions.save(optionsPath);

    scaffoldOptions = await OptionsFactory.get(ScaffoldOptions, optionsPath);
    expect(scaffoldOptions.includeOptionalFields).is.false;
    expect(scaffoldOptions.includeRandomValues).is.false;
    expect(scaffoldOptions.sObjectTypes).to.be.an('array');
    expect(scaffoldOptions.sObjectTypes.length).equals(0);
  });
}).timeout(0);


