import { Org } from '@salesforce/core';
import { QueryResult, Record } from '@jsforce/jsforce-node';
import Utils from './utils.js';

// SoqlQueryResult

export class SfEntity {
  public id: string;
  public parentId: string;
  public name: string;
}

export class SfSetupEntityAccess {
  public setupEntityId: string;
  public setupEntityType: string;
}

export class SfFolder extends SfEntity {
  public developerName: string;
  public type: string;
}

export class SfPermissionSet extends SfEntity {
  public isOwnedByProfile: boolean;
  public profileName: string;
}

export abstract class SfPermission extends SfEntity {
  public permissionsEdit: boolean;
  public permissionsRead: boolean;
  public abstract permissionType: string;
}

export class SfFieldPermission extends SfPermission {
  public permissionType = 'Field';
  public field: string;
}

export class SfObjectPermission extends SfPermission {
  public permissionType = 'Object';
  public permissionsCreate: boolean;
  public permissionsDelete: boolean;
  public permissionsModifyAllRecords: boolean;
  public permissionsViewAllRecords: boolean;
}

export class SfCodeCoverage {
  public codeCoverage: SfCodeCoverageItem[];
  public totalCoveredLines: number;
  public totalUncoveredLines: number;
  public codeCoveragePercent: number;

  public constructor() {
    this.codeCoverage = [];
  }

  public calculateCodeCoverage(): void {
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

export class SfCodeCoverageItem extends SfEntity {
  public coveredLines: number[];
  public uncoveredLines: number[];

  public constructor() {
    super();
    this.coveredLines = [];
    this.uncoveredLines = [];
  }

  public getCodeCoveragePercent(): number {
    const totalLines = this.coveredLines.length + this.uncoveredLines.length;
    return totalLines === 0 ? 0 : (this.coveredLines.length / totalLines) * 100;
  }
}

export class SfValidationRule extends SfEntity {
  public active: boolean;
  public errorMessage: string;
  public description: string;
  public errorConditionFormula: string;
  public errorDisplayField: string;
}

export class SfQuery {
  // Query Custom Application info - they are called TabSet in SOQL
  public static async getCustomApplications(org: Org): Promise<SfEntity[]> {
    if (!org) {
      return null;
    }
    const query = "SELECT Id, ApplicationId, Label FROM AppMenuItem WHERE Type='TabSet'";
    const records = await SfQuery.queryOrg(org, query);
    const customApplications: SfEntity[] = [];
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
  public static async getSetupEntityTypes(org: Org): Promise<string[]> {
    if (!org) {
      return null;
    }
    const query = 'SELECT SetupEntityType FROM SetupEntityAccess GROUP BY SetupEntityType';
    const records = await SfQuery.queryOrg(org, query);
    const setupEntityTypes: string[] = [];
    for (const record of records) {
      setupEntityTypes.push(record.SetupEntityType as string);
    }
    return setupEntityTypes;
  }

  // Get the SfFolder structure. SFDX only return parent folder information in the metadata. Need to build grandparent
  // structure for Reports, Dashboards, etc...
  public static async getFolders(org: Org): Promise<SfFolder[]> {
    if (!org) {
      return null;
    }
    const query = 'SELECT Id,ParentId,Name,DeveloperName,Type FROM Folder ORDER BY ParentId';
    const records = await SfQuery.queryOrg(org, query);
    const folders: SfFolder[] = [];
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
  public static async getPermissions(org: Org): Promise<Map<string, SfPermissionSet>> {
    if (!org) {
      return null;
    }
    const query = 'SELECT Id,Name,Profile.Name,IsOwnedByProfile FROM PermissionSet ORDER BY Profile.Name, Name';
    const records = await SfQuery.queryOrg(org, query);
    const profileMap = new Map<string, SfPermissionSet>();
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
  public static async getObjectPermissions(org: Org, customObjectTypeName: string): Promise<SfObjectPermission[]> {
    if (!org || !customObjectTypeName) {
      return null;
    }
    const query = `SELECT Id,ParentId,PermissionsCreate,PermissionsDelete,PermissionsEdit,PermissionsModifyAllRecords,PermissionsRead,PermissionsViewAllRecords,SObjectType FROM ObjectPermissions WHERE SObjectType='${customObjectTypeName}' ORDER BY SObjectType`;
    const records = await SfQuery.queryOrg(org, query);
    const objPerms = new Array<SfObjectPermission>();
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
  public static async getFieldPermissions(org: Org, customObjectTypeName: string): Promise<SfFieldPermission[]> {
    if (!org || !customObjectTypeName) {
      return null;
    }
    const query = `SELECT Id,ParentId,PermissionsEdit,PermissionsRead,Field FROM FieldPermissions WHERE SobjectType = '${customObjectTypeName}' ORDER BY Field`;
    const records = await SfQuery.queryOrg(org, query);
    const objPerms = new Array<SfFieldPermission>();
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
  public static async getSetupEntityAccessForTypes(
    org: Org,
    setupEntityTypeNames: string[]
  ): Promise<SfSetupEntityAccess[]> {
    if (!org || !setupEntityTypeNames || setupEntityTypeNames.length === 0) {
      return null;
    }
    const entityTypes = setupEntityTypeNames ? setupEntityTypeNames.join("','") : '';

    const query = `SELECT SetupEntityId,SetupEntityType FROM SetupEntityAccess WHERE SetupEntityType IN ('${entityTypes}') GROUP BY SetupEntityId,SetupEntityType ORDER BY SetupEntityType`;
    const records = await SfQuery.queryOrg(org, query);
    const setupEntityAccesses: SfSetupEntityAccess[] = [];
    for (const record of records) {
      const setupEntityAccess = new SfSetupEntityAccess();
      setupEntityAccess.setupEntityType = record.SetupEntityType;
      setupEntityAccess.setupEntityId = record.SetupEntityId;
      setupEntityAccesses.push(setupEntityAccess);
    }
    return setupEntityAccesses;
  }

  public static async queryOrg(
    org: Org,
    query: string,
    isToolingAPIQuery: boolean | undefined = false,
    allRows: boolean | undefined = false
  ): Promise<Record[]> {
    const records: any[] = [];
    const connection = isToolingAPIQuery ? org.getConnection().tooling : org.getConnection();

    const results: QueryResult<Record> = await connection.query(query, {
      autoFetch: true,
      maxFetch: 50_000,
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
  public static async getApexTestClasses(org: Org, namespacePrefixes: string[] = ['']): Promise<SfEntity[]> {
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
    const apexClasses: SfEntity[] = [];
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

  public static async getCodeCoverage(org: Org): Promise<SfCodeCoverage> {
    if (!org) {
      return null;
    }
    const codeCoverage = new SfCodeCoverage();
    codeCoverage.codeCoverage = [];
    const query =
      'SELECT ApexClassOrTrigger.Name,ApexClassOrTriggerId,NumLinesCovered,NumLinesUncovered,Coverage FROM ApexCodeCoverageAggregate ORDER BY ApexClassOrTrigger.Name ASC';
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
  public static async getValidationRules(org: Org, includeLogic = false): Promise<SfValidationRule[]> {
    if (!org) {
      return null;
    }
    let query =
      'SELECT Id,Active,Description,EntityDefinition.DeveloperName,ErrorDisplayField,ErrorMessage FROM ValidationRule';
    let records = await SfQuery.queryOrg(org, query, true);
    const vrs: SfValidationRule[] = [];
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

  public static async *waitForRecordCount(
    org: Org,
    query: string,
    recordCount = 0,
    maxWaitSeconds = 60,
    sleepMilliseconds = 5000
  ): AsyncGenerator<number, void, void> {
    const maxCounter = (maxWaitSeconds * 1000) / sleepMilliseconds;
    let counter = 0;
    let records = null;
    while (maxCounter <= 0 || counter <= maxCounter) {
      if (records?.length === recordCount) {
        break;
      }

      await Utils.sleep(sleepMilliseconds);

      records = await SfQuery.queryOrg(org, query);
      counter++;
      yield records.length;
    }
  }

  public static async *waitForApexTests(
    org: Org,
    parentJobId: string,
    waitCountMaxSeconds = 0
  ): AsyncGenerator<number, number, void> {
    if (!org) {
      return null;
    }

    // Check every 30 seconds or waitCountMaxSeconds so we don't waste a bunch of queries
    const interval = waitCountMaxSeconds >= 30 ? 30_000 : waitCountMaxSeconds;

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
  public static getInClause(values: string[] = [''], isValueNumeric = false): string {
    if (!values) {
      return null;
    }
    let inClause = '';
    if (isValueNumeric) {
      inClause = values.join(',');
    } else {
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
