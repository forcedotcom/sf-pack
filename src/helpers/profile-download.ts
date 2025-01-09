import path = require('path');
import { Org } from '@salesforce/core';
import Utils from './utils';
import { SfQuery } from './sf-query';
import Constants from './constants';

export class ObjPermissionStructure {
  public SObjectType: string;
  public PermissionsRead: boolean;
  public PermissionsCreate: boolean;
  public PermissionsEdit: boolean;
  public PermissionsDelete: boolean;
  public PermissionsViewAllRecords: boolean;
  public PermissionsModifyAllRecords: boolean;

  public constructor(init?: Partial<ObjPermissionStructure>) {
    Object.assign(this, init);
  }
}

export class FieldPermissionStructure {
  public Field: string;
  public PermissionsRead: boolean;
  public PermissionsEdit: boolean;

  public constructor(init?: Partial<FieldPermissionStructure>) {
    Object.assign(this, init);
  }
}

export class Sobject {
  public Name: string;
  public Id: string;
}

export class ProfileDownload {
  private static org: Org;

  public profileFilePath: Map<string, string> = new Map<string, string>();

  public constructor(
    public org: Org,
    public profileList: string[],
    public profileIDMap: Map<string, string>,
    public rootDir: string
  ) {
    ProfileDownload.org = org;
  }

  public static processMissingObjectPermissions(
    objectData: ObjPermissionStructure[],
    includedObjects: string[]
  ): Map<string, any> {
    const profileObjectPermissions: Map<string, any> = new Map<string, any>();
    const uniqueObjectNames = new Set<string>();
    for (const obj of objectData) {
      if (uniqueObjectNames.add(obj.SObjectType) && !includedObjects.includes(obj.SObjectType)) {
        const objPemission = ProfileDownload.objPermissionStructure(
          obj.SObjectType,
          obj.PermissionsRead,
          obj.PermissionsCreate,
          obj.PermissionsEdit,
          obj.PermissionsDelete,
          obj.PermissionsViewAllRecords,
          obj.PermissionsModifyAllRecords
        );

        profileObjectPermissions.set(obj.SObjectType, objPemission);
      }
    }

    return profileObjectPermissions;
  }

  public static processMissingFieldPermissions(fielddata: FieldPermissionStructure[]): any[] {
    const profileFieldPermissions: any[] = [];

    const uniqueFieldNames = new Set<string>();
    for (const field of fielddata) {
      if (uniqueFieldNames.add(field.Field)) {
        const fieldPemission = ProfileDownload.fieldPermissionStructure(
          field.Field,
          field.PermissionsEdit,
          field.PermissionsRead
        );
        profileFieldPermissions.push(fieldPemission);
      }
    }
    return profileFieldPermissions;
  }

  public static async writeProfileToXML(profileMetadata: any, filePath: string): Promise<void> {
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
  public static async checkOrgProfiles(org: Org): Promise<Map<string, string>> {
    const profileMap: Map<string, string> = new Map<string, string>();
    const profileAPINameMatch: Map<string, string> = new Map<string, string>([
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
        const sObj = profile as Sobject;
        const profileName = profileAPINameMatch.get(sObj.Name) || sObj.Name;
        profileMap.set(profileName, sObj.Id);
      }
    }
    return profileMap;
  }

  private static objPermissionStructure(
    objName: string,
    allowRead: boolean,
    allowCreate: boolean,
    allowEdit: boolean,
    allowDelete: boolean,
    viewAllRecords: boolean,
    modifyAllRecords: boolean
  ): any {
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

  private static fieldPermissionStructure(field: string, editable: boolean, readable: boolean): any {
    const fieldStructure = {
      field,
      editable,
      readable,
    };
    return fieldStructure;
  }

  public async downloadPermissions(): Promise<Map<string, string>> {
    if (!(await Utils.pathExists(path.join(this.rootDir, Utils.tempFilesPath)))) {
      await Utils.mkDirPath(path.join(this.rootDir, Utils.tempFilesPath));
    }

    const resultsArray: Array<Promise<any>> = [];

    for (const profileName of this.profileList) {
      resultsArray.push(this.getProfileMetaData(profileName));
    }

    await Promise.all(resultsArray);

    return this.profileFilePath;
  }

  public async retrieveProfileMetaData(profileName: string): Promise<any> {
    if (!profileName) {
      return null;
    }
    const data = await ProfileDownload.org.getConnection().metadata.read('Profile', profileName);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return Array.isArray(data) ? data[0] : data;
  }

  public async getProfileMetaData(profileName: string): Promise<void> {
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

    const retrievedObjects: string[] = [];
    if (profileJson['objectPermissions'] && Array.isArray(profileJson.objectPermissions)) {
      for (const obj of profileJson.objectPermissions as []) {
        retrievedObjects.push(obj['object']);
      }

      const objectPermQuery: string =
        'SELECT Parent.ProfileId,' +
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

      const processObjData = ProfileDownload.processMissingObjectPermissions(
        objData as ObjPermissionStructure[],
        retrievedObjects
      );
      if (processObjData.size !== 0) {
        const sobjects = [];
        for (const obj of processObjData.keys()) {
          sobjects.push(`'${obj}'`);
        }

        const fieldPermQuery =
          'SELECT Field,' +
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

        const processFieldData = ProfileDownload.processMissingFieldPermissions(
          fieldMissingData as FieldPermissionStructure[]
        );

        profileJson.objectPermissions.push(...processObjData.values());
        if (profileJson.fieldLevelSecurities && profileJson.fieldLevelSecurities.length > 0) {
          profileJson.fieldLevelSecurities.push(...processFieldData);
        } else {
          profileJson.fieldPermissions.push(...processFieldData);
        }
      }
    }
    await Utils.writeFile(filePath, JSON.stringify(profileJson));
  }
}
