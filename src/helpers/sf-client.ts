import * as fs from 'node:fs';
import * as FormData from 'form-data';
import { Org } from '@salesforce/core';
import Utils from './utils';
import { SfTasks } from './sf-tasks';
import { RestAction, RestResult } from './utils';
import Constants from './constants';

export const NO_CONTENT_CODE = 204;

export enum ApiKind {
  DEFAULT = '',
  TOOLING = 'tooling/',
  COMPOSITE = 'composite/',
  BULK_QUERY = 'jobs/query/',
  BULK_INJECT = 'jobs/injest/',
  LIMITS = 'limits/'
}

export class SfClient {
  public static readonly metaDataInfo = {
    ContentVersion: {
      MetaName: 'entity_content',
      DataName: 'VersionData',
      Filename: 'PathOnClient',
    },
    Document: {
      MetaName: 'entity_document',
      DataName: 'Body',
      Filename: 'Name',
    },
    Attachment: {
      MetaName: 'entity_document',
      DataName: 'Body',
      Filename: 'Name',
    },
  };

  private static defaultIdField = 'id';

  private headers: any = null;
  private org: Org;
  private apiVersion: string = null;
  private accessToken: string = null;
  private instanceUrl: string = null;

  public constructor(org: Org) {
    if (!org) {
      throw new Error('org is required');
    }
    this.org = org;
  }

  public getHeaders(): any {
    return this.headers;
  }

  public async initialize(forceRefresh = false): Promise<void> {
    if (!forceRefresh && this.headers) {
      return;
    }
    try {
      // the auth file might have a stale access token.  We want to refresh it before getting the fields
      await this.org.refreshAuth();
    } catch (error) {
      // even if this fails, we want to display the information we can read from the auth file
      throw new Error('unable to refresh auth for org');
    }
    const fields = await SfTasks.getOrgInfo(this.org);

    this.accessToken = fields.accessToken;
    this.instanceUrl = fields.instanceUrl;

    this.headers = {
      Authorization: `Bearer ${this.accessToken}`,
      Host: this.instanceUrl.split('//')[1],
    };
  }

  public setApiVersion(apiVersion: number): void {
    this.apiVersion = apiVersion.toString();
  }

  public async *getMetadataSchemas(apiKind: ApiKind = ApiKind.DEFAULT): AsyncGenerator<any, void, void> {
    const result = await this.doInternal(RestAction.GET, null, apiKind);
    if (result.isError) {
      result.throw();
    }
    for await (const metaDataType of result.body.sobjects) {
      yield metaDataType;
    }
  }

  public async getMetadataSchema(metaDataType: string, apiKind: ApiKind = ApiKind.DEFAULT): Promise<RestResult> {
    if (!metaDataType) {
      throw new Error('metadataType parameter is required.');
    }
    const result = await this.doInternal(RestAction.GET, metaDataType, null, apiKind);
    if (result.isError) {
      result.throw();
    }
    return result;
  }

  public async getById(metaDataType: string, id: string, apiKind: ApiKind = ApiKind.DEFAULT): Promise<RestResult> {
    if (!metaDataType) {
      throw new Error('metadataType parameter is required.');
    }
    if (!id) {
      throw new Error('id parameter is required.');
    }
    const result = await this.doInternalById(RestAction.GET, metaDataType, id, null, apiKind);
    if (result.isError) {
      result.throw();
    }
    return result;
  }

  public async *getByIds(
    metaDataType: string,
    ids: string[],
    apiKind: ApiKind = ApiKind.DEFAULT
  ): AsyncGenerator<RestResult, void, void> {
    if (!metaDataType) {
      throw new Error('metadataType parameter is required.');
    }
    if (!ids) {
      throw new Error('ids parameter is required.');
    }
    for await (const result of this.doInternalByIds(RestAction.GET, metaDataType, ids, null, apiKind)) {
      if (result.isError) {
        result.throw();
      }
      yield result;
    }
  }

  public async *getByRecords(metaDataType: string, records: any[], recordIdField: string = SfClient.defaultIdField, apiKind: ApiKind = ApiKind.DEFAULT): AsyncGenerator<RestResult, void, void> {
    if (!metaDataType) {
      throw new Error('metadataType parameter is required.');
    }
    if (!records) {
      throw new Error('records parameter is required.');
    }

    for await (const result of this.doInternalByIds(RestAction.GET, metaDataType, records, recordIdField, apiKind)) {
      if (result.isError) {
        result.throw();
      }
      yield result;
    }
  }

  public async updateByRecord(
    metaDataType: string,
    record: any,
    recordIdField: string = SfClient.defaultIdField,
    apiKind: ApiKind = ApiKind.DEFAULT
  ): Promise<RestResult> {
    if (!metaDataType) {
      throw new Error('metadataType parameter is required.');
    }
    if (!record) {
      throw new Error('record parameter is required.');
    }
    const result = await this.doInternalById(RestAction.PATCH, metaDataType, record, recordIdField, apiKind, [
      NO_CONTENT_CODE,
    ]);
    if (result.isError) {
      result.throw();
    }
    return result;
  }

  public async *updateByRecords(
    metaDataType: string,
    records: any[],
    recordIdField: string = SfClient.defaultIdField,
    apiKind: ApiKind = ApiKind.DEFAULT
  ): AsyncGenerator<RestResult, void, void> {
    if (!metaDataType) {
      throw new Error('metadataType parameter is required.');
    }
    if (!records) {
      throw new Error('records parameter is required.');
    }
    // Salesforce uses PATCH for updates
    for await (const result of this.doInternalByIds(RestAction.PATCH, metaDataType, records, recordIdField, apiKind, [
      NO_CONTENT_CODE,
    ])) {
      if (result.isError) {
        result.throw();
      }
      yield result;
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public async postObjectMultipart( objectName: string, objectRecord: any, fileName: string, filePath: string): Promise<any> {
    if(!objectName) {
      throw new Error('objectName parameter is required.');
    }
    if(!objectRecord) {
      throw new Error('objectRecord parameter is required.');
    }
    if(!fileName) {
      throw new Error('fileName parameter is required.');
    }
    if(!filePath) {
      throw new Error('filePath parameter is required.');
    }
    const form = new FormData();
    const formContent = JSON.stringify(objectRecord);

    const metaName = SfClient.metaDataInfo[objectName].MetaName as string;
    form.append(metaName, formContent, {
      contentType: Constants.MIME_JSON,
    });

    const dataName = SfClient.metaDataInfo[objectName].DataName as string;
    const data = fs.createReadStream(filePath);
    form.append(dataName, data, {
      filename: fileName,
      contentType: Utils.getMIMEType(fileName), // 'application/octet-stream',
    });

    const uri = await this.getUri(objectName);
    const result = await Utils.getRestResult(
      RestAction.POST,
      uri,
      form,
      form.getHeaders({ Authorization: `Bearer ${this.accessToken}` }),
      [200, 201]
    );

    // Log the form data if an error occurs
    if (!result.isError) {
      result.id = result.body.id;
    }
    return result;
  }

  public async *do(
    action: RestAction,
    metaDataType: string,
    records: any[] = null,
    recordIdField: string = SfClient.defaultIdField,
    apiKind: ApiKind = ApiKind.DEFAULT,
    validStatusCodes = [200]
  ): AsyncGenerator<RestResult, void, void> {
    if(!action) {
      throw new Error('action parameter is required.');
    }
    if (!metaDataType) {
      throw new Error('metadataType parameter is required.');
    }
    if (records) {
      for await (const result of this.doInternalByIds(
        action,
        metaDataType,
        records,
        recordIdField,
        apiKind,
        validStatusCodes
      )) {
        if (result.isError) {
          result.throw();
        }
        yield result;
      }
    } else {
      yield await this.doInternal(action, metaDataType, apiKind, null, validStatusCodes);
    }
  }

  public async doAction(
    action: RestAction = RestAction.GET,
    uri: string,
    data?: any,
    headers?: any,
    validStatusCodes?: number[],
    isFollowRedirects = true
  ): Promise<RestResult> {
    if (!uri) {
      throw new Error('uri parameter is required.');
    }
    const result = await Utils.getRestResult(action, uri, data, headers ?? this.headers, validStatusCodes, isFollowRedirects);
    return result;
  }

  public async doComposite(
    action: RestAction = RestAction.GET,
    record: any,
    validStatusCodes = [200]
  ): Promise<RestResult> {
    // https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_composite_sobjects_collections.htm
    if (!record) {
      throw new Error('record parameter is required.');
    }
    const result = await this.doInternal(action, null, record, ApiKind.COMPOSITE, validStatusCodes);
    if (result.isError) {
      result.throw();
    }
    return result;
  }

  public async getMaxApiVersion(): Promise<string> {
    await this.initialize(false);
    const result = await this.handleResponse(RestAction.GET, `${this.instanceUrl}/services/data`);

    return result.body[result.body.length - 1].version as string;
  }

  public async getBaseUri(
    apiKind: ApiKind = ApiKind.DEFAULT
  ): Promise<string> {
    await this.initialize(false);
    if (!this.apiVersion) {
      this.apiVersion = await this.getMaxApiVersion();
    }
    const uri = `${this.instanceUrl}/services/data/v${this.apiVersion}/${apiKind}`;
    // switch (apiKind) {
    //   case ApiKind.TOOLING:
    //   case ApiKind.COMPOSITE:
    //   case ApiKind.BULK_QUERY:
    //   case ApiKind.BULK_INJECT:
    //     uri += apiKind + '/';
    //     break;
    //   default:
    //     break;
    // }
    return uri;
  }

  public async getUri(
    metaDataType: string = null,
    id: string = null,
    apiKind: ApiKind = ApiKind.DEFAULT
  ): Promise<string> {
    let uri = await this.getBaseUri(apiKind);
    uri += 'sobjects/';
    if (metaDataType) {
      const parts = metaDataType.split('.');
      uri += parts[0] + '/';
      if (id) {
        uri += id + '/';
      }
      if (parts.length > 1) {
        uri += parts[1] + '/';
      }
    }

    return uri;
  }

  private async doInternal(
    action: RestAction = RestAction.GET,
    metaDataType: string = null,
    record: any = null,
    apiKind: ApiKind = ApiKind.DEFAULT,
    validStatusCodes?: number[]
  ): Promise<RestResult> {
    const uri = await this.getUri(metaDataType, null, apiKind);
    const result = await this.handleResponse(action, uri, record, validStatusCodes);
    return result;
  }

  private async *doInternalByIds(
    action: RestAction = RestAction.GET,
    metaDataType: string = null,
    records: any[],
    recordIdField: string = SfClient.defaultIdField,
    apiKind: ApiKind = ApiKind.DEFAULT,
    validStatusCodes?: number[]
  ): AsyncGenerator<any, void, void> {
    for (const record of records) {
      const result = await this.doInternalById(action, metaDataType, record, recordIdField, apiKind, validStatusCodes);
      yield result;
    }
  }

  private async doInternalById(
    action: RestAction = RestAction.GET,
    metaDataType: string = null,
    record: any,
    recordIdField: string = SfClient.defaultIdField,
    apiKind: ApiKind = ApiKind.DEFAULT,
    validStatusCodes?: number[]
  ): Promise<RestResult> {
    let id: string = null;
    if (apiKind !== ApiKind.COMPOSITE && record) {
      id = Utils.getFieldValue(record, recordIdField, true);
      // Delete the id field as SFDC API returns BAD_REQUEST if the object has an ID
      delete record[recordIdField];
    }
    const uri = await this.getUri(metaDataType, id, apiKind);
    const result = await this.handleResponse(action, uri, record, validStatusCodes);
    result.id = id;
    return result;
  }

  private async handleResponse(
    action: RestAction = RestAction.GET,
    uri: string,
    record: any = null,
    validStatusCodes?: number[]
  ): Promise<RestResult> {
    const result = await Utils.getRestResult(action, uri, record, this.headers, validStatusCodes);
    return result;
  }
}
