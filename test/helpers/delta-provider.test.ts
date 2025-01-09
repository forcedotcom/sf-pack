import path = require('path');
import { expect } from '@oclif/test';
import { DeltaOptions } from '../../src/helpers/delta-options';
import { DeltaCommandBase } from '../../src/helpers/delta-command';
import { Delta, DeltaProvider } from '../../src/helpers/delta-provider';
import Setup from './setup';

const config = new DeltaOptions({
  source: 'source',
  destination: 'destination',
  forceFile: 'force',
  ignoreFile: 'ignore',
});

export class TestDeltaProvider extends DeltaProvider {
  public name = 'TestDeltaProvider';
  public deltaLineToken = '\n';
  public deltas = new Map<string, any>();

  public processDeltaLine(deltaLine: string): void {
    if(!deltaLine) {
      return;
    }

    // const parts: string[] = deltaLine.split(this.deltaLineToken);
    // this.deltas.set(parts[1], parts[0]);
  }

  public getMessage(name: string): string {
    return name;
  }

  public async *diff(source: string): AsyncGenerator<Delta, any, any> {
    if(!source) {
      return null;
    }
    yield await Promise.resolve(new Delta(DeltaProvider.deltaTypeKind.A, source));
  }
}

describe('Delta Tests', () => {
  it('Can Handle Nulls', async () => {
    const results = new Delta(null, null);
    
    expect(results.deltaFile).to.be.null;
    expect(results.deltaKind).to.be.null;
  });
});
describe('DeltaProvider Tests', () => {
  describe('fullCopyDirNames Tests', () => {
    it('Can Handle Nulls', async () => {
      const deltaOptions = await DeltaCommandBase.getDeltaOptions(config);
      deltaOptions.fullCopyDirNames = null;
      expect(DeltaProvider.getFullCopyPath(null, null)).is.null;
      expect(DeltaProvider.getFullCopyPath('', null)).is.null;
      expect(DeltaProvider.getFullCopyPath(null, deltaOptions.fullCopyDirNames)).is.null;
    });

    it('Can Identify Full Copy Dir Names', async () => {
      const deltaOptions = await DeltaCommandBase.getDeltaOptions(config);
      const fullCopyDirName = deltaOptions.fullCopyDirNames[0];
      const fileName = 'something.site-meta.xml';

      let result = DeltaProvider.getFullCopyPath(
        `anything${path.sep}${fullCopyDirName}${path.sep}${fileName}`,
        deltaOptions.fullCopyDirNames
      );
      expect(`anything${path.sep}${fullCopyDirName}${path.sep}something${path.sep}`).equals(result);

      result = DeltaProvider.getFullCopyPath(
        `anything${path.sep}foldername${path.sep}${fileName}`,
        deltaOptions.fullCopyDirNames
      );
      expect(result).is.null;

      result = DeltaProvider.getFullCopyPath(
        `anything${path.sep}${fullCopyDirName}${path.sep}something.txt`,
        deltaOptions.fullCopyDirNames
      );
      expect(result).is.null;

      result = DeltaProvider.getFullCopyPath(
        `anything${path.sep}${fullCopyDirName}${path.sep}something.txt`,
        deltaOptions.fullCopyDirNames,
        true
      );
      expect(`anything${path.sep}${fullCopyDirName}${path.sep}something.txt${path.sep}`).equals(result);
    });

    it('Can Get Full Copy Path', async () => {
      const deltaOptions = await DeltaCommandBase.getDeltaOptions(config);
      const fileName = 'something.site-meta.xml';
      const partsPath = `anything${path.sep}${deltaOptions.fullCopyDirNames[0]}${path.sep}parent${path.sep}${fileName}`;
      const result = DeltaProvider.getFullCopyPath(partsPath, deltaOptions.fullCopyDirNames);
      expect(`anything${path.sep}${deltaOptions.fullCopyDirNames[0]}${path.sep}parent${path.sep}`).equals(result);

      const parts = ['anything', 'foldername', fileName];
      const notFullCopyPath = DeltaProvider.getFullCopyPath(parts.join(path.sep), deltaOptions.fullCopyDirNames);
      expect(notFullCopyPath).is.null;
    });
  });
  describe('DeltaProvider Instance Tests', () => {
    let testItemCount = 0;
    let testFilePath: string;
  
    beforeEach(async () => {
      testItemCount = 0;
      const folders = new Set();
      for await (const testFile of Setup.createTestFiles(Setup.sourceRoot)) {
        // Do test specific stuff here?
        testItemCount++;
        if (!testFilePath) {
          testFilePath = testFile;
        }
        const dir = path.dirname(testFile);
        if(!folders.has(dir)) {
          folders.add(dir);
        }
      }
    });
    it('Can Create Instance', async () => {
      const results = new TestDeltaProvider();
      expect(results.name).equals('TestDeltaProvider');
    });

    it('Can Not Handle No Options', async () => {
      const provider = new TestDeltaProvider();
      try{
        await provider.run(null);
        expect.fail();
      }catch( err) {
        expect(err.message).equals('No DeltaOptions specified.');
      }
    });

    it('Can Handle No Source', async () => {
      const provider = new TestDeltaProvider();
      const deltaOptions = new DeltaOptions();
      const results = await provider.run(deltaOptions);
      expect(results.Copy).equals(0);
    });

    it('Can Handle No Destination', async () => {
      const provider = new TestDeltaProvider();
      const deltaOptions = new DeltaOptions();
      deltaOptions.source = Setup.sourceRoot;
      deltaOptions.isDryRun = true;

      const results = await provider.run(deltaOptions);
      expect(results.Copy).equals(0);
    });

    it('Can run', async () => {
      const provider = new TestDeltaProvider();
      const deltaOptions = new DeltaOptions();
      deltaOptions.source = Setup.sourceRoot;
      deltaOptions.destination = Setup.destinationRoot;
      deltaOptions.deleteReportFile = './test/deleteReportFile.txt';
      deltaOptions.forceFile = Setup.deltaIgnoreFile;
      deltaOptions.ignoreFile = Setup.deltaIgnoreFile;
      deltaOptions.isDryRun = true;

      const results = await provider.run(deltaOptions);
      expect(results.Copy).greaterThan(0);
      expect(results.Copy).lessThanOrEqual(testItemCount);
    });
  });
});
