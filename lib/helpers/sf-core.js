import Utils from './utils.js';
import SfProject from './sf-project.js';
import Constants from './constants.js';
import XmlMerge from './xml-merge.js';
export class SfCore {
    static ASTERIX = '*';
    static MAIN = 'main';
    static DEFAULT = 'default';
    static EMAIL_TEMPLATE_XML_NAME = 'EmailTemplate';
    static jsonSpaces = 2;
    static async getPackageBase(version = null) {
        return {
            Package: {
                $: {
                    xmlns: Constants.DEFAULT_XML_NAMESPACE,
                },
                types: [],
                version: version || (await SfProject.default()).sourceApiVersion,
            },
        };
    }
    static async createPackage(packageTypes, version = null) {
        const packageObj = await SfCore.getPackageBase(version);
        const typeNames = Utils.sortArray(Array.from(packageTypes.keys()));
        for (const typeName of typeNames) {
            const members = Utils.sortArray(packageTypes.get(typeName));
            packageObj.Package.types.push({
                name: [typeName],
                members,
            });
        }
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-return */
        return packageObj;
    }
    static minifyPackage(packageObj) {
        if (!packageObj) {
            return null;
        }
        const popIndexes = [];
        let typeIndex = 0;
        for (const sType of packageObj.Package.types) {
            if (sType?.members) {
                const memPopIndexes = [];
                let memIndex = 0;
                for (const member of sType.members) {
                    if (!member || member === '') {
                        memPopIndexes.push(memIndex);
                    }
                    memIndex++;
                }
                while (memPopIndexes.length) {
                    sType.members.splice(memPopIndexes.pop(), 1);
                }
            }
            if (!sType?.members || sType.members.length === 0) {
                popIndexes.push(typeIndex);
            }
            typeIndex++;
        }
        while (popIndexes.length) {
            packageObj.Package.types.splice(popIndexes.pop(), 1);
        }
        return packageObj;
    }
    static async writePackageFile(metadataMap, packageFilePath, append, xmlOptions) {
        // Convert into Package format
        const sfPackage = await SfCore.createPackage(metadataMap);
        if (append) {
            await XmlMerge.mergeXmlToFile(sfPackage, packageFilePath);
        }
        else {
            await Utils.writeObjectToXmlFile(packageFilePath, sfPackage, xmlOptions);
        }
    }
}
//# sourceMappingURL=sf-core.js.map