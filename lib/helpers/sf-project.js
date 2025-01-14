import { SfProject as SfCoreProject } from '@salesforce/core';
import Constants from './constants.js';
export class PackageDirectory {
    path = null;
    default = false;
}
export default class SfProject {
    static defaultInstance;
    packageDirectories;
    namespace;
    sfdcLoginUrl;
    sourceApiVersion;
    constructor() {
        this.packageDirectories = [];
        this.namespace = '';
        this.sfdcLoginUrl = Constants.DEFAULT_SFDC_LOGIN_URL;
        this.sourceApiVersion = Constants.DEFAULT_PACKAGE_VERSION;
    }
    static async default() {
        if (!SfProject.defaultInstance) {
            SfProject.defaultInstance = await SfProject.deserialize();
        }
        return SfProject.defaultInstance;
    }
    static async deserialize(projectFilePath) {
        const project = await SfCoreProject.resolve(projectFilePath);
        const projectJson = await project.resolveProjectConfig();
        return Object.assign(new SfProject(), projectJson);
    }
    getDefaultDirectory() {
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
//# sourceMappingURL=sf-project.js.map