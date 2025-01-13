import { Org } from '@salesforce/core';
import { Record } from '@jsforce/jsforce-node';
export declare class SfEntity {
    id: string;
    parentId: string;
    name: string;
}
export declare class SfSetupEntityAccess {
    setupEntityId: string;
    setupEntityType: string;
}
export declare class SfFolder extends SfEntity {
    developerName: string;
    type: string;
}
export declare class SfPermissionSet extends SfEntity {
    isOwnedByProfile: boolean;
    profileName: string;
}
export declare abstract class SfPermission extends SfEntity {
    permissionsEdit: boolean;
    permissionsRead: boolean;
    abstract permissionType: string;
}
export declare class SfFieldPermission extends SfPermission {
    permissionType: string;
    field: string;
}
export declare class SfObjectPermission extends SfPermission {
    permissionType: string;
    permissionsCreate: boolean;
    permissionsDelete: boolean;
    permissionsModifyAllRecords: boolean;
    permissionsViewAllRecords: boolean;
}
export declare class SfCodeCoverage {
    codeCoverage: SfCodeCoverageItem[];
    totalCoveredLines: number;
    totalUncoveredLines: number;
    codeCoveragePercent: number;
    constructor();
    calculateCodeCoverage(): void;
}
export declare class SfCodeCoverageItem extends SfEntity {
    coveredLines: number[];
    uncoveredLines: number[];
    constructor();
    getCodeCoveragePercent(): number;
}
export declare class SfValidationRule extends SfEntity {
    active: boolean;
    errorMessage: string;
    description: string;
    errorConditionFormula: string;
    errorDisplayField: string;
}
export declare class SfQuery {
    static getCustomApplications(org: Org): Promise<SfEntity[]>;
    static getSetupEntityTypes(org: Org): Promise<string[]>;
    static getFolders(org: Org): Promise<SfFolder[]>;
    static getPermissions(org: Org): Promise<Map<string, SfPermissionSet>>;
    static getObjectPermissions(org: Org, customObjectTypeName: string): Promise<SfObjectPermission[]>;
    static getFieldPermissions(org: Org, customObjectTypeName: string): Promise<SfFieldPermission[]>;
    static getSetupEntityAccessForTypes(org: Org, setupEntityTypeNames: string[]): Promise<SfSetupEntityAccess[]>;
    static queryOrg(org: Org, query: string, isToolingAPIQuery?: boolean | undefined, allRows?: boolean | undefined): Promise<Record[]>;
    static getApexTestClasses(org: Org, namespacePrefixes?: string[]): Promise<SfEntity[]>;
    static getCodeCoverage(org: Org): Promise<SfCodeCoverage>;
    static getValidationRules(org: Org, includeLogic?: boolean): Promise<SfValidationRule[]>;
    static waitForRecordCount(org: Org, query: string, recordCount?: number, maxWaitSeconds?: number, sleepMilliseconds?: number): AsyncGenerator<number, void, void>;
    static waitForApexTests(org: Org, parentJobId: string, waitCountMaxSeconds?: number): AsyncGenerator<number, number, void>;
    static getInClause(values?: string[], isValueNumeric?: boolean): string;
}
