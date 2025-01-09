"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SfCore = void 0;
const utils_1 = require("./utils");
const sf_project_1 = require("./sf-project");
const constants_1 = require("./constants");
const xml_merge_1 = require("./xml-merge");
class SfCore {
    static async getPackageBase(version = null) {
        return {
            Package: {
                $: {
                    xmlns: constants_1.default.DEFAULT_XML_NAMESPACE,
                },
                types: [],
                version: version || (await sf_project_1.default.default()).sourceApiVersion,
            },
        };
    }
    static async createPackage(packageTypes, version = null) {
        const packageObj = await SfCore.getPackageBase(version);
        const typeNames = utils_1.default.sortArray(Array.from(packageTypes.keys()));
        for (const typeName of typeNames) {
            const members = utils_1.default.sortArray(packageTypes.get(typeName));
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
            await xml_merge_1.default.mergeXmlToFile(sfPackage, packageFilePath);
        }
        else {
            await utils_1.default.writeObjectToXmlFile(packageFilePath, sfPackage, xmlOptions);
        }
    }
}
exports.SfCore = SfCore;
SfCore.ASTERIX = '*';
SfCore.MAIN = 'main';
SfCore.DEFAULT = 'default';
SfCore.EMAIL_TEMPLATE_XML_NAME = 'EmailTemplate';
SfCore.jsonSpaces = 2;
//# sourceMappingURL=sf-core.js.map