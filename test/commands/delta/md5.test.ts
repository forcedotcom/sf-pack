import { promises as fs } from 'node:fs';
import { expect } from '@oclif/test';
import Setup from '../../helpers/setup';
import { DeltaOptions } from '../../../src/helpers/delta-options';
import Utils from '../../../src/helpers/utils';
import Md5 from '../../../src/commands/source/delta/md5';

const bogusMd5FilePath = 'bogus_' + Setup.md5FilePath;
const md5Provider = new Md5.md5DeltaProvider();
let testFilesCreated = 0;

describe('Md5DeltaProvider Tests', function () {
  beforeEach(async () => {
    testFilesCreated = 0;
    for await (const testFile of Setup.createTestFiles(Setup.sourceRoot)) {
      expect(testFile).is.not.null;
      testFilesCreated++;
    }

    if (await Utils.pathExists(bogusMd5FilePath)) {
      await fs.unlink(bogusMd5FilePath);
    }
    md5Provider.deltas.clear();
  });

  it('Has Name', function () {
    expect(md5Provider.name).equals('md5');
  });

  it('Has deltaLineToken', function () {
    expect(md5Provider.deltaLineToken).equals('=');
  });

  describe('loadDeltaFile Tests', function () {
    it('Can handle null', async function () {
      expect(md5Provider.deltas.size).equals(0);
      await md5Provider.loadDeltaFile(null);
      expect(md5Provider.deltas.size).equals(0);
    });
    it('Can load md5 diff file', async function () {
      expect(md5Provider.deltas.size).equals(0);
      await md5Provider.loadDeltaFile(Setup.md5FilePath);
      expect(md5Provider.deltas.size).not.equals(0);
    });
    it("Can't handle missing md5 diff file", async function () {
      expect(md5Provider.deltas.size).equals(0);
      await md5Provider.loadDeltaFile(bogusMd5FilePath);
      expect(md5Provider.deltas.size).equals(0);
    });
  });

  describe('diff Tests', function () {
    it('Can build missing md5 file', async function () {
      md5Provider.deltaOptions.deltaFilePath = bogusMd5FilePath;
      await md5Provider.loadDeltaFile();
      expect(md5Provider.deltas.size).equals(0);
      const diffSet = new Set();
      for await (const diff of md5Provider.diff(Setup.sourceRoot)) {
        diffSet.add(diff);
      }
      // since there was no hash file - there were no deltas returned as they are all new
      expect(diffSet.size).not.equals(0);
      // we should have hash entries though
      expect(diffSet.size).equals(md5Provider.deltas.size);
    });
    it('Can diff', async function () {
      md5Provider.deltaOptions.deltaFilePath = Setup.md5FilePath;
      expect(md5Provider.deltas.size).equals(0);
      const diffSet = new Set();
      for await (const diff of md5Provider.diff(Setup.sourceRoot)) {
        diffSet.add(diff);
      }
      // since there was no hash file - there were no deltas returned as they are all new
      expect(diffSet.size).not.equals(0);
      // we should have hash entries though
      expect(diffSet.size).equals(md5Provider.deltas.size);
    });
    it('Can run', async function () {
      const deltaOptions = new DeltaOptions();
      deltaOptions.deltaFilePath = Setup.md5FilePath;
      deltaOptions.source = Setup.sourceRoot;
      deltaOptions.destination = Setup.destinationRoot;

      const metrics = await md5Provider.run(deltaOptions);

      expect(metrics.Copy).equals(testFilesCreated);
    });
  });
  describe('validateDeltaOptions Tests', function () {
    it('Checks missing minimum required', async function () {
      const deltaOptions = new DeltaOptions();

      // NOT OK
      expect(await md5Provider.validateDeltaOptions(deltaOptions)).to.equal('No delta -s(ource) specified.');

      // OK
      deltaOptions.deltaFilePath = Setup.md5FilePath;
      expect(await md5Provider.validateDeltaOptions(deltaOptions)).to.equal('No delta -s(ource) specified.');

      // OK
      deltaOptions.source = Setup.sourceRoot;
      expect(await md5Provider.validateDeltaOptions(deltaOptions)).to.be.null;

      // OK
      deltaOptions.destination = Setup.destinationRoot;
      expect(await md5Provider.validateDeltaOptions(deltaOptions)).to.be.null;

      // OK
      deltaOptions.forceFile = 'force.txt';
      expect(await md5Provider.validateDeltaOptions(deltaOptions)).to.be.null;

      // OK
      deltaOptions.ignoreFile = 'ignore.txt';
      expect(await md5Provider.validateDeltaOptions(deltaOptions)).to.be.null;

      // OK
      deltaOptions.deleteReportFile = 'delete.txt';
      expect(await md5Provider.validateDeltaOptions(deltaOptions)).to.be.null;
    });
  });
});
