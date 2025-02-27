import path from 'node:path';
import { promises as fs } from 'node:fs';
import { Org } from '@salesforce/core';
import Utils from '../../src/helpers/utils.js';
import Constants from '../../src/helpers/constants.js';

export default class Setup {
  public static testPath = 'test';
  public static tmpPath = path.join('test','tmp');
  public static testFilesPath = path.join('test','files');
  
  // These files are needed for test execution
  public static gitFullDirFilePath = path.join(Setup.testFilesPath,'git-full-dir.txt');
  public static sourceForceAppRoot = path.join(Setup.testFilesPath,'force-app');
  public static csvTestFilePath = path.join(Setup.testFilesPath, 'records.csv');
  public static anonymousApexFilePath = path.join(Setup.testFilesPath, 'apex.cls');
  public static deltaIgnoreFile = path.join(Setup.testFilesPath, 'deltaIgnore.txt');
  public static fieldsJsonFile = path.join(Setup.testFilesPath, 'fields.json');
  public static deleteReportFile = path.join(Setup.testFilesPath, 'deleteReportFile.txt');

  // These files get created/destroyed via tests
  public static sourceRoot = Setup.getTmpPath('source_folder');
  public static destinationRoot = Setup.getTmpPath('destination_folder');
  public static md5FilePath = Setup.getTmpPath('md5.tmp.txt');
  public static gitFilePath = Setup.getTmpPath('git.tmp.txt');
  
  protected static orgUsername = null;

  public static get username(): string {
    return Setup.orgUsername;
  }

  public static set username(username: string) {
    Setup.orgUsername = username;
  }

  public static async org(): Promise<Org> {
    if (!Setup.username) {
      return null;
    }
    const org = await Org.create({ aliasOrUsername: Setup.username });
    return org;
  }

  public static async *createTestFiles(folder = Setup.sourceRoot, count = 5): AsyncGenerator<string, void, void> {
    // clean up previous folder & files
    // These files are created at the testing root folder
    await Utils.deleteFile(Setup.md5FilePath);
    await Utils.deleteFile(Setup.gitFilePath);

    const exists = await Utils.pathExists(folder);
    if (exists) {
      await fs.rm(folder, { recursive: true });
    }
    
    // Create tmp folder
    await Utils.mkDirPath(Setup.tmpPath);

    await Utils.mkDirPath(folder);
    if (folder !== Setup.sourceRoot) {
      await Utils.mkDirPath(Setup.sourceRoot);
    }
    await Utils.mkDirPath(Setup.destinationRoot);

    let deltaKind = 'A';
    let myPath = folder;
    let filePath: string = null;
    await Utils.mkDirPath(myPath);
    for (let x = 0; x < count; x++) {
      for (let y = 0; y < count; y++) {
        filePath = path.join(myPath, `myfile.${y}.txt`);
        await fs.appendFile(filePath, `${y}${Constants.EOL}`);
        await fs.appendFile(Setup.md5FilePath, `${filePath}=${y}${Constants.EOL}`);
        await fs.appendFile(Setup.gitFilePath, `${deltaKind}\t${filePath}${Constants.EOL}`);
        deltaKind = deltaKind === 'A' ? 'M' : 'A';
        yield filePath;
      }

      myPath = path.join(myPath, `sub_${x}`);
      await Utils.mkDirPath(myPath);
    }

    // Create staticresources folder structure
    filePath = path.join(folder, 'folder.resource-meta.xml');
    await fs.appendFile(filePath, `1${Constants.EOL}`);
    yield filePath;

    const folderPath = path.join(folder, 'folder');
    await Utils.mkDirPath(folderPath);

    filePath = path.join(folderPath, 'file1.txt');
    await fs.appendFile(filePath, `1${Constants.EOL}`);
    yield filePath;

    await fs.appendFile(Setup.md5FilePath, `${filePath}=1${Constants.EOL}`);
    await fs.appendFile(Setup.gitFilePath, `${deltaKind}\t${filePath}${Constants.EOL}`);
  }

  public static getTmpPath(fileName: string) {
    return path.join(Setup.tmpPath, fileName);
  }
}
