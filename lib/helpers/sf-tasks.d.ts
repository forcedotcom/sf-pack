import { DescribeMetadataObject, FileProperties } from '@jsforce/jsforce-node/lib/api/metadata.js';
import { DescribeSObjectResult } from '@jsforce/jsforce-node';
import { Connection, Org, AuthFields } from '@salesforce/core';
import { RestResult } from './utils.js';
import { SfEntity } from './sf-query.js';
import { ApiKind } from './sf-client.js';
export declare class SfJobInfo {
    id: string;
    batchId: string;
    state: string;
    createdDate: string;
    statusCount: number;
    maxStatusCount: number;
    jobKind: ApiKind;
    constructor();
    static fromRestResult(result: RestResult): SfJobInfo;
    static fromResults(results: any): SfJobInfo;
    isDone(): boolean;
}
export declare class SfTasks {
    static defaultMetaTypes: string[];
    protected static proFolderPaths: Map<string, string>;
    static describeMetadata(org: Org): Promise<DescribeMetadataObject[]>;
    static getTypesForPackage(org: Org, describeMetadatas: Set<any>, namespaces?: Set<string>): AsyncGenerator<any, void, void>;
    static listMetadata(org: Org, metadataType: string, folder?: string, namespaces?: Set<string>): AsyncGenerator<FileProperties, void, void>;
    static listMetadatas(org: Org, metadataTypes: Iterable<string>, folder?: string, namespaces?: Set<string>): Promise<Map<string, FileProperties[]>>;
    static describeObject(org: Org, objectName: string): Promise<DescribeSObjectResult>;
    static enqueueApexTests(org: Org, sfEntities?: SfEntity[], shouldSkipCodeCoverage?: boolean): Promise<RestResult>;
    static getBulkJobStatus(org: Org, jobInfo: SfJobInfo): Promise<SfJobInfo>;
    static waitForJob(org: Org, jobInfo: SfJobInfo, maxWaitSeconds?: number, sleepMilliseconds?: number): AsyncGenerator<SfJobInfo, SfJobInfo, void>;
    static getOrgInfo(org: Org): Promise<AuthFields>;
    static getMapFromSourceTrackingStatus(sourceTrackingStatues: any[]): any;
    static getConfigValue(configName: string): Promise<string>;
    static getMaxQueryLimit(): Promise<number>;
    static getDefaultOrgAlias(): Promise<string>;
    static getUnsupportedMetadataTypes(): Promise<string[]>;
    static getConnection(username: string): Promise<Connection>;
    static executeAnonymousBlock(org: Org, apex: string): Promise<RestResult>;
    static getOrgLimits(org: Org): Promise<RestResult>;
    private static getFolderSOQLData;
    private static getFolderFullPath;
}
