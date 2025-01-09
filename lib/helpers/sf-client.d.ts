import { Org } from '@salesforce/core';
import { RestAction, RestResult } from './utils';
export declare const NO_CONTENT_CODE = 204;
export declare enum ApiKind {
    DEFAULT = "",
    TOOLING = "tooling/",
    COMPOSITE = "composite/",
    BULK_QUERY = "jobs/query/",
    BULK_INJECT = "jobs/injest/",
    LIMITS = "limits/"
}
export declare class SfClient {
    static readonly metaDataInfo: {
        ContentVersion: {
            MetaName: string;
            DataName: string;
            Filename: string;
        };
        Document: {
            MetaName: string;
            DataName: string;
            Filename: string;
        };
        Attachment: {
            MetaName: string;
            DataName: string;
            Filename: string;
        };
    };
    private static defaultIdField;
    private headers;
    private org;
    private apiVersion;
    private accessToken;
    private instanceUrl;
    constructor(org: Org);
    getHeaders(): any;
    initialize(forceRefresh?: boolean): Promise<void>;
    setApiVersion(apiVersion: number): void;
    getMetadataSchemas(apiKind?: ApiKind): AsyncGenerator<any, void, void>;
    getMetadataSchema(metaDataType: string, apiKind?: ApiKind): Promise<RestResult>;
    getById(metaDataType: string, id: string, apiKind?: ApiKind): Promise<RestResult>;
    getByIds(metaDataType: string, ids: string[], apiKind?: ApiKind): AsyncGenerator<RestResult, void, void>;
    getByRecords(metaDataType: string, records: any[], recordIdField?: string, apiKind?: ApiKind): AsyncGenerator<RestResult, void, void>;
    updateByRecord(metaDataType: string, record: any, recordIdField?: string, apiKind?: ApiKind): Promise<RestResult>;
    updateByRecords(metaDataType: string, records: any[], recordIdField?: string, apiKind?: ApiKind): AsyncGenerator<RestResult, void, void>;
    postObjectMultipart(objectName: string, objectRecord: any, fileName: string, filePath: string): Promise<any>;
    do(action: RestAction, metaDataType: string, records?: any[], recordIdField?: string, apiKind?: ApiKind, validStatusCodes?: number[]): AsyncGenerator<RestResult, void, void>;
    doAction(action: RestAction, uri: string, data?: any, headers?: any, validStatusCodes?: number[], isFollowRedirects?: boolean): Promise<RestResult>;
    doComposite(action: RestAction, record: any, validStatusCodes?: number[]): Promise<RestResult>;
    getMaxApiVersion(): Promise<string>;
    getBaseUri(apiKind?: ApiKind): Promise<string>;
    getUri(metaDataType?: string, id?: string, apiKind?: ApiKind): Promise<string>;
    private doInternal;
    private doInternalByIds;
    private doInternalById;
    private handleResponse;
}
