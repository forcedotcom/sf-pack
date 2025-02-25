/*
import path from 'node:path';
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import Utils from '../../../src/helpers/utils.js';

describe.skip('package merge NUTs', () => {
  let session: TestSession;
  const testPath = './test/merge';
  const source = path.join(testPath, 'package-a.xml');
  const destination = path.join(testPath, 'package-b.xml');

  async function cleanUp(): Promise<boolean> {
    try {
      await Utils.deleteFile(source);
      await Utils.deleteFile(destination);
      return true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
      return false;
    }
  }

  beforeEach(async () => {
    await cleanUp();
    await Utils.copyFile(path.join(testPath, 'package-a.save.xml'), source);
    await Utils.copyFile(path.join(testPath, 'package-b.save.xml'), destination);
  });

  afterEach(async () => {
    await cleanUp();
  });

  before(async () => {
    session = await TestSession.create();
  });

  after(async () => {
    await session?.clean();
  });

  it('Merges Packages', async () => {
    const command = `package merge -s ${source} -d ${destination}`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;
    // eslint-disable-next-line no-console
    console.log(output);
    expect(output).to.contain('Merged package written:');
  });

  it('Compares Packages', async () => {
    const command = `package merge -s ${source} -d ${destination} -c`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;
    // eslint-disable-next-line no-console
    console.log(output);
    expect(output).to.contain('Packages written');
  });
});
*/