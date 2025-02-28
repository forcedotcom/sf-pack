import { expect } from 'chai';
import { OptionsFactory } from '../../src/helpers/options-factory.js';
import { ScaffoldOptions } from '../../src/helpers/scaffold-options.js';
import Utils from '../../src/helpers/utils.js';
const optionsPath = './options.json';

describe('ScaffoldOptions Tests', () => {
  beforeEach('Cleanup', async () => {
    await Utils.deleteFile(optionsPath);
  });
  it('Loads Defaults', async () => {
    let scaffoldOptions = new ScaffoldOptions();
    await scaffoldOptions.loadDefaults();
    expect(scaffoldOptions.excludeRules.size).equals(1);
    expect(scaffoldOptions.excludeRules).to.have.all.keys('createable');
    expect(scaffoldOptions.metaDataTypes).to.be.an('array');
    expect(scaffoldOptions.metaDataTypes.length).equals(0);

    await scaffoldOptions.save(optionsPath);

    scaffoldOptions = await OptionsFactory.get(ScaffoldOptions, optionsPath);
    expect(scaffoldOptions.excludeRules.size).equals(1);
    expect(scaffoldOptions.excludeRules).to.have.all.keys('createable');
    expect(scaffoldOptions.metaDataTypes).to.be.an('array');
    expect(scaffoldOptions.metaDataTypes.length).equals(0);
  });
}).timeout(0);