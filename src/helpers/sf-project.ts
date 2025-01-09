import { SfProject as SfCoreProject } from '@salesforce/core';
import Constants from './constants';
export class PackageDirectory {
  public path: string = null;
  public default = false;
}

export default class SfProject {
  private static defaultInstance: SfProject;

  public packageDirectories: PackageDirectory[];
  public namespace: string;
  public sfdcLoginUrl: string;
  public sourceApiVersion: string;

  public constructor() {
    this.packageDirectories = [];
    this.namespace = '';
    this.sfdcLoginUrl = Constants.DEFAULT_SFDC_LOGIN_URL;
    this.sourceApiVersion = Constants.DEFAULT_PACKAGE_VERSION;
  }

  public static async default(): Promise<SfProject> {
    if (!SfProject.defaultInstance) {
      SfProject.defaultInstance = await SfProject.deserialize();
    }
    return SfProject.defaultInstance;
  }

  public static async deserialize(projectFilePath?: string): Promise<SfProject> {
    const project = await SfCoreProject.resolve(projectFilePath);
    const projectJson = await project.resolveProjectConfig();
    return Object.assign(new SfProject(), projectJson);
  }

  public getDefaultDirectory(): string {
    if (!this.packageDirectories) {
      return null;
    }
    for (const packageDirectory of this.packageDirectories) {
      if (packageDirectory.default) {
        return packageDirectory.path;
      }
    }
    return null;
  }
}
