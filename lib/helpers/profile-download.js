import path from 'node:path';
import Utils from './utils.js';
import { SfQuery } from './sf-query.js';
import Constants from './constants.js';
export class ObjPermissionStructure {
    SObjectType;
    PermissionsRead;
    PermissionsCreate;
    PermissionsEdit;
    PermissionsDelete;
    PermissionsViewAllRecords;
    PermissionsModifyAllRecords;
    constructor(init) {
        Object.assign(this, init);
    }
}
export class FieldPermissionStructure {
    Field;
    PermissionsRead;
    PermissionsEdit;
    constructor(init) {
        Object.assign(this, init);
    }
}
export class Sobject {
    Name;
    Id;
}
export class ProfileDownload {
    org;
    profileList;
    profileIDMap;
    rootDir;
    static org;
    profileFilePath = new Map();
    constructor(org, profileList, profileIDMap, rootDir) {
        this.org = org;
        this.profileList = profileList;
        this.profileIDMap = profileIDMap;
        this.rootDir = rootDir;
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
            xmlns: Constants.DEFAULT_XML_NAMESPACE,
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
        await Utils.writeObjectToXmlFile(filePath, profileMetadata, xmlOptions);
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
        const getProfiles = await SfQuery.queryOrg(org, 'Select Id, Name from Profile');
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
        if (!(await Utils.pathExists(path.join(this.rootDir, Utils.tempFilesPath)))) {
            await Utils.mkDirPath(path.join(this.rootDir, Utils.tempFilesPath));
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
        const filePath = path.join(path.join(this.rootDir, Utils.tempFilesPath, profileName + '.json'));
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
            const objData = await SfQuery.queryOrg(ProfileDownload.org, objectPermQuery);
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
                const fieldMissingData = await SfQuery.queryOrg(ProfileDownload.org, fieldPermQuery);
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
        await Utils.writeFile(filePath, JSON.stringify(profileJson));
    }
}
//# sourceMappingURL=profile-download.js.map