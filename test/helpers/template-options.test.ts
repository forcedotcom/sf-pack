import { expect } from 'chai';
import { OptionsFactory } from '../../src/helpers/options-factory.js';
import { TemplateOptions } from '../../src/helpers/template-options.js';
import Utils from '../../src/helpers/utils.js';
const optionsPath = './options.json';

describe('ScaffoldOptions Tests', () => {
  beforeEach('Cleanup', async () => {
    await Utils.deleteFile(optionsPath);
  });
  it('Loads Defaults', async () => {
    let scaffoldOptions = new TemplateOptions();
    await scaffoldOptions.loadDefaults();
    expect(scaffoldOptions.excludeFieldTypes).to.be.an('array');
    expect(scaffoldOptions.excludeFieldTypes.length).equals(3);
    expect(scaffoldOptions.metaDataTypes).to.be.an('array');
    expect(scaffoldOptions.metaDataTypes.length).equals(0);

    await scaffoldOptions.save(optionsPath);

    scaffoldOptions = await OptionsFactory.get(TemplateOptions, optionsPath);
    expect(scaffoldOptions.excludeFieldTypes).to.be.an('array');
    expect(scaffoldOptions.excludeFieldTypes.length).equals(3);
    expect(scaffoldOptions.metaDataTypes).to.be.an('array');
    expect(scaffoldOptions.metaDataTypes.length).equals(0);
  });
}).timeout(0);