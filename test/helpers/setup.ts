import { promises as fs } from 'node:fs';
import path = require('path');
import { Org } from '@salesforce/core';
import Utils from '../../src/helpers/utils';
import Constants from '../../src/helpers/constants';

export default class Setup {
  public static sourceRoot = 'test/source_folder';
  public static destinationRoot = 'test/destination_folder';
  public static md5FilePath = 'test/md5.test.txt';
  public static gitFilePath = 'test/git.test.txt';
  public static gitFullDirFilePath = 'test/git-full-dir.test.txt';
  public static sourceForceAppRoot = 'test/force-app';
  public static csvTestFilePath = 'test/records.csv';
  public static anonymousApexFilePath = 'test/apex.cls';
  public static retrievePackageFilePath = 'test/package-acc.xml';
  public static deltaIgnoreFile = 'test/deltaIgnore.txt';

  // private static orgUsername: string = null;
  private static orgUsername = 'mmalling@empathetic-panda-kbjs2g.com';

  public static get username(): string {
    return Setup.orgUsername;
  }
  
  public static get usernameFlag(): string {
    return Setup.username ? `-u ${Setup.username}` : '';
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
}
