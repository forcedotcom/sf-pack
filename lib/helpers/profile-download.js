"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileDownload = exports.Sobject = exports.FieldPermissionStructure = exports.ObjPermissionStructure = void 0;
const path = require("path");
const utils_1 = require("./utils");
const sf_query_1 = require("./sf-query");
const constants_1 = require("./constants");
class ObjPermissionStructure {
    constructor(init) {
        Object.assign(this, init);
    }
}
exports.ObjPermissionStructure = ObjPermissionStructure;
class FieldPermissionStructure {
    constructor(init) {
        Object.assign(this, init);
    }
}
exports.FieldPermissionStructure = FieldPermissionStructure;
class Sobject {
}
exports.Sobject = Sobject;
class ProfileDownload {
    constructor(org, profileList, profileIDMap, rootDir) {
        this.org = org;
        this.profileList = profileList;
        this.profileIDMap = profileIDMap;
        this.rootDir = rootDir;
        this.profileFilePath = new Map();
        ProfileDownload.org = org;
    }
    static processMissingObjectPermissions(objectData, includedObjects) {
        const profileObjectPermissions = new Map();
        const uniqueObjectNames = new Set();
        for (const obj of objectData) {
            if (uniqueObjectNames.add(obj.SObjectType) && !includedObjects.includes(obj.SObjectType)) {
                const objPemission = ProfileDownload.objPermissionStructure(obj.SObjectType, obj.PermissionsRead, obj.PermissionsCreate, obj.PermissionsEdit, obj.PermissionsDelete, obj.PermissionsViewAllRecords, obj.PermissionsModifyAllRecords);
                profileObjectPermissions.set(obj.SObjectType, objPemission);
            }
        }
        return profileObjectPermissions;
    }
    static processMissingFieldPermissions(fielddata) {
        const profileFieldPermissions = [];
        const uniqueFieldNames = new Set();
        for (const field of fielddata) {
            if (uniqueFieldNames.add(field.Field)) {
                const fieldPemission = ProfileDownload.fieldPermissionStructure(field.Field, field.PermissionsEdit, field.PermissionsRead);
                profileFieldPermissions.push(fieldPemission);
            }
        }
        return profileFieldPermissions;
    }
    static async writeProfileToXML(profileMetadata, filePath) {
        profileMetadata['$'] = {
            xmlns: constants_1.default.DEFAULT_XML_NAMESPACE,
        };
        const nonArrayKeys = ['custom', 'description', 'fullName', 'userLicense'];
        // Delete empty arrays
        for (const objKey in profileMetadata) {
            if (Array.isArray(profileMetadata[objKey])) {
                if (!nonArrayKeys.includes(objKey) && profileMetadata[objKey] && profileMetadata[objKey].length === 0) {
                    delete profileMetadata[objKey];
                }
            }
        }
        const xmlOptions = {
            renderOpts: { pretty: true, indent: '    ', newline: '\n' },
            rootName: 'Profile',
            xmldec: { version: '1.0', encoding: 'UTF-8' },
        };
        await utils_1.default.writeObjectToXmlFile(filePath, profileMetadata, xmlOptions);
    }
    // Return all profiles in the Org
    static async checkOrgProfiles(org) {
        const profileMap = new Map();
        const profileAPINameMatch = new Map([
            ['Contract Manager', 'ContractManager'],
            ['Marketing User', 'MarketingProfile'],
            ['Solution Manager', 'SolutionManager'],
            ['Read Only', 'ReadOnly'],
            ['Standard User', 'Standard'],
            ['System Administrator', 'Admin'],
            ['Contract Manager', 'ContractManager'],
            ['Marketing User', 'MarketingProfile'],
            ['Solution Manager', 'SolutionManager'],
            ['Read Only', 'ReadOnly'],
            ['Standard Platform User', 'StandardAul'],
        ]);
        const getProfiles = await sf_query_1.SfQuery.queryOrg(org, 'Select Id, Name from Profile');
        if (getProfiles.length > 0) {
            for (const profile of getProfiles) {
                const sObj = profile;
                const profileName = profileAPINameMatch.get(sObj.Name) || sObj.Name;
                profileMap.set(profileName, sObj.Id);
            }
        }
        return profileMap;
    }
    static objPermissionStructure(objName, allowRead, allowCreate, allowEdit, allowDelete, viewAllRecords, modifyAllRecords) {
        const objStructure = {
            object: objName,
            allowRead,
            allowCreate,
            allowEdit,
            allowDelete,
            viewAllRecords,
            modifyAllRecords,
        };
        return objStructure;
    }
    static fieldPermissionStructure(field, editable, readable) {
        const fieldStructure = {
            field,
            editable,
            readable,
        };
        return fieldStructure;
    }
    async downloadPermissions() {
        if (!(await utils_1.default.pathExists(path.join(this.rootDir, utils_1.default.tempFilesPath)))) {
            await utils_1.default.mkDirPath(path.join(this.rootDir, utils_1.default.tempFilesPath));
        }
        const resultsArray = [];
        for (const profileName of this.profileList) {
            resultsArray.push(this.getProfileMetaData(profileName));
        }
        await Promise.all(resultsArray);
        return this.profileFilePath;
    }
    async retrieveProfileMetaData(profileName) {
        if (!profileName) {
            return null;
        }
        const data = await ProfileDownload.org.getConnection().metadata.read('Profile', profileName);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return Array.isArray(data) ? data[0] : data;
    }
    async getProfileMetaData(profileName) {
        if (!profileName) {
            return;
        }
        // ProfileDownload.org.log(`Downloading '${profileName}' Profile ...`);
        const profileJson = await this.retrieveProfileMetaData(profileName);
        if (!profileJson) {
            return;
        }
        const filePath = path.join(path.join(this.rootDir, utils_1.default.tempFilesPath, profileName + '.json'));
        this.profileFilePath.set(profileName, filePath);
        const retrievedObjects = [];
        if (profileJson['objectPermissions'] && Array.isArray(profileJson.objectPermissions)) {
            for (const obj of profileJson.objectPermissions) {
                retrievedObjects.push(obj['object']);
            }
            const objectPermQuery = 'SELECT Parent.ProfileId,' +
                'PermissionsCreate,' +
                'PermissionsDelete,' +
                'PermissionsEdit,' +
                'PermissionsModifyAllRecords,' +
                'PermissionsRead,' +
                'PermissionsViewAllRecords,' +
                'SobjectType ' +
                'FROM ObjectPermissions ' +
                'WHERE Parent.ProfileId=' +
                "'" +
                this.profileIDMap.get(profileName) +
                "' " +
                'ORDER BY SObjectType ASC';
            const objData = await sf_query_1.SfQuery.queryOrg(ProfileDownload.org, objectPermQuery);
            const processObjData = ProfileDownload.processMissingObjectPermissions(objData, retrievedObjects);
            if (processObjData.size !== 0) {
                const sobjects = [];
                for (const obj of processObjData.keys()) {
                    sobjects.push(`'${obj}'`);
                }
                const fieldPermQuery = 'SELECT Field,' +
                    'Parent.ProfileId,' +
                    'SobjectType,' +
                    'PermissionsEdit,' +
                    'PermissionsRead ' +
                    'FROM FieldPermissions ' +
                    `WHERE SobjectType IN (${sobjects.join(',')})` +
                    ' AND Parent.ProfileId=' +
                    "'" +
                    this.profileIDMap.get(profileName) +
                    "'";
                const fieldMissingData = await sf_query_1.SfQuery.queryOrg(ProfileDownload.org, fieldPermQuery);
                const processFieldData = ProfileDownload.processMissingFieldPermissions(fieldMissingData);
                profileJson.objectPermissions.push(...processObjData.values());
                if (profileJson.fieldLevelSecurities && profileJson.fieldLevelSecurities.length > 0) {
                    profileJson.fieldLevelSecurities.push(...processFieldData);
                }
                else {
                    profileJson.fieldPermissions.push(...processFieldData);
                }
            }
        }
        await utils_1.default.writeFile(filePath, JSON.stringify(profileJson));
    }
}
exports.ProfileDownload = ProfileDownload;
//# sourceMappingURL=profile-download.js.map