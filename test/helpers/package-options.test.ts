import { expect } from '@oclif/test';
import { PackageOptions } from '../../src/helpers/package-options';
import { SfTasks } from '../../src/helpers/sf-tasks';
import Utils from '../../src/helpers/utils';
import { OptionsFactory } from '../../src/helpers/options-factory';

const optionsPath = './options.json';
let types: string[] = null;

describe('PackageOptions Tests', () => {
  beforeEach('Cleanup', async () => {
    await Utils.deleteFile(optionsPath);
    types = await SfTasks.getUnsupportedMetadataTypes();
  });
  it('Creates New Object', () => {
    const packageOptions = new PackageOptions();

    // It contains default data
    expect(packageOptions).is.not.null;
    expect(packageOptions.excludeMetadataTypes).is.not.null;
    expect(packageOptions.excludeMetadataTypes.length).equals(0);
  });
  it('Does Loads Defaults from Metadata Coverage Report', async () => {
    const packageOptions = new PackageOptions();
    await packageOptions.loadDefaults();
    expect(packageOptions.excludeMetadataTypes).is.not.null;
    expect(packageOptions.excludeMetadataTypes.length).equals(types.length);
  });
  it('Does NOT LoadsDefaults from Metadata Coverage Report', async () => {
    const packageOptions = new PackageOptions();
    packageOptions.settings.blockExternalConnections = true;
    await packageOptions.loadDefaults();
    expect(packageOptions.excludeMetadataTypes).is.not.null;
    expect(packageOptions.excludeMetadataTypes.length).equals(0);
  });
  it('Loads Defaults from Metadata Coverage Report and saves', async () => {
    let packageOptions = new PackageOptions();
    await packageOptions.loadDefaults();
    await packageOptions.save(optionsPath);

    packageOptions = await OptionsFactory.get(PackageOptions, optionsPath);
    expect(packageOptions.excludeMetadataTypes).is.not.null;
    expect(packageOptions.excludeMetadataTypes.length).equals(types.length);
  });
  it(`Saves changes correctly and doesn't reload Metadata Coverage Report`, async () => {
    let packageOptions = new PackageOptions();
    await packageOptions.loadDefaults();
    packageOptions.excludeMetadataTypes = ['bogus_type__c'];
    await packageOptions.save(optionsPath);

    packageOptions = await OptionsFactory.get(PackageOptions, optionsPath);
    // It contains default data
    expect(packageOptions).is.not.null;
    expect(packageOptions.excludeMetadataTypes).is.not.null;
    expect(packageOptions.excludeMetadataTypes[0]).equals('bogus_type__c');
  });
  it('Loads options', async () => {
    const packageOptions = new PackageOptions();
    expect(await packageOptions.load(optionsPath)).to.not.be.null;
  });
}).timeout(0);
