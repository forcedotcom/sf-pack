import { expect } from '@oclif/test';
import { Office } from '../../src/helpers/office';
import Utils from '../../src/helpers/utils';

const testFilePath = './output.test.xlsx';
const data = new Map<string, string[][]>();

describe('Office Tests', () => {
  before('Cleanup', async () => {
    await Utils.deleteFile(testFilePath);
    data.set('book', [
      ['row1col1', 'row1col2'],
      ['row2col1', 'row2col2'],
      ['row3col1', 'row3col2'],
    ]);
  });
  after('Cleanup', async () => {
    await Utils.deleteFile(testFilePath);
  });
  describe('writeXlxsWorkbook Test', () => {
    it('Throws on Nulls', () => {
      expect(Office.writeXlxsWorkbook.bind(null, null, null)).to.throw('workbookMap cannot be null.');
    });
    it('Throws on Null Data', () => {
      expect(Office.writeXlxsWorkbook.bind(null, null, testFilePath)).to.throw('workbookMap cannot be null.');
    });
    it('Throws on Null Path', () => {
      expect(Office.writeXlxsWorkbook.bind(null, data, null)).to.throw('xlxsFilePath cannot be null.');
    });
    it('Throws on invalid file extensions', () => {
      expect(Office.writeXlxsWorkbook.bind(null, data, './invalid.file.extension.test')).to.throw(
        'Unrecognized bookType |test|'
      );
    });
    it('Writes Xlxs File', async () => {
      Office.writeXlxsWorkbook(data, testFilePath);
      expect(await Utils.pathExists(testFilePath)).to.be.true;
    });
    it('Can handle file name with invalid chars', async () => {
      data.clear();
      data.set('book?', [
        ['row1col1', 'row1col2'],
        ['row2col1', 'row2col2'],
        ['row3col1', 'row3col2'],
      ]);
      Office.writeXlxsWorkbook(data, testFilePath);
      expect(await Utils.pathExists(testFilePath)).to.be.true;
    });
  });
});
