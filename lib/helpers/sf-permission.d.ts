export declare abstract class XmlPermission {
    protected static getValue(json: any): any;
    abstract toObj(): any;
}
export declare abstract class Named extends XmlPermission {
    name: string;
}
export declare abstract class MetadataDetail extends Named {
    label: string;
}
export declare class ObjectDetail extends MetadataDetail {
    visibility: string;
    intSharingModel: string;
    extSharingModel: string;
    static fromJson(filePath: string, json: any): ObjectDetail;
    toObj(): any;
}
export declare class FieldDetail extends MetadataDetail {
    type: string;
    description: string;
    encryptionScheme: string;
    static fromJson(filePath: string, json: any): FieldDetail;
    toObj(): any;
}
export declare abstract class MetaDataPermission extends Named {
    r: boolean;
    toString(): string;
    abstract toObj(): any;
}
export declare class FieldPermission extends MetaDataPermission {
    u: boolean;
    static fromJson(json: any): FieldPermission;
    toObj(): any;
    toString(): string;
}
export declare class ClassPermission extends MetaDataPermission {
    static fromJson(json: any): ClassPermission;
    toObj(): any;
}
export declare class UserPermission extends MetaDataPermission {
    static fromJson(json: any): UserPermission;
    toObj(): any;
}
export declare class PagePermission extends MetaDataPermission {
    static fromJson(json: any): PagePermission;
    toObj(): any;
}
export declare class LayoutAssignment extends MetaDataPermission {
    recordType: string;
    static fromJson(json: any): LayoutAssignment;
    toObj(): any;
}
export declare abstract class DefaultablePermission extends MetaDataPermission {
    default: boolean;
    toString(): string;
}
export declare class RecordTypePermission extends DefaultablePermission {
    static fromJson(json: any): RecordTypePermission;
    toObj(): any;
}
export declare class ApplicationPermission extends DefaultablePermission {
    static fromJson(json: any): ApplicationPermission;
    toObj(): any;
}
export declare class TabPermission extends MetaDataPermission {
    private static standardPrefix;
    visibility: string;
    isStandard: boolean;
    private tabVisibilityKind;
    static fromJson(json: any): TabPermission;
    setName(name: string): void;
    toString(): string;
    toObj(): any;
}
export declare class ObjectPermission extends FieldPermission {
    c: boolean;
    d: boolean;
    viewAll: boolean;
    modAll: boolean;
    static fromJson(json: any): ObjectPermission;
    toObj(): any;
    toString(): string;
}
export declare class PermissionSet extends Named {
    isProfile: boolean;
    fieldPermissions: Map<string, FieldPermission>;
    userPermissions: Map<string, UserPermission>;
    classAccesses: Map<string, ClassPermission>;
    pageAccesses: Map<string, PagePermission>;
    recordTypeVisibilities: Map<string, RecordTypePermission>;
    tabVisibilities: Map<string, TabPermission>;
    applicationVisibilities: Map<string, ApplicationPermission>;
    objectPermissions: Map<string, ObjectPermission>;
    layoutAssignments: Map<string, LayoutAssignment>;
    constructor();
    static fromJson(filePath: string, json: any): PermissionSet;
    toObj(): any;
    getPermissionCollection(metadataName: string): Map<string, MetaDataPermission>;
}
export declare class SfPermission {
    static readonly apexClass = "ApexClass";
    static readonly apexPage = "PageAccesses";
    static readonly customApplication = "CustomApplication";
    static readonly customObject = "CustomObject";
    static readonly customField = "CustomField";
    static readonly customTab = "CustomTab";
    static readonly permissionSet = "PermissionSet";
    static readonly profile = "Profile";
    static readonly recordType = "RecordType";
    static readonly layout = "Layout";
    static permissionSetMetaTypes: string[];
    static defaultPermissionMetaTypes: string[];
    static getPermissionString(permissionSet: Named): string;
}
