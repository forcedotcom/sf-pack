"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SfQuery = exports.SfValidationRule = exports.SfCodeCoverageItem = exports.SfCodeCoverage = exports.SfObjectPermission = exports.SfFieldPermission = exports.SfPermission = exports.SfPermissionSet = exports.SfFolder = exports.SfSetupEntityAccess = exports.SfEntity = void 0;
const utils_1 = require("./utils");
// SoqlQueryResult
class SfEntity {
}
exports.SfEntity = SfEntity;
class SfSetupEntityAccess {
}
exports.SfSetupEntityAccess = SfSetupEntityAccess;
class SfFolder extends SfEntity {
}
exports.SfFolder = SfFolder;
class SfPermissionSet extends SfEntity {
}
exports.SfPermissionSet = SfPermissionSet;
class SfPermission extends SfEntity {
}
exports.SfPermission = SfPermission;
class SfFieldPermission extends SfPermission {
    constructor() {
        super(...arguments);
        this.permissionType = 'Field';
    }
}
exports.SfFieldPermission = SfFieldPermission;
class SfObjectPermission extends SfPermission {
    constructor() {
        super(...arguments);
        this.permissionType = 'Object';
    }
}
exports.SfObjectPermission = SfObjectPermission;
class SfCodeCoverage {
    constructor() {
        this.codeCoverage = [];
    }
    calculateCodeCoverage() {
        this.totalCoveredLines = 0;
        this.totalUncoveredLines = 0;
        this.codeCoveragePercent = 0;
        let totalLines = 0;
        for (const item of this.codeCoverage ?? []) {
            if (item.coveredLines && item.uncoveredLines) {
                if (item.coveredLines) {
                    this.totalCoveredLines += item.coveredLines.length;
                }
                if (item.uncoveredLines) {
                    this.totalUncoveredLines += item.uncoveredLines.length;
                }
                totalLines += item.coveredLines.length + item.uncoveredLines.length;
            }
        }
        if (totalLines > 0) {
            this.codeCoveragePercent = (this.totalCoveredLines / totalLines) * 100;
        }
    }
}
exports.SfCodeCoverage = SfCodeCoverage;
class SfCodeCoverageItem extends SfEntity {
    constructor() {
        super();
        this.coveredLines = [];
        this.uncoveredLines = [];
    }
    getCodeCoveragePercent() {
        const totalLines = this.coveredLines.length + this.uncoveredLines.length;
        return totalLines === 0 ? 0 : (this.coveredLines.length / totalLines) * 100;
    }
}
exports.SfCodeCoverageItem = SfCodeCoverageItem;
class SfValidationRule extends SfEntity {
}
exports.SfValidationRule = SfValidationRule;
class SfQuery {
    // Query Custom Application info - they are called TabSet in SOQL
    static async getCustomApplications(org) {
        if (!org) {
            return null;
        }
        const query = "SELECT Id, ApplicationId, Label FROM AppMenuItem WHERE Type='TabSet'";
        const records = await SfQuery.queryOrg(org, query);
        const customApplications = [];
        for (const record of records) {
            const customApplication = new SfEntity();
            customApplication.id = record.Id;
            customApplication.name = record.Label;
            customApplications.push(customApplication);
        }
        return customApplications;
    }
    // Get current SetupEntityAccess types i.e. ApexClass, ApexPage,TabeSet, etc...
    // https://developer.salesforce.com/docs/atlas.en-us.226.0.object_reference.meta/object_reference/sforce_api_objects_setupentityaccess.htm
    //
    static async getSetupEntityTypes(org) {
        if (!org) {
            return null;
        }
        const query = 'SELECT SetupEntityType FROM SetupEntityAccess GROUP BY SetupEntityType';
        const records = await SfQuery.queryOrg(org, query);
        const setupEntityTypes = [];
        for (const record of records) {
            setupEntityTypes.push(record.SetupEntityType);
        }
        return setupEntityTypes;
    }
    // Get the SfFolder structure. SFDX only return parent folder information in the metadata. Need to build grandparent
    // structure for Reports, Dashboards, etc...
    static async getFolders(org) {
        if (!org) {
            return null;
        }
        const query = 'SELECT Id,ParentId,Name,DeveloperName,Type FROM Folder ORDER BY ParentId';
        const records = await SfQuery.queryOrg(org, query);
        const folders = [];
        for (const record of records) {
            const folder = new SfFolder();
            folder.id = record.Id;
            folder.name = record.Name;
            folder.type = record.Type;
            folder.parentId = record.ParentId;
            folder.developerName = record.DeveloperName;
            folders.push(folder);
        }
        return folders;
    }
    // Pulls SfPermissionSet for Profile & PermissionsSet info
    static async getPermissions(org) {
        if (!org) {
            return null;
        }
        const query = 'SELECT Id,Name,Profile.Name,IsOwnedByProfile FROM PermissionSet ORDER BY Profile.Name, Name';
        const records = await SfQuery.queryOrg(org, query);
        const profileMap = new Map();
        for (const record of records) {
            const profile = new SfPermissionSet();
            profile.id = record.Id;
            profile.name = record.Name;
            profile.profileName = record.Profile?.Name;
            profile.isOwnedByProfile = record.IsOwnedByProfile;
            profileMap.set(profile.id, profile);
        }
        return profileMap;
    }
    // Gets the SfObjectPermission Permissions for the specified object type
    static async getObjectPermissions(org, customObjectTypeName) {
        if (!org || !customObjectTypeName) {
            return null;
        }
        const query = `SELECT Id,ParentId,PermissionsCreate,PermissionsDelete,PermissionsEdit,PermissionsModifyAllRecords,PermissionsRead,PermissionsViewAllRecords,SObjectType FROM ObjectPermissions WHERE SObjectType='${customObjectTypeName}' ORDER BY SObjectType`;
        const records = await SfQuery.queryOrg(org, query);
        const objPerms = new Array();
        for (const record of records) {
            const perm = new SfObjectPermission();
            perm.id = record.Id;
            perm.name = record.SobjectType;
            perm.parentId = record.ParentId;
            perm.permissionsCreate = record.PermissionsCreate;
            perm.permissionsDelete = record.PermissionsDelete;
            perm.permissionsModifyAllRecords = record.PermissionsModifyAllRecords;
            perm.permissionsViewAllRecords = record.PermissionsViewAllRecords;
            perm.permissionsEdit = record.PermissionsEdit;
            perm.permissionsRead = record.PermissionsRead;
            objPerms.push(perm);
        }
        return objPerms;
    }
    // Get the SfFieldPermission permissions for the specific object type
    static async getFieldPermissions(org, customObjectTypeName) {
        if (!org || !customObjectTypeName) {
            return null;
        }
        const query = `SELECT Id,ParentId,PermissionsEdit,PermissionsRead,Field FROM FieldPermissions WHERE SobjectType = '${customObjectTypeName}' ORDER BY Field`;
        const records = await SfQuery.queryOrg(org, query);
        const objPerms = new Array();
        for (const record of records) {
            const perm = new SfFieldPermission();
            perm.id = record.Id;
            perm.name = record.Field;
            perm.parentId = record.ParentId;
            perm.permissionsEdit = record.PermissionsEdit;
            perm.permissionsRead = record.PermissionsRead;
            objPerms.push(perm);
        }
        return objPerms;
    }
    // Gets the SfSetupEntityAccess information for the specified SetupEntityTypes
    static async getSetupEntityAccessForTypes(org, setupEntityTypeNames) {
        if (!org || !setupEntityTypeNames || setupEntityTypeNames.length === 0) {
            return null;
        }
        const entityTypes = setupEntityTypeNames ? setupEntityTypeNames.join("','") : '';
        const query = `SELECT SetupEntityId,SetupEntityType FROM SetupEntityAccess WHERE SetupEntityType IN ('${entityTypes}') GROUP BY SetupEntityId,SetupEntityType ORDER BY SetupEntityType`;
        const records = await SfQuery.queryOrg(org, query);
        const setupEntityAccesses = [];
        for (const record of records) {
            const setupEntityAccess = new SfSetupEntityAccess();
            setupEntityAccess.setupEntityType = record.SetupEntityType;
            setupEntityAccess.setupEntityId = record.SetupEntityId;
            setupEntityAccesses.push(setupEntityAccess);
        }
        return setupEntityAccesses;
    }
    static async queryOrg(org, query, isToolingAPIQuery = false, allRows = false) {
        const records = [];
        const connection = isToolingAPIQuery ? org.getConnection().tooling : org.getConnection();
        const results = await connection.query(query, {
            autoFetch: true,
            maxFetch: 50000,
            scanAll: allRows,
        });
        if (results?.done) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            records.push(...results.records);
        }
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-return */
        return records;
    }
    // Gets the SfSetupEntityAccess information for the specified SetupEntityTypes
    static async getApexTestClasses(org, namespacePrefixes = ['']) {
        if (!org) {
            return null;
        }
        let query = 'SELECT Id, Name, SymbolTable FROM ApexClass WHERE NamespacePrefix';
        let namespaces = '';
        for (const ns of namespacePrefixes) {
            if (namespaces.length > 0) {
                namespaces += ',';
            }
            namespaces += `'${ns}'`;
        }
        if (namespaces.length > 0) {
            query += ` IN (${namespaces})`;
        }
        query += ' ORDER BY Name ASC';
        const records = await SfQuery.queryOrg(org, query, true);
        const apexClasses = [];
        for (const record of records) {
            let isTest = false;
            if (!record.SymbolTable?.methods) {
                continue;
            }
            for (const method of record.SymbolTable.methods) {
                for (const annotation of method.annotations) {
                    if (annotation.name === 'IsTest') {
                        isTest = true;
                        break;
                    }
                }
                if (isTest) {
                    const entity = new SfEntity();
                    entity.id = record.Id;
                    entity.name = record.Name;
                    apexClasses.push(entity);
                    break;
                }
            }
        }
        return apexClasses;
    }
    static async getCodeCoverage(org) {
        if (!org) {
            return null;
        }
        const codeCoverage = new SfCodeCoverage();
        codeCoverage.codeCoverage = [];
        const query = 'SELECT ApexClassOrTrigger.Name,ApexClassOrTriggerId,NumLinesCovered,NumLinesUncovered,Coverage FROM ApexCodeCoverageAggregate ORDER BY ApexClassOrTrigger.Name ASC';
        const records = await SfQuery.queryOrg(org, query, true);
        for (const record of records) {
            const coverageItem = new SfCodeCoverageItem();
            coverageItem.id = record.ApexClassOrTriggerId;
            coverageItem.name = record.ApexClassOrTrigger?.Name;
            coverageItem.uncoveredLines = record.Coverage.uncoveredLines || [];
            coverageItem.coveredLines = record.Coverage.coveredLines || [];
            codeCoverage.codeCoverage.push(coverageItem);
        }
        return codeCoverage;
    }
    // Get all the Validation Rules from the specified Org
    static async getValidationRules(org, includeLogic = false) {
        if (!org) {
            return null;
        }
        let query = 'SELECT Id,Active,Description,EntityDefinition.DeveloperName,ErrorDisplayField,ErrorMessage FROM ValidationRule';
        let records = await SfQuery.queryOrg(org, query, true);
        const vrs = [];
        for (const record of records) {
            const vr = new SfValidationRule();
            vr.id = record.Id;
            vr.name = record.EntityDefinition.DeveloperName;
            vr.active = record.Active;
            vr.errorMessage = record.ErrorMessage;
            vr.description = record.Description;
            vr.errorDisplayField = record.ErrorDisplayField;
            vrs.push(vr);
        }
        if (includeLogic) {
            for (const vr of vrs) {
                query = `SELECT Id, Metadata FROM ValidationRule WHERE Id='${vr.id}'`;
                records = await SfQuery.queryOrg(org, query, true);
                vr.errorConditionFormula = records[0].Metadata.errorConditionFormula;
            }
        }
        return vrs;
    }
    static async *waitForRecordCount(org, query, recordCount = 0, maxWaitSeconds = 60, sleepMilliseconds = 5000) {
        const maxCounter = (maxWaitSeconds * 1000) / sleepMilliseconds;
        let counter = 0;
        let records = null;
        while (maxCounter <= 0 || counter <= maxCounter) {
            if (records?.length === recordCount) {
                break;
            }
            await utils_1.default.sleep(sleepMilliseconds);
            records = await SfQuery.queryOrg(org, query);
            counter++;
            yield records.length;
        }
    }
    static async *waitForApexTests(org, parentJobId, waitCountMaxSeconds = 0) {
        if (!org) {
            return null;
        }
        // Check every 30 seconds or waitCountMaxSeconds so we don't waste a bunch of queries
        const interval = waitCountMaxSeconds >= 30 ? 30000 : waitCountMaxSeconds;
        // we want zero records
        const targetCount = 0;
        let query = `SELECT ApexClassId FROM ApexTestQueueItem WHERE Status NOT IN ('Completed', 'Failed', 'Aborted')`;
        // If we have a ApexJob Id - lets make sure its started
        let recordCount = 0;
        if (parentJobId) {
            const jobQuery = `SELECT Id FROM AsyncApexJob WHERE Id = '${parentJobId}' AND Status IN ('Queued')`;
            // Just wait for batch to start
            for await (recordCount of SfQuery.waitForRecordCount(org, jobQuery, targetCount, waitCountMaxSeconds, interval)) {
                if (recordCount === targetCount) {
                    break;
                }
            }
            query += ` AND ParentJobId = '${parentJobId}'`;
        }
        for await (recordCount of SfQuery.waitForRecordCount(org, query, targetCount, waitCountMaxSeconds, interval)) {
            yield recordCount;
            if (recordCount === targetCount) {
                break;
            }
        }
        return recordCount;
    }
    // Gets the SfSetupEntityAccess information for the specified SetupEntityTypes
    static getInClause(values = [''], isValueNumeric = false) {
        if (!values) {
            return null;
        }
        let inClause = '';
        if (isValueNumeric) {
            inClause = values.join(',');
        }
        else {
            for (const value of values) {
                if (inClause.length > 0) {
                    inClause += ',';
                }
                inClause += `'${value}'`;
            }
        }
        return `IN (${inClause})`;
    }
}
exports.SfQuery = SfQuery;
//# sourceMappingURL=sf-query.js.map