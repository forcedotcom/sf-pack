import path from 'node:path';
import Constants from './constants.js';
export class XmlPermission {
    static getValue(json) {
        const value = json && json instanceof Array ? json[0] : json;
        return value === 'true' || value === 'false' ? value === 'true' : value;
    }
}
export class Named extends XmlPermission {
    name;
}
export class MetadataDetail extends Named {
    label;
}
export class ObjectDetail extends MetadataDetail {
    visibility;
    intSharingModel;
    extSharingModel;
    static fromJson(filePath, json) {
        if (!filePath || !json) {
            return null;
        }
        const detail = new ObjectDetail();
        detail.name = path.basename(filePath.split('.')[0]);
        detail.label = this.getValue(json.CustomObject.label);
        detail.intSharingModel = this.getValue(json.CustomObject.sharingModel);
        detail.extSharingModel = this.getValue(json.CustomObject.externalSharingModel);
        detail.visibility = this.getValue(json.CustomObject.visibility);
        return detail;
    }
    toObj() {
        return {
            CustomObject: {
                label: this.label,
                sharingModel: this.intSharingModel,
                externalSharingModel: this.extSharingModel,
                visibility: this.visibility,
            },
        };
    }
}
export class FieldDetail extends MetadataDetail {
    type;
    description;
    encryptionScheme;
    static fromJson(filePath, json) {
        if (!filePath || !json) {
            return null;
        }
        const objectName = path.parse(path.dirname(path.dirname(filePath))).name;
        const detail = new FieldDetail();
        detail.name = `${objectName}.${this.getValue(json.CustomField.fullName)}`;
        detail.label = this.getValue(json.CustomField.label);
        detail.description = this.getValue(json.CustomField.description);
        detail.type = this.getValue(json.CustomField.type);
        detail.encryptionScheme = this.getValue(json.CustomField.encryptionScheme);
        return detail;
    }
    toObj() {
        return {
            CustomField: {
                label: this.label,
                description: this.description,
                type: this.type,
                encryptionScheme: this.encryptionScheme,
            },
        };
    }
}
export class MetaDataPermission extends Named {
    r;
    toString() {
        let result = '';
        if (this.r) {
            result += 'R ';
        }
        return result;
    }
}
export class FieldPermission extends MetaDataPermission {
    u;
    static fromJson(json) {
        if (!json) {
            return null;
        }
        const permission = new FieldPermission();
        permission.u = this.getValue(json.editable) || false;
        permission.name = this.getValue(json.field);
        permission.r = this.getValue(json.readable) || false;
        return permission;
    }
    toObj() {
        return {
            editable: this.u,
            field: this.name,
            readable: this.r,
        };
    }
    toString() {
        let result = super.toString();
        if (this.u) {
            result += 'U ';
        }
        return result;
    }
}
export class ClassPermission extends MetaDataPermission {
    static fromJson(json) {
        if (!json) {
            return null;
        }
        const permission = new ClassPermission();
        permission.name = this.getValue(json.apexClass);
        permission.r = this.getValue(json.enabled) || false;
        return permission;
    }
    toObj() {
        return {
            apexClass: this.name,
            enabled: this.r,
        };
    }
}
export class UserPermission extends MetaDataPermission {
    static fromJson(json) {
        if (!json) {
            return null;
        }
        const permission = new UserPermission();
        permission.r = this.getValue(json.enabled) || false;
        permission.name = this.getValue(json.name);
        return permission;
    }
    toObj() {
        return {
            enabled: this.r,
            name: this.name,
        };
    }
}
export class PagePermission extends MetaDataPermission {
    static fromJson(json) {
        if (!json) {
            return null;
        }
        const permission = new PagePermission();
        permission.name = this.getValue(json.apexPage);
        permission.r = this.getValue(json.enabled) || false;
        return permission;
    }
    toObj() {
        return {
            apexPage: this.name,
            enabled: this.r,
        };
    }
}
export class LayoutAssignment extends MetaDataPermission {
    recordType;
    static fromJson(json) {
        if (!json) {
            return null;
        }
        const permission = new LayoutAssignment();
        permission.name = this.getValue(json.layout);
        permission.recordType = this.getValue(json.recordType);
        return permission;
    }
    toObj() {
        return {
            layout: this.name,
            recordType: this.recordType,
        };
    }
}
export class DefaultablePermission extends MetaDataPermission {
    default;
    toString() {
        let result = super.toString();
        if (this.default) {
            result += '* ';
        }
        return result;
    }
}
export class RecordTypePermission extends DefaultablePermission {
    static fromJson(json) {
        if (!json) {
            return null;
        }
        const permission = new RecordTypePermission();
        permission.default = this.getValue(json.default);
        permission.name = this.getValue(json.recordType);
        permission.r = this.getValue(json.visible) || false;
        return permission;
    }
    toObj() {
        return {
            default: this.default,
            recordType: this.name,
            visible: this.r,
        };
    }
}
export class ApplicationPermission extends DefaultablePermission {
    static fromJson(json) {
        if (!json) {
            return null;
        }
        const permission = new ApplicationPermission();
        permission.name = this.getValue(json.application);
        permission.default = this.getValue(json.default);
        permission.r = this.getValue(json.visible);
        return permission;
    }
    toObj() {
        return {
            application: this.name,
            default: this.default,
            visible: this.r,
        };
    }
}
export class TabPermission extends MetaDataPermission {
    static standardPrefix = 'standard-';
    visibility;
    isStandard;
    tabVisibilityKind = {
        OFF: 'DefaultOff',
        ON: 'DefaultOn',
        HIDDEN: 'Hidden',
    };
    static fromJson(json) {
        if (!json) {
            return null;
        }
        const tabPermission = new TabPermission();
        tabPermission.setName(this.getValue(json.tab));
        tabPermission.visibility = this.getValue(json.visibility);
        return tabPermission;
    }
    setName(name) {
        if (!name) {
            return;
        }
        this.isStandard = name.startsWith(TabPermission.standardPrefix);
        this.name = this.isStandard ? name.split(TabPermission.standardPrefix)[1] : name;
    }
    toString() {
        let result = super.toString();
        if (this.visibility) {
            switch (this.visibility) {
                case this.tabVisibilityKind.ON:
                    result += 'ON ';
                    break;
                case this.tabVisibilityKind.OFF:
                    result += 'OFF ';
                    break;
                case this.tabVisibilityKind.HIDDEN:
                    result += 'HIDE ';
                    break;
            }
        }
        return result;
    }
    toObj() {
        return {
            tab: this.name,
            visibility: this.visibility,
        };
    }
}
export class ObjectPermission extends FieldPermission {
    c;
    d;
    viewAll;
    modAll;
    static fromJson(json) {
        if (!json) {
            return null;
        }
        const permission = new ObjectPermission();
        permission.c = this.getValue(json.allowCreate);
        permission.d = this.getValue(json.allowDelete);
        permission.u = this.getValue(json.allowEdit);
        permission.r = this.getValue(json.allowRead);
        permission.modAll = this.getValue(json.modifyAllRecords);
        permission.name = this.getValue(json.object);
        permission.viewAll = this.getValue(json.viewAllRecords);
        return permission;
    }
    toObj() {
        return {
            allowCreate: this.c,
            allowDelete: this.d,
            allowEdit: this.u,
            allowRead: this.r,
            modifyAllRecords: this.modAll,
            object: this.name,
            viewAllRecords: this.viewAll,
        };
    }
    toString() {
        if (this.modAll) {
            return 'All';
        }
        let result = '';
        if (this.c) {
            result += 'C ';
        }
        // put this call here to maintain CRUD letter order
        result += super.toString();
        if (this.d) {
            result += 'D ';
        }
        if (this.viewAll) {
            result += 'V ';
        }
        return result;
    }
}
export class PermissionSet extends Named {
    isProfile;
    fieldPermissions;
    userPermissions;
    classAccesses;
    pageAccesses;
    recordTypeVisibilities;
    tabVisibilities;
    applicationVisibilities;
    objectPermissions;
    layoutAssignments;
    constructor() {
        super();
        this.fieldPermissions = new Map();
        this.userPermissions = new Map();
        this.classAccesses = new Map();
        this.pageAccesses = new Map();
        this.recordTypeVisibilities = new Map();
        this.tabVisibilities = new Map();
        this.applicationVisibilities = new Map();
        this.objectPermissions = new Map();
        this.layoutAssignments = new Map();
    }
    static fromJson(filePath, json) {
        if (!filePath || !json) {
            return null;
        }
        const permSet = new PermissionSet();
        permSet.name = path.basename(filePath.split('.')[0]);
        permSet.isProfile = json.Profile ? true : false;
        const root = json.PermissionSet || json.Profile;
        for (const appPerm of root.applicationVisibilities || []) {
            const appPermission = ApplicationPermission.fromJson(appPerm);
            permSet.applicationVisibilities.set(appPermission.name, appPermission);
        }
        for (const classPerm of root.classAccesses || []) {
            const classPermission = ClassPermission.fromJson(classPerm);
            permSet.classAccesses.set(classPermission.name, classPermission);
        }
        for (const fldPerm of root.fieldPermissions || []) {
            const fieldPermission = FieldPermission.fromJson(fldPerm);
            permSet.fieldPermissions.set(fieldPermission.name, fieldPermission);
        }
        for (const objPerm of root.objectPermissions || []) {
            const objPermission = ObjectPermission.fromJson(objPerm);
            permSet.objectPermissions.set(objPermission.name, objPermission);
        }
        for (const pagePerm of root.pageAccesses || []) {
            const pagePermission = PagePermission.fromJson(pagePerm);
            permSet.pageAccesses.set(pagePermission.name, pagePermission);
        }
        for (const recPerm of root.recordTypeVisibilities || []) {
            const recPermission = RecordTypePermission.fromJson(recPerm);
            permSet.recordTypeVisibilities.set(recPermission.name, recPermission);
        }
        for (const tabPerm of root.tabVisibilities || []) {
            const tabPermission = TabPermission.fromJson(tabPerm);
            permSet.tabVisibilities.set(tabPermission.name, tabPermission);
        }
        for (const usrPerm of root.userPermissions || []) {
            const userPermission = UserPermission.fromJson(usrPerm);
            permSet.userPermissions.set(userPermission.name, userPermission);
        }
        for (const layoutAss of root.layoutAssignments || []) {
            const layoutAssignment = LayoutAssignment.fromJson(layoutAss);
            permSet.layoutAssignments.set(layoutAssignment.name, layoutAssignment);
        }
        return permSet;
    }
    toObj() {
        const xmlObj = {
            Profile: {
                $: {
                    xmlns: Constants.DEFAULT_XML_NAMESPACE,
                },
                applicationVisibilities: [],
                classAccesses: [],
                fieldPermissions: [],
                objectPermissions: [],
                pageAccesses: [],
                recordTypeVisibilities: [],
                tabVisibilities: [],
                userPermissions: [],
                layoutAssignments: [],
            },
        };
        for (const propertyName of Object.keys(xmlObj.Profile)) {
            if (!this[propertyName]) {
                continue;
            }
            for (const perm of this[propertyName].values()) {
                xmlObj.Profile[propertyName].push(perm.toObj());
            }
        }
        return xmlObj;
    }
    getPermissionCollection(metadataName) {
        // const enumValue = metadataName as SfPermission;
        switch (metadataName) {
            case SfPermission.apexPage:
                return this.pageAccesses;
            case SfPermission.apexClass:
                return this.classAccesses;
            case SfPermission.customApplication:
                return this.applicationVisibilities;
            case SfPermission.customField:
                return this.fieldPermissions;
            case SfPermission.customObject:
                return this.objectPermissions;
            case SfPermission.recordType:
                return this.recordTypeVisibilities;
            case SfPermission.customTab:
                return this.tabVisibilities;
            case SfPermission.layout:
                return this.layoutAssignments;
            default:
                return null;
        }
    }
}
export class SfPermission {
    static apexClass = Constants.SF_PERMISSION_APEX_CLASS;
    static apexPage = Constants.SF_PERMISSION_APEX_PAGE;
    static customApplication = Constants.SF_PERMISSION_CUSTOM_APP;
    static customObject = Constants.SF_PERMISSION_CUSTOM_OBJ;
    static customField = Constants.SF_PERMISSION_CUSTOM_FIELD;
    static customTab = Constants.SF_PERMISSION_CUSTOM_TAB;
    static permissionSet = Constants.SF_PERMISSION_SET;
    static profile = Constants.SF_PERMISSION_PROFILE;
    static recordType = Constants.SF_PERMISSION_RECORD_TYPE;
    static layout = Constants.SF_PERMISSION_LAYOUT;
    static permissionSetMetaTypes = [
        SfPermission.apexClass,
        SfPermission.apexPage,
        SfPermission.customApplication,
        SfPermission.customObject,
        SfPermission.customField,
        SfPermission.customTab,
        SfPermission.recordType,
        SfPermission.layout,
    ];
    static defaultPermissionMetaTypes = [
        SfPermission.permissionSet,
        SfPermission.profile,
        ...SfPermission.permissionSetMetaTypes,
    ];
    static getPermissionString(permissionSet) {
        let result = '';
        if (permissionSet instanceof ObjectPermission) {
            result += permissionSet.toString();
        }
        else if (permissionSet instanceof FieldPermission) {
            result += permissionSet.toString();
        }
        else if (permissionSet instanceof TabPermission) {
            result += permissionSet.toString();
        }
        else if (permissionSet instanceof RecordTypePermission || permissionSet instanceof ApplicationPermission) {
            result += permissionSet.toString();
        }
        else if (permissionSet instanceof UserPermission ||
            permissionSet instanceof ClassPermission ||
            permissionSet instanceof LayoutAssignment ||
            permissionSet instanceof PagePermission) {
            result += permissionSet.toString();
        }
        return result.length === 0 ? '' : result.trimRight();
    }
}
//# sourceMappingURL=sf-permission.js.map