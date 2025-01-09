import { expect } from '@oclif/test';
import { OptionsFactory } from '../../src/helpers/options-factory';
import SchemaOptions from '../../src/helpers/schema-options';
import Utils from '../../src/helpers/utils';
import { PackageOptions } from '../../src/helpers/package-options';
import { OptionsSettings } from '../../src/helpers/options';
import {TestOptions } from './options.test';

const optionsPath = './options.json';
describe('OptionsFactory Tests', () => {
  beforeEach('Cleanup', async () => {
    await Utils.deleteFile(optionsPath);
  });
  it('Can Handle Null', async () => {
    expect(await OptionsFactory.get(null)).to.be.null;
    expect(await OptionsFactory.get(SchemaOptions)).to.not.be.undefined;
    expect(await OptionsFactory.get(SchemaOptions, null)).to.not.be.undefined;
  });
  it('Load method is invoked', async () => {
    const options = await OptionsFactory.get(SchemaOptions);
    expect(options.outputDefMap).to.be.instanceOf(Map);
    expect(options.outputDefMap.size).to.not.equal(0);
  });
  it('Creates Options File', async () => {
    const options = await OptionsFactory.get(SchemaOptions, optionsPath);
    expect(options).to.not.be.undefined;

    const fileExists = await Utils.pathExists(optionsPath);
    expect(fileExists).to.be.true;
  });
  it('Throws on Null Options File', async () => {
    try {
      await OptionsFactory.set(new TestOptions(), null);
      expect.fail();
    }catch(err) {
      expect(err.message).to.contain('You must specify an optionsFilePath.');
    }
  });
  it('Sets Options File', async () => {
    const options = new TestOptions();
    await OptionsFactory.set(options, optionsPath);
    expect(options).to.not.be.undefined;

    const fileExists = await Utils.pathExists(optionsPath);
    expect(fileExists).to.be.true;
  });
  it('Uses OptionSettings correctly', async () => {
    const optionsSettings = new OptionsSettings();
    optionsSettings.blockExternalConnections = true;
    const packageOptions = await OptionsFactory.get(PackageOptions, optionsPath, optionsSettings);
    expect(packageOptions.excludeMetadataTypes).is.not.null;
    expect(packageOptions.excludeMetadataTypes.length).equals(0);
  });
});
