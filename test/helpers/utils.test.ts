/* eslint-disable no-console */
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { expect } from 'chai';
import Utils, { RestAction, RestResult } from '../../src/helpers/utils.js';
import Constants from '../../src/helpers/constants.js';
import Setup from './setup.js';

const testObject = { test: true };

let testName = 'RestResult';
describe(testName + ' Tests', () => {
  it(testName + ' Test Methods', async () => {
    const restResult = new RestResult();
    restResult.id = 'id';
    restResult.code = Constants.HTTP_STATUS_REDIRECT[0];
    restResult.body = { results: true, message: 'body_message' };
    restResult.isError = true;
    restResult.contentType = 'json';
    restResult.isBinary = false;
    restResult.headers = { location: 'redirect' };

    expect(restResult.isRedirect).to.be.true;
    expect(restResult.throw.bind(restResult)).to.throw();
    // expect(restResult.getContent()).to.equal(restResult.body);

    restResult.isError = false;
    expect(restResult.getContent()).to.equal(restResult.body);
    expect(restResult.throw()).to.be.undefined;

    expect(restResult.redirectUrl).to.not.be.undefined;

    restResult.code = 200;
    expect(restResult.isRedirect).to.be.false;
    expect(restResult.redirectUrl).to.be.undefined;
  });
});

describe('Utils Test', () => {
  let testItemCount = 0;
  let testFolderCount = 0;
  let testFilePath: string;

  beforeEach(async () => {
    testItemCount = 0;
    testFolderCount = 0;
    const folders = new Set();
    for await (const testFile of Setup.createTestFiles(Setup.sourceRoot)) {
      // Do test specific stuff here?
      testItemCount++;
      if (!testFilePath) {
        testFilePath = testFile;
      }
      const dir = path.dirname(testFile);
      if (!folders.has(dir)) {
        folders.add(dir);
      }
    }
    testFolderCount = folders.size;
  });

  const bogusPath = 'bogus_path';

  testName = 'getFiles';
  describe(testName + ' Test', () => {
    it(testName + 'Can handle nulls', async () => {
      for await (const file of Utils.getFiles(null)) {
        expect(file).to.be.null;
      }
    });
    it(testName + ' can find files', async () => {
      const files = [];
      for await (const file of Utils.getFiles(Setup.sourceRoot)) {
        files.push(file);
      }
      expect(files.length).equal(testItemCount);
    });
    it(testName + ' can Handle Missing Folders', async () => {
      const files = [];
      for await (const file of Utils.getFiles(bogusPath)) {
        files.push(file);
      }
      expect(files.length).equal(0);
    });
    it(testName + ' can Handle File Path', async () => {
      const files = [];
      for await (const file of Utils.getFiles(testFilePath)) {
        files.push(file);
      }
      expect(files.length).equal(1);
    });
    it(testName + ' can Handle GLOB', async () => {
      const files = [];
      for await (const file of Utils.getFiles(path.join(Setup.sourceRoot, '*.*'))) {
        files.push(file);
      }
      expect(files.length).not.equal(0);
    });
  });

  testName = 'getFolders';
  describe(testName + ' Test', () => {
    it(testName + 'Can handle nulls', async () => {
      for await (const file of Utils.getFolders(null)) {
        expect(file).to.be.null;
      }
    });
    it(testName + ' can find folders', async () => {
      const folders = [];
      for await (const file of Utils.getFolders(Setup.sourceRoot, false)) {
        folders.push(file);
      }
      expect(folders.length).equal(2);
    });
    it(testName + ' can find folders recursively', async () => {
      const folders = [];
      for await (const file of Utils.getFolders(Setup.sourceRoot, true)) {
        folders.push(file);
      }
      expect(folders.length).equal(testFolderCount);
    });
    it(testName + ' Can Handle Missing Folders', async () => {
      const folders = [];
      for await (const file of Utils.getFolders(bogusPath)) {
        folders.push(file);
      }
      expect(folders.length).equal(0);
    });
  });

  describe('readFileLines Test', () => {
    const testFilePathTest = `${Setup.sourceRoot}/readFileLinesTest.txt`;
    const testFileLineCount = 25;
    beforeEach(async () => {
      for (let index = 0; index < testFileLineCount; index++) {
        await fs.appendFile(testFilePathTest, `${index}${Constants.EOL}`);
      }
    });
    it('Can read file', async () => {
      const lines = [];
      for await (const file of Utils.readFileLines(testFilePathTest)) {
        lines.push(file);
      }
      expect(lines.length).equal(testFileLineCount);
    });
    it('Can Handle Missing Files', async () => {
      const lines = [];
      for await (const file of Utils.readFileLines(bogusPath)) {
        lines.push(file);
      }
      expect(lines.length).equal(0);
    });
  });

  testName = 'readFile';
  describe(testName + ' Test', () => {
    const testFilePathTest = `${Setup.sourceRoot}/readFileLinesTest.txt`;
    const testFileLineCount = 25;
    beforeEach(async () => {
      for (let index = 0; index < testFileLineCount; index++) {
        await fs.appendFile(testFilePathTest, `${index}${Constants.EOL}`);
      }
    });
    it(testName + ' can handle Nulls', async () => {
      const fileLines = await Utils.readFile(null);
      expect(fileLines).to.be.null;
    });
    it(testName + ' can read file', async () => {
      const fileLines = await Utils.readFile(testFilePathTest);
      expect(fileLines).to.not.be.null;
      expect(fileLines.length).greaterThan(0);
    });
    it(testName + ' can Handle Missing Files', async () => {
      const fileLines = await Utils.readFile(bogusPath);
      expect(fileLines).to.be.null;
    });
  });

  testName = 'pathExists';
  describe(testName + ' Test', () => {
    it(testName + ' can handle null', async () => {
      expect(await Utils.pathExists(null)).to.be.false;
    });
    it(testName + ' can find file', async () => {
      expect(await Utils.pathExists(testFilePath));
    });
    it(testName + ' can Handle Missing Files', async () => {
      expect(await Utils.pathExists(bogusPath)).false;
    });
  });

  testName = 'isENOENT';
  describe(testName + ' Test', () => {
    it(testName + ' can handle null', async () => {
      try {
        await fs.open(bogusPath, 'r');
        expect.fail('Should not see this.');
      } catch (err) {
        expect(Utils.isENOENT(null)).false;
      }
    });
    it(testName + ' works', async () => {
      try {
        await fs.open(bogusPath, 'r');
        expect.fail('Should not see this.');
      } catch (err) {
        expect(Utils.isENOENT(err)).true;
      }
    });
  });

  testName = 'copyFile';
  describe(testName + ' Test', () => {
    let destination: string = null;
    beforeEach(async () => {
      destination = path.join(Setup.destinationRoot, path.basename(testFilePath));
      if (destination && (await Utils.pathExists(destination))) {
        await fs.unlink(destination);
      }
    });
    it(testName + ' can handle null', async () => {
      await Utils.copyFile(null, null);
      const isSuccess = await Utils.pathExists(destination);
      expect(isSuccess).false;
    });
    it(testName + ' can copy file', async () => {
      await Utils.copyFile(testFilePath, destination);
      const isSuccess = await Utils.pathExists(destination);
      expect(isSuccess).true;
    });
    it(testName + ' can handle missing file', async () => {
      await Utils.copyFile(bogusPath, destination);
      const isSuccess = await Utils.pathExists(destination);
      expect(isSuccess).false;
    });
  });

  describe('getPathStat Test', () => {
    it('Can can handle null', async () => {
      expect(await Utils.getPathStat(null)).null;
    });
    it('Can Handle Missing Path', async () => {
      expect(await Utils.getPathStat(bogusPath)).null;
    });
    it('Can Handle Files', async () => {
      const stats = await Utils.getPathStat(testFilePath);
      expect(stats).not.null;
      expect(stats.isFile()).true;
    });
    it('Can Handle Folders', async () => {
      const stats = await Utils.getPathStat(Setup.sourceRoot);
      expect(stats).not.null;
      expect(stats.isDirectory()).true;
    });
  });

  describe('sortArray Test', () => {
    it('Can handle null', () => {
      const sortedArray = Utils.sortArray(null);
      expect(sortedArray).equal(null);
    });
    it('Can Handle Numbers', () => {
      const sortedArray = Utils.sortArray([4, 3, 2, 1, 0]);
      expect(sortedArray.join(',')).equal([0, 1, 2, 3, 4].join(','));
    });
    it('Can Handle Strings', () => {
      const sortedArray = Utils.sortArray(['4', '3', '2', '1', '0']);
      expect(sortedArray.join(',')).equal(['0', '1', '2', '3', '4'].join(','));
    });
    it('Can Handle Empty', () => {
      const sortedArray = Utils.sortArray([]);
      expect(sortedArray.join(',')).equal([].join(','));
    });
  });

  describe('selectXPath Tests', () => {
    const xml = "<root><node index='0'>data0</node><node1 index='0'>data0</node1><node index='1'>data1</node></root>";
    const xpath = '//root/node/text()';
    it('Can handle nulls', () => {
      expect(Utils.selectXPath(null, null)).to.be.undefined;
      expect(Utils.selectXPath(xml, null)).to.be.undefined
      expect(Utils.selectXPath(null, [])).to.be.undefined
      expect(Utils.selectXPath(xml, [])).to.be.undefined
      expect(Utils.selectXPath(xml, [xpath])).to.not.equal(null);
      expect(Utils.selectXPath(xml, [null, xpath])).to.not.equal(null);
    });
    it('Can find nodes', () => {
      const xpath2 = "//node[@index='1']";
      const results = Utils.selectXPath(xml, [xpath2]);
      expect(results.size).to.equal(1);
      expect(results.get(xpath2).length).to.equal(1);
      expect(results.get(xpath2)[0]).to.equal('<node index="1">data1</node>');
    });
    it('Can find node values', () => {
      const results = Utils.selectXPath(xml, [xpath]);
      expect(results.size).to.equal(1);
      expect(results.get(xpath).length).to.equal(2);
      expect(results.get(xpath)[0]).to.equal('data0');
      expect(results.get(xpath)[1]).to.equal('data1');
    });
    it('Can handle missing nodes', () => {
      const xpath2 = "//node[@bogus='1']";
      const results = Utils.selectXPath(xml, [xpath2]);
      expect(results.size).to.equal(1);
      expect(results.get(xpath2)).to.be.null;
    });
  });

  testName = 'deleteFile';
  describe(testName + ' Test', () => {
    let testDeleteFilePath: string = null;
    beforeEach(async () => {
      for await (const testFile of Utils.getFiles(Setup.sourceRoot)) {
        if (!testDeleteFilePath) {
          testDeleteFilePath = testFile;
        }
      }
    });

    it(testName + ' can handle null', async () => {
      const isSuccess = await Utils.deleteFile(null);
      expect(isSuccess).false;
    });
    it(testName + ' can delete file', async () => {
      const isSuccess = await Utils.deleteFile(testFilePath);
      expect(isSuccess).true;
    });
    it(testName + ' can handle missing file', async () => {
      const isSuccess = await Utils.deleteFile(bogusPath);
      expect(isSuccess).false;
    });
  });

  testName = 'sleep';
  describe(testName + ' Test', () => {
    it(testName + ' can handle null', async () => {
      await Utils.sleep(null);
      await Utils.sleep(-3000);
    });
    it(testName + ' can sleep', async () => {
      const start = process.hrtime();
      await Utils.sleep(3000);
      const elapsed = process.hrtime(start)[0] * 1000;
      // This test can fail sometimes on some platforms when an exact elapsed time of 3000 is used
      // Its sufficient just to check if a reasonable amount of time has elapsed since sleep was called
      expect(elapsed).to.be.greaterThanOrEqual(1000);
    });
  });

  testName = 'getFieldValues';
  describe(testName + ' Test', () => {
    it(testName + ' can handle null', async () => {
      expect(Utils.getFieldValues(null, null, null)).to.be.undefined;
      expect(Utils.getFieldValues([null], null, null)[0]).to.be.null;
      expect(Utils.getFieldValues([testObject], null, null)[0]).to.be.null;
      expect(Utils.getFieldValues([testObject], null)[0]).to.be.null;
    });
    it(testName + ' can get value', async () => {
      expect(Utils.getFieldValues([testObject], 'test')[0]).to.be.true;
      expect(Utils.getFieldValues([testObject], 'test', false)[0]).to.be.true;
    });
    it(testName + ' MUST get value', async () => {
      let results: string[] = null;
      try {
        results = Utils.getFieldValues([testObject], 'test1', true);
        expect.fail();
      } catch (err) {
        expect(err.message).to.contain(`Required Field: test1 not found in record`);
      }
      expect(results).to.be.null;
    });
  });

  describe('unmaskEmail Tests', () => {
    it('Can handle nulls', () => {
      expect(Utils.unmaskEmail(null)).to.be.undefined;
    });
    it('Can unmaskEmail', () => {
      expect(Utils.unmaskEmail('test.user@aie.army.com.soqldev.invalid')).to.equal('test.user@aie.army.com.soqldev');
    });
    it('Does not change unmasked email', () => {
      expect(Utils.unmaskEmail('test.user@aie.army.com.soqldev')).to.equal('test.user@aie.army.com.soqldev');
    });
  });

  testName = 'writeObjectToXmlFile';
  describe(testName + ' Test', () => {
    const testFilePathTest = `${Setup.sourceRoot}/writeObjectToXmlFileTest.txt`;
    beforeEach(async () => {
      await Utils.deleteFile(testFilePathTest);
    });
    it('Can Handle Null', async () => {
      let result = await Utils.writeObjectToXmlFile(null, null, null);
      expect(result).to.be.undefined;

      result = await Utils.writeObjectToXmlFile(null, null);
      expect(result).to.be.undefined;

      result = await Utils.writeObjectToXmlFile(null, {});
      expect(result).to.be.undefined;
    });
    it('Can Write File', async () => {
      const result = await Utils.writeObjectToXmlFile(testFilePathTest, testObject);
      expect(result).to.not.equal(null);
      const exists = await Utils.pathExists(result);
      expect(exists).to.be.true;
    });
  });

  testName = 'writeObjectToXml';
  describe(testName + ' Test', () => {
    const testFilePathTest = `${Setup.sourceRoot}/writeObjectToXmlFileTest.txt`;
    beforeEach(async () => {
      await Utils.deleteFile(testFilePathTest);
    });
    it(testName + ' can Handle Null', async () => {
      expect(Utils.writeObjectToXml(null, null)).to.be.undefined;
      expect(Utils.writeObjectToXml(null, Utils.defaultXmlOptions)).to.be.undefined;
    });
    it(testName + '  can Write Xml', async () => {
      const result = Utils.writeObjectToXml(testObject);
      expect(result).to.not.equal(null);
    });
  });

  describe('readObjectFromXmlFile Test', () => {
    const testFilePathTest = `${Setup.sourceRoot}/readObjectFromXmlFileTest.txt`;
    beforeEach(async () => {
      await fs.appendFile(
        testFilePathTest,
        `<?xml version='1.0' encoding='UTF-8' standalone='yes'?><root><test>true</test></root>`
      );
    });
    it('Can Handle Null', async () => {
      let result = await Utils.readObjectFromXmlFile(null, null);
      expect(result).equal(null);

      result = await Utils.readObjectFromXmlFile(null);
      expect(result).equal(null);
    });
    it('Can Read File', async () => {
      const result = await Utils.readObjectFromXmlFile(testFilePathTest);
      expect(result).to.not.equal(null);
      expect(result.root.test[0]).to.equal('true');
    });
  });

  /*
  describe('setCwd Test', () => {
    let lkgCwd: string = null;
    before(async () => {
      lkgCwd = process.cwd();
    });
    after(async () => {
      process.chdir(lkgCwd);
    });
    it('Can Handle Null', () => {
      expect(Utils.setCwd(null)).to.be.undefined;
    });
    it('Can Set Absolute Current Working Directory', () => {
      const testCwd = path.resolve(path.dirname(testFilePath));
      const cwd = process.cwd();
      const result = Utils.setCwd(testCwd);
      expect(result).equal(cwd);
      expect(process.cwd()).equal(testCwd);
    });
    it('Can Set Relative Current Working Directory', () => {
      const testCwd = path.dirname(testFilePath);
      const fillTestCwd = path.resolve(testCwd);
      const cwd = process.cwd();
      const result = Utils.setCwd(testCwd);
      expect(result).equal(path.resolve(cwd));
      expect(process.cwd()).equal(fillTestCwd);
    });
    it('Does not change Current Working Directory is same', () => {
      const cwd = process.cwd();
      const result = Utils.setCwd(cwd);
      expect(result).equal(cwd);
    });
  });
  */

  testName = 'deleteDirectory';
  describe(testName + ' Test', () => {
    let testFolderPath: string = null;
    testFilePath = null;
    beforeEach(async () => {
      testFolderPath = null;
      testFilePath = null;
      for await (const testFile of Utils.getFiles(Setup.sourceRoot)) {
        if (!testFilePath) {
          testFilePath = testFile;
          testFolderPath = path.dirname(testFile);
        }
      }
    });
    it(testName + ' can Handle Null', async () => {
      expect(await Utils.deleteDirectory(null)).to.be.false;
    });
    it(testName + ' can delete directory', async () => {
      expect(await Utils.pathExists(testFolderPath)).to.be.true;
      expect(await Utils.deleteDirectory(testFolderPath)).to.be.true;
      expect(await Utils.pathExists(testFolderPath)).to.be.false;
    });

    it(testName + ' can handle file', async () => {
      expect(await Utils.pathExists(testFilePath)).to.be.true;
      expect(await Utils.deleteDirectory(testFilePath)).to.be.false;
      expect(await Utils.pathExists(testFilePath)).to.be.true;
    });

    it(testName + ' can handle missing directory', async () => {
      expect(await Utils.pathExists(bogusPath)).to.be.false;
    });
  });

  describe('mkDirPath Test', () => {
    const testDirPath = path.join(Setup.tmpPath, 'testDir1','testDir2');
    const testDirFilePath = path.join(`${testDirPath}`, 'testFile.txt');
    afterEach(async () => {
      await Utils.deleteDirectory(testDirPath);
    });
    it('Can Handle Null', async () => {
      expect(await Utils.mkDirPath(null)).to.be.undefined;
      expect(await Utils.mkDirPath(null, null)).to.be.undefined;
      expect(await Utils.mkDirPath(null, true)).to.be.undefined;
    });
    it('Can Make Absolute Directory Path', async () => {
      const fullPath = path.join(process.cwd(), testDirPath);

      let exists = await Utils.pathExists(fullPath);
      expect(exists).to.be.false;

      await Utils.mkDirPath(fullPath);

      exists = await Utils.pathExists(fullPath);
      expect(exists).to.be.true;
    });
    it('Can Make Relative Directory Path', async () => {
      const fullPath = path.join(process.cwd(), testDirPath);

      let exists = await Utils.pathExists(fullPath);
      expect(exists).to.be.false;

      await Utils.mkDirPath(testDirPath);

      exists = await Utils.pathExists(fullPath);
      expect(exists).to.be.true;
    });
    it('Can Handle Paths with File Names', async () => {
      const fullPath = path.join(process.cwd(), testDirFilePath);

      let exists = await Utils.pathExists(fullPath);
      expect(exists).to.be.false;

      await Utils.mkDirPath(fullPath, true);

      // The file does not exist
      exists = await Utils.pathExists(fullPath);
      expect(exists).to.be.false;

      // but the folder does
      exists = await Utils.pathExists(path.dirname(fullPath));
      expect(exists).to.be.true;
    });
  });
  describe('Chunk Array test', () => {
    it('Chunk Array based on chunksize', () => {
      expect(Utils.chunkRecords(['1', '2', '3', '4'], 2)).to.eql([
        ['1', '2'],
        ['3', '4'],
      ]);
    });
  });
  describe('normalizePath Test', () => {
    it('Can handle nulls', () => {
      const filePath: string = null;
      expect(Utils.normalizePath(filePath)).to.equal(filePath);
    });
    it('Can Normalize Paths', () => {
      const unixSep = '/';
      const winSep = '\\';
      const pathParts = ['one', 'two', 'three', 'four', 'five'];
      const isWin = path.sep === '\\';

      const filePath = pathParts.join(isWin ? unixSep : winSep);
      const normFilePath = Utils.normalizePath(filePath);

      expect(normFilePath).to.not.include(isWin ? unixSep : winSep);
    });
  });
  describe('parseDelimitedLine Test', () => {
    it('Can handle nulls', () => {
      expect(Utils.parseDelimitedLine(null)).to.be.undefined;
    });
    it('Can handle empty strings', () => {
      expect(Utils.parseDelimitedLine('')).to.deep.equal([]);
    });
    it('Can handle empty lines', () => {
      expect(Utils.parseDelimitedLine('\r\n')).to.deep.equal([]);
    });
    it('Can pare delimited strings', () => {
      expect(Utils.parseDelimitedLine('one,two,three')).to.deep.equal(['one', 'two', 'three']);
      expect(Utils.parseDelimitedLine(',two,three')).to.deep.equal([null, 'two', 'three']);
      expect(Utils.parseDelimitedLine('one,two,')).to.deep.equal(['one', 'two', null]);
      expect(Utils.parseDelimitedLine('"one,two",three')).to.deep.equal(['one,two', 'three']);
      expect(Utils.parseDelimitedLine('    ,three')).to.deep.equal(['    ', 'three']);
      expect(Utils.parseDelimitedLine('"",two,three1')).to.deep.equal(['', 'two', 'three1']);
      expect(Utils.parseDelimitedLine(`one,"Mike's Command, two",,,three`)).to.deep.equal([
        'one',
        `Mike's Command, two`,
        null,
        null,
        'three',
      ]);
    });
  });
  describe('parseCSVFile Test', () => {
    it('Can handle nulls', async () => {
      for await (const csvObj of Utils.parseCSVFile(null)) {
        expect(csvObj).to.be.undefined;
      }
    });
    it('Can handle empty strings', async () => {
      for await (const csvObj of Utils.parseCSVFile('')) {
        expect(csvObj).to.be.undefined;
      }
    });
    it('Can parse CSV File', async () => {
      let counter = 0;
      const results = [
        {
          first: 'mike',
          middle: null,
          last: 'smith',
          street: '123 Main St.',
          city: ' Sterling',
          state: ' VA',
          zip: ' 20166',
        },
        {
          first: 'matt',
          middle: 'james',
          last: 'perlish',
          street: '321 King, common, way',
          city: 'Doublin',
          state: 'ME',
          zip: ' 55321',
        },
        { first: 'Julie', middle: null, last: 'Smith', street: null, city: null, state: null, zip: null },
      ];
      const csvFilePath = path.resolve(Setup.csvTestFilePath);
      for await (const csvObj of Utils.parseCSVFile(csvFilePath)) {
        expect(csvObj).to.deep.equal(results[counter]);
        counter++;
      }
    });
  });

  describe('getMIMEType Test', () => {
    it('Can handle nulls', () => {
      expect(Utils.getMIMEType(null)).to.be.false;
    });
    it('Can handle empty strings', () => {
      expect(Utils.getMIMEType('')).to.be.false;
    });
    it('Can lookup MIME Types', () => {
      expect(Utils.getMIMEType('mime.json')).to.equal(Constants.MIME_JSON);
    });
  });

  testName = 'getRestResult';
  describe(testName + ' Test', () => {
    it(testName + ' can Handle Null', async () => {
      expect(await Utils.getRestResult(null, null)).to.be.undefined;
      expect(await Utils.getRestResult(RestAction.GET, null)).to.be.undefined;
    });
    it(testName + ' can GET', async () => {
      const results = await Utils.getRestResult(RestAction.GET, Constants.METADATA_COVERAGE_REPORT_URL);
      expect(results).to.not.be.null;
    }).timeout(0);
    it(testName + ' can handle bad URL', async () => {
      const results = await Utils.getRestResult(RestAction.GET, bogusPath);
      expect(results.isError).to.be.true;
    }).timeout(0);
  });
});

describe('command Tests', () => {
  it('Can Handle Null', async () => {
    const results = await Utils.command(null);
    expect(results).is.null;
  });
  it('Can Execute', async () => {
    const results = await Utils.command(`dir ${process.cwd()}`);
    expect(results).is.not.null;
    expect(results).instanceOf(Array);
  });
  it('Can Handle bad command', async () => {
    try {
      await Utils.command('bogus');
      expect.fail();
    } catch (err) {
      expect(err.message).to.contain('Command failed: ');
    }
  });
});

describe('writeCSVFile Tests', () => {
  const data = [
    ['header1', 'header2'],
    ['value1', 'value2'],
    ['value3', 'value4'],
  ];

  const csvFilePath = `${Setup.sourceRoot}/writeCSVFile.csv`;

  beforeEach(async () => {
    await Utils.deleteFile(csvFilePath);
  });

  it('Can Handle Nulls', async () => {
    const result = await Utils.writeCSVFile(null,null);
    expect(result).is.undefined;
  });
  
  it('Can Handle Null File Path', async () => {
    const result = await Utils.writeCSVFile(null, data);
    expect(result).is.undefined;
  });

  it('Can Handle Null Data', async () => {
    const result = await Utils.writeCSVFile(csvFilePath, null);
    expect(result).is.undefined;
  });

  it('Can Write CSV File', async () => {
    const result = await Utils.writeCSVFile(csvFilePath, data);
    expect(result).to.not.equal(null);

    const exists = await Utils.pathExists(csvFilePath);
    expect(exists).to.be.true;
  });
});
