import { expect } from 'chai';
import { DeltaCommandBase } from '../../src/helpers/delta-command.js';

const config = {
  source: 'source',
  destination: 'destination',
  forceFile: 'force',
  ignoreFile: 'ignore',
  deltaFilePath: 'deltaFilePath',
  options: null,
  copyfulldir: null,
};

describe('DeltaCommand Tests', () => {
  describe('getFlagsConfig Tests', () => {
    it('Can Get Flags', () => {
      const testFlags = DeltaCommandBase.getFlagsConfig(null);
      validateFlags(testFlags);
    });
  });

  describe('getDeltaOptions Tests', () => {
    it('Can Handle Nulls', async () => {
      const deltaOptions = await DeltaCommandBase.getDeltaOptions(null);
      expect(deltaOptions).is.not.null;
      expect(deltaOptions.deltaFilePath).is.null;
      expect(deltaOptions.source).is.null;
      expect(deltaOptions.destination).is.null;
      expect(deltaOptions.forceFile).is.null;
      expect(deltaOptions.ignoreFile).is.null;
      expect(deltaOptions.fullCopyDirNames).is.not.null;
    });

    it('Can Parse Config', async () => {
      const deltaOptions = await DeltaCommandBase.getDeltaOptions(config);
      expect(deltaOptions.deltaFilePath).equals(config.deltaFilePath);
      expect(deltaOptions.source).equals(config.source);
      expect(deltaOptions.destination).equals(config.destination);
      expect(deltaOptions.forceFile).equals(config.forceFile);
      expect(deltaOptions.ignoreFile).equals(config.ignoreFile);
      expect(deltaOptions.fullCopyDirNames[0]).equals(DeltaCommandBase.defaultCopyDirList[0]);
      expect(deltaOptions.fullCopyDirNames[1]).equals(DeltaCommandBase.defaultCopyDirList[1]);
      expect(deltaOptions.fullCopyDirNames[2]).equals(DeltaCommandBase.defaultCopyDirList[2]);
    });

    it('Can Load Options', async () => {
      config.options = './test/options.json';
      const deltaOptions = await DeltaCommandBase.getDeltaOptions(config);
      expect(deltaOptions.deltaFilePath).equals('');
      expect(deltaOptions.source).equals('');
      expect(deltaOptions.destination).equals('');
      expect(deltaOptions.forceFile).equals('');
      expect(deltaOptions.ignoreFile).equals('');
      expect(deltaOptions.fullCopyDirNames[0]).equals(DeltaCommandBase.defaultCopyDirList[0]);
      expect(deltaOptions.fullCopyDirNames[1]).equals(DeltaCommandBase.defaultCopyDirList[1]);
      expect(deltaOptions.fullCopyDirNames[2]).equals(DeltaCommandBase.defaultCopyDirList[2]);
    });
    it('Can Parse fullCopyDirNames Config', async () => {
      config.options = null;
      config.copyfulldir = 'dir1,dir2';
      const deltaOptions = await DeltaCommandBase.getDeltaOptions(config);
      expect(deltaOptions.fullCopyDirNames[0]).equals('dir1');
      expect(deltaOptions.fullCopyDirNames[1]).equals('dir2');
    });
  });

  function validateFlags(flagsConfig: any): void {
    expect(flagsConfig);
    expect(flagsConfig.options);
    expect(flagsConfig.options.char).equals('o');
    expect(flagsConfig.options.required).is.undefined;
    expect(flagsConfig.options.description).is.not.null;

    expect(flagsConfig.source);
    expect(flagsConfig.source.char).equals('s');
    expect(flagsConfig.source.required).is.undefined;
    expect(flagsConfig.source.description).is.not.null;

    expect(flagsConfig.destination);
    expect(flagsConfig.destination.char).equals('d');
    expect(flagsConfig.destination.required).is.undefined;
    expect(flagsConfig.destination.description).is.not.null;

    expect(flagsConfig.force);
    expect(flagsConfig.force.char).equals('f');
    expect(flagsConfig.force.required).is.undefined;
    expect(flagsConfig.force.description).is.not.null;

    expect(flagsConfig.ignore);
    expect(flagsConfig.ignore.char).equals('i');
    expect(flagsConfig.ignore.required).is.undefined;
    expect(flagsConfig.ignore.description).is.not.null;

    expect(flagsConfig.deletereport);
    expect(flagsConfig.deletereport.char).equals('r');
    expect(flagsConfig.deletereport.required).is.undefined;
    expect(flagsConfig.deletereport.description).is.not.null;

    expect(flagsConfig.check);
    expect(flagsConfig.check.char).equals('c');
    expect(flagsConfig.check.required).is.undefined;
    expect(flagsConfig.check.description).is.not.null;
  }
});
