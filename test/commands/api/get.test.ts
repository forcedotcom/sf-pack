import path from 'node:path';
import { expect } from 'chai';
import Utils from '../../../src/helpers/utils.js';
import Setup from '../../helpers/setup.js';
import Get from '../../../src/commands/api/get.js';


describe('readIdsFromFlagOrFile Tests', function () {
  const ID = '068r0000003slVtAAI';
  const idsTxtPath = path.join(Setup.testFilesPath ,'ids.txt');
  const idsCsvPath = path.join(Setup.testFilesPath ,'ids.csv');

  const ids = `${ID}, ${ID}, ${ID} , ${ID} ,,,${ID}`;

  async function cleanUp(): Promise<boolean> {
    try {
      await Utils.deleteFile(idsTxtPath);
      await Utils.deleteFile(idsCsvPath);
      return true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
      return false;
    }
  }

  beforeEach(async () => {
    await cleanUp();
    await Utils.copyFile(path.join(Setup.testFilesPath, 'ids.save.txt'), idsTxtPath);
    await Utils.copyFile(path.join(Setup.testFilesPath, 'ids.save.csv'), idsCsvPath);
  });

  afterEach(async () => {
    await cleanUp();
  });


  it('Can Read TXT', async () => {
    const result = await Get.readIdsFromFlagOrFile(idsTxtPath);
    validate(result);
  });

  it('Can Read CSV', async () => {
    const result = await Get.readIdsFromFlagOrFile(idsCsvPath);
    validate(result);
  });

  it('Can Parse String', async () => {
    const result = await Get.readIdsFromFlagOrFile(ids);
    validate(result);
  });

  function validate(results: string[]) {
    let id;
    for(const result of results) {
      if(!id) {
        id = result;
      } else {
        expect(result).to.equal(id);
      }
    }
  }
});
