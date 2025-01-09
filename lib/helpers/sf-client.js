"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SfClient = exports.ApiKind = exports.NO_CONTENT_CODE = void 0;
const fs = require("node:fs");
const FormData = require("form-data");
const utils_1 = require("./utils");
const sf_tasks_1 = require("./sf-tasks");
const utils_2 = require("./utils");
const constants_1 = require("./constants");
exports.NO_CONTENT_CODE = 204;
var ApiKind;
(function (ApiKind) {
    ApiKind["DEFAULT"] = "";
    ApiKind["TOOLING"] = "tooling/";
    ApiKind["COMPOSITE"] = "composite/";
    ApiKind["BULK_QUERY"] = "jobs/query/";
    ApiKind["BULK_INJECT"] = "jobs/injest/";
    ApiKind["LIMITS"] = "limits/";
})(ApiKind || (exports.ApiKind = ApiKind = {}));
class SfClient {
    constructor(org) {
        this.headers = null;
        this.apiVersion = null;
        this.accessToken = null;
        this.instanceUrl = null;
        if (!org) {
            throw new Error('org is required');
        }
        this.org = org;
    }
    getHeaders() {
        return this.headers;
    }
    async initialize(forceRefresh = false) {
        if (!forceRefresh && this.headers) {
            return;
        }
        try {
            // the auth file might have a stale access token.  We want to refresh it before getting the fields
            await this.org.refreshAuth();
        }
        catch (error) {
            // even if this fails, we want to display the information we can read from the auth file
            throw new Error('unable to refresh auth for org');
        }
        const fields = await sf_tasks_1.SfTasks.getOrgInfo(this.org);
        this.accessToken = fields.accessToken;
        this.instanceUrl = fields.instanceUrl;
        this.headers = {
            Authorization: `Bearer ${this.accessToken}`,
            Host: this.instanceUrl.split('//')[1],
        };
    }
    setApiVersion(apiVersion) {
        this.apiVersion = apiVersion.toString();
    }
    async *getMetadataSchemas(apiKind = ApiKind.DEFAULT) {
        const result = await this.doInternal(utils_2.RestAction.GET, null, apiKind);
        if (result.isError) {
            result.throw();
        }
        for await (const metaDataType of result.body.sobjects) {
            yield metaDataType;
        }
    }
    async getMetadataSchema(metaDataType, apiKind = ApiKind.DEFAULT) {
        if (!metaDataType) {
            throw new Error('metadataType parameter is required.');
        }
        const result = await this.doInternal(utils_2.RestAction.GET, metaDataType, null, apiKind);
        if (result.isError) {
            result.throw();
        }
        return result;
    }
    async getById(metaDataType, id, apiKind = ApiKind.DEFAULT) {
        if (!metaDataType) {
            throw new Error('metadataType parameter is required.');
        }
        if (!id) {
            throw new Error('id parameter is required.');
        }
        const result = await this.doInternalById(utils_2.RestAction.GET, metaDataType, id, null, apiKind);
        if (result.isError) {
            result.throw();
        }
        return result;
    }
    async *getByIds(metaDataType, ids, apiKind = ApiKind.DEFAULT) {
        if (!metaDataType) {
            throw new Error('metadataType parameter is required.');
        }
        if (!ids) {
            throw new Error('ids parameter is required.');
        }
        for await (const result of this.doInternalByIds(utils_2.RestAction.GET, metaDataType, ids, null, apiKind)) {
            if (result.isError) {
                result.throw();
            }
            yield result;
        }
    }
    async *getByRecords(metaDataType, records, recordIdField = SfClient.defaultIdField, apiKind = ApiKind.DEFAULT) {
        if (!metaDataType) {
            throw new Error('metadataType parameter is required.');
        }
        if (!records) {
            throw new Error('records parameter is required.');
        }
        for await (const result of this.doInternalByIds(utils_2.RestAction.GET, metaDataType, records, recordIdField, apiKind)) {
            if (result.isError) {
                result.throw();
            }
            yield result;
        }
    }
    async updateByRecord(metaDataType, record, recordIdField = SfClient.defaultIdField, apiKind = ApiKind.DEFAULT) {
        if (!metaDataType) {
            throw new Error('metadataType parameter is required.');
        }
        if (!record) {
            throw new Error('record parameter is required.');
        }
        const result = await this.doInternalById(utils_2.RestAction.PATCH, metaDataType, record, recordIdField, apiKind, [
            exports.NO_CONTENT_CODE,
        ]);
        if (result.isError) {
            result.throw();
        }
        return result;
    }
    async *updateByRecords(metaDataType, records, recordIdField = SfClient.defaultIdField, apiKind = ApiKind.DEFAULT) {
        if (!metaDataType) {
            throw new Error('metadataType parameter is required.');
        }
        if (!records) {
            throw new Error('records parameter is required.');
        }
        // Salesforce uses PATCH for updates
        for await (const result of this.doInternalByIds(utils_2.RestAction.PATCH, metaDataType, records, recordIdField, apiKind, [
            exports.NO_CONTENT_CODE,
        ])) {
            if (result.isError) {
                result.throw();
            }
            yield result;
        }
    }
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    async postObjectMultipart(objectName, objectRecord, fileName, filePath) {
        if (!objectName) {
            throw new Error('objectName parameter is required.');
        }
        if (!objectRecord) {
            throw new Error('objectRecord parameter is required.');
        }
        if (!fileName) {
            throw new Error('fileName parameter is required.');
        }
        if (!filePath) {
            throw new Error('filePath parameter is required.');
        }
        const form = new FormData();
        const formContent = JSON.stringify(objectRecord);
        const metaName = SfClient.metaDataInfo[objectName].MetaName;
        form.append(metaName, formContent, {
            contentType: constants_1.default.MIME_JSON,
        });
        const dataName = SfClient.metaDataInfo[objectName].DataName;
        const data = fs.createReadStream(filePath);
        form.append(dataName, data, {
            filename: fileName,
            contentType: utils_1.default.getMIMEType(fileName), // 'application/octet-stream',
        });
        const uri = await this.getUri(objectName);
        const result = await utils_1.default.getRestResult(utils_2.RestAction.POST, uri, form, form.getHeaders({ Authorization: `Bearer ${this.accessToken}` }), [200, 201]);
        // Log the form data if an error occurs
        if (!result.isError) {
            result.id = result.body.id;
        }
        return result;
    }
    async *do(action, metaDataType, records = null, recordIdField = SfClient.defaultIdField, apiKind = ApiKind.DEFAULT, validStatusCodes = [200]) {
        if (!action) {
            throw new Error('action parameter is required.');
        }
        if (!metaDataType) {
            throw new Error('metadataType parameter is required.');
        }
        if (records) {
            for await (const result of this.doInternalByIds(action, metaDataType, records, recordIdField, apiKind, validStatusCodes)) {
                if (result.isError) {
                    result.throw();
                }
                yield result;
            }
        }
        else {
            yield await this.doInternal(action, metaDataType, apiKind, null, validStatusCodes);
        }
    }
    async doAction(action = utils_2.RestAction.GET, uri, data, headers, validStatusCodes, isFollowRedirects = true) {
        if (!uri) {
            throw new Error('uri parameter is required.');
        }
        const result = await utils_1.default.getRestResult(action, uri, data, headers ?? this.headers, validStatusCodes, isFollowRedirects);
        return result;
    }
    async doComposite(action = utils_2.RestAction.GET, record, validStatusCodes = [200]) {
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
    async getMaxApiVersion() {
        await this.initialize(false);
        const result = await this.handleResponse(utils_2.RestAction.GET, `${this.instanceUrl}/services/data`);
        return result.body[result.body.length - 1].version;
    }
    async getBaseUri(apiKind = ApiKind.DEFAULT) {
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
    async getUri(metaDataType = null, id = null, apiKind = ApiKind.DEFAULT) {
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
    async doInternal(action = utils_2.RestAction.GET, metaDataType = null, record = null, apiKind = ApiKind.DEFAULT, validStatusCodes) {
        const uri = await this.getUri(metaDataType, null, apiKind);
        const result = await this.handleResponse(action, uri, record, validStatusCodes);
        return result;
    }
    async *doInternalByIds(action = utils_2.RestAction.GET, metaDataType = null, records, recordIdField = SfClient.defaultIdField, apiKind = ApiKind.DEFAULT, validStatusCodes) {
        for (const record of records) {
            const result = await this.doInternalById(action, metaDataType, record, recordIdField, apiKind, validStatusCodes);
            yield result;
        }
    }
    async doInternalById(action = utils_2.RestAction.GET, metaDataType = null, record, recordIdField = SfClient.defaultIdField, apiKind = ApiKind.DEFAULT, validStatusCodes) {
        let id = null;
        if (apiKind !== ApiKind.COMPOSITE && record) {
            id = utils_1.default.getFieldValue(record, recordIdField, true);
            // Delete the id field as SFDC API returns BAD_REQUEST if the object has an ID
            delete record[recordIdField];
        }
        const uri = await this.getUri(metaDataType, id, apiKind);
        const result = await this.handleResponse(action, uri, record, validStatusCodes);
        result.id = id;
        return result;
    }
    async handleResponse(action = utils_2.RestAction.GET, uri, record = null, validStatusCodes) {
        const result = await utils_1.default.getRestResult(action, uri, record, this.headers, validStatusCodes);
        return result;
    }
}
exports.SfClient = SfClient;
SfClient.metaDataInfo = {
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
SfClient.defaultIdField = 'id';
//# sourceMappingURL=sf-client.js.map