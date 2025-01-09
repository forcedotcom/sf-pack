import { Org } from '@salesforce/core';
export declare class ObjPermissionStructure {
    SObjectType: string;
    PermissionsRead: boolean;
    PermissionsCreate: boolean;
    PermissionsEdit: boolean;
    PermissionsDelete: boolean;
    PermissionsViewAllRecords: boolean;
    PermissionsModifyAllRecords: boolean;
    constructor(init?: Partial<ObjPermissionStructure>);
}
export declare class FieldPermissionStructure {
    Field: string;
    PermissionsRead: boolean;
    PermissionsEdit: boolean;
    constructor(init?: Partial<FieldPermissionStructure>);
}
export declare class Sobject {
    Name: string;
    Id: string;
}
export declare class ProfileDownload {
    org: Org;
    profileList: string[];
    profileIDMap: Map<string, string>;
    rootDir: string;
    private static org;
    profileFilePath: Map<string, string>;
    constructor(org: Org, profileList: string[], profileIDMap: Map<string, string>, rootDir: string);
    static processMissingObjectPermissions(objectData: ObjPermissionStructure[], includedObjects: string[]): Map<string, any>;
    static processMissingFieldPermissions(fielddata: FieldPermissionStructure[]): any[];
    static writeProfileToXML(profileMetadata: any, filePath: string): Promise<void>;
    static checkOrgProfiles(org: Org): Promise<Map<string, string>>;
    private static objPermissionStructure;
    private static fieldPermissionStructure;
    downloadPermissions(): Promise<Map<string, string>>;
    retrieveProfileMetaData(profileName: string): Promise<any>;
    getProfileMetaData(profileName: string): Promise<void>;
}
