import path from 'node:path';
import { expect } from 'chai';
import { OptionsBase, OptionsSettings } from '../../src/helpers/options.js';
import { OptionsFactory } from '../../src/helpers/options-factory.js';
import SchemaOptions from '../../src/helpers/schema-options.js';
import { UnmaskOptions } from '../../src/helpers/unmask-options.js';
import { XPathOptions } from '../../src/helpers/xpath-options.js';
import Utils from '../../src/helpers/utils.js';
import { DeltaOptions } from '../../src/helpers/delta-options.js';
import Setup from './setup.js';

export class TestOptions extends OptionsBase {
  private static CURRENT_VERSION = 2.0;
  public version = 1.0;

  public get isCurrentVersion(): boolean {
    return TestOptions.CURRENT_VERSION === this.version;
  }

  public loadDefaults(): Promise<void> {
    return Promise.resolve();
  }

  protected setCurrentVersion(): void {
    super.setCurrentVersion();
    this.version = TestOptions.CURRENT_VERSION;
  }
}

const optionsPath = Setup.getTmpPath('options.json');
beforeEach('Cleanup', async () => {
  await Utils.deleteFile(optionsPath);
});
describe('Options Tests', () => {
  describe('Version Tests', () => {
    it('Checks for old versions', () => {
      const options = new TestOptions();
      options.version = 1.0;

      expect(options).to.not.be.null;
      expect(options.isCurrentVersion).to.be.false;
    });
    it('Can set new version correctly', async () => {
      let options = new TestOptions();
      options.version = 5.0;
      await options.save(optionsPath);
      // It writes the file
      expect(await Utils.pathExists(optionsPath)).is.true;

      options = await OptionsFactory.get(TestOptions, optionsPath);
      // It contains default data
      expect(options).to.not.be.null;
      expect(options.isCurrentVersion).to.be.true;
    });
    it('Can automatically update version', async () => {
      let options = new TestOptions();
      options.version = 1.0;
      expect(options.isCurrentVersion).to.be.false;

      await Utils.writeFile(optionsPath, JSON.stringify(options));
      // It writes the file
      expect(await Utils.pathExists(optionsPath)).is.true;

      options = await OptionsFactory.get(TestOptions, optionsPath);
      // It contains default data
      expect(options).to.not.be.null;
      expect(options.isCurrentVersion).to.be.true;
    });
    it('Can NOT automatically update version', async () => {
      let options = new TestOptions();
      options.version = 1.0;
      expect(options.isCurrentVersion).to.be.false;

      await Utils.writeFile(optionsPath, JSON.stringify(options));
      // It writes the file
      expect(await Utils.pathExists(optionsPath)).is.true;
      const optionsSettings = new OptionsSettings();
      optionsSettings.ignoreVersion = true;
      options = await OptionsFactory.get(TestOptions, optionsPath, optionsSettings);
      // It contains default data
      expect(options).to.not.be.null;
      expect(options.isCurrentVersion).to.be.false;
    });
    it('Can getSettings', async () => {
      const options = new TestOptions();
      expect(options.settings.ignoreVersion).to.be.false;
    });
  });
  describe('SchemaOptions Tests', () => {
    it('Creates New Object & File', async () => {
      const options = await OptionsFactory.get(SchemaOptions, optionsPath);

      // It writes the file
      expect(await Utils.pathExists(optionsPath)).is.true;

      // It contains default data
      expect(options).to.not.be.null;
      expect(options.outputDefMap).to.be.instanceOf(Map);
      expect(options.outputDefMap.size).to.not.equal(0);
    });
  });
  describe('XPathOptions Tests', () => {
    it('Creates New Object & File', async () => {
      let options = await OptionsFactory.get(XPathOptions, optionsPath);

      // It writes the file
      expect(await Utils.pathExists(optionsPath)).is.true;

      // It contains default data
      expect(options).to.not.be.null;
      expect(options.rules).to.be.instanceOf(Map);
      expect(options.rules.size).to.not.equal(0);

      options = new XPathOptions();
      await options.load(optionsPath);

      expect(options).to.not.be.null;
      expect(options.rules).to.be.instanceOf(Map);
      expect(options.rules.size).to.not.equal(0);
    });
  });
  describe('UnmaskOptions Tests', () => {
    it('Creates New Object & File', async () => {
      const options: UnmaskOptions = await OptionsFactory.get(UnmaskOptions, optionsPath);
      expect(options.userQuery).to.not.be.undefined;
      expect(options.userQuery.length).to.not.equal(0);

      // It writes the file
      expect(await Utils.pathExists(optionsPath)).is.true;

      // It contains default data
      expect(options).to.not.be.null;
      expect(options.sandboxes).to.be.instanceOf(Map);
      expect(options.sandboxes.size).to.not.equal(0);
      for (const [org, users] of options.sandboxes) {
        expect(org).to.not.be.null;
        expect(users).to.be.instanceOf(Array);
      }
    });
    it('Can handle null file', async () => {
      const options = new TestOptions();
      await options.load(null);
      expect(await options.load(null)).to.not.be.null;
    });
    it('Can handle null file', async () => {
      const options = await OptionsFactory.get(UnmaskOptions, optionsPath);
      try {
        await options.save(null);
        expect.fail();
      } catch (err) {
        expect(err.message).to.contain('The optionsPath argument cannot be null.');
      }
    });
    it('Updates File', async () => {
      const options = await OptionsFactory.get(UnmaskOptions, optionsPath);
      expect(options.userQuery).to.not.be.undefined;
      expect(options.userQuery.length).to.not.equal(0);

      // It writes the file
      expect(await Utils.pathExists(optionsPath)).is.true;

      options.userQuery = 'MJM';
      options.version = 5;
      await options.save(optionsPath);

      const options1 = await OptionsFactory.get(UnmaskOptions, optionsPath);
      expect(options1.userQuery).to.equal('MJM');
    });
  });
  describe('DeltaOptions Tests', () => {
    it('Creates New Object & File', async () => {
      const options = new DeltaOptions();
      await options.loadDefaults();

      // It contains default data
      expect(options).to.not.be.null;
      expect(options.deltaFilePath).to.not.be.null;

      const defaultPath = path.sep === '\\' ? '/' : '\\\\';
      options.deltaFilePath = defaultPath;
      options.source = defaultPath;
      options.destination = defaultPath;
      options.deleteReportFile = defaultPath;
      options.forceFile = defaultPath;
      options.ignoreFile = defaultPath;

      options.normalize();

      expect(options.deltaFilePath).to.not.equal(defaultPath);
      expect(options.source).to.not.equal(defaultPath);
      expect(options.destination).to.not.equal(defaultPath);
      expect(options.deleteReportFile).to.not.equal(defaultPath);
      expect(options.forceFile).to.not.equal(defaultPath);
      expect(options.ignoreFile).to.not.equal(defaultPath);
    });
  });
});
