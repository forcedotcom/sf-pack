"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sf_plugins_core_1 = require("@salesforce/sf-plugins-core");
const command_base_1 = require("../../helpers/command-base");
const utils_1 = require("../../helpers/utils");
const sf_client_1 = require("../../helpers/sf-client");
const constants_1 = require("../../helpers/constants");
class File extends command_base_1.CommandBase {
    constructor() {
        super(...arguments);
        this.metadataInfo = null;
    }
    async runInternal() {
        const { flags } = await this.parse(File);
        const objectName = File.fileSObjectType;
        this.metadataInfo = sf_client_1.SfClient.metaDataInfo[objectName];
        const records = flags.records;
        const columns = flags.columns ? flags.columns.split(',') : null;
        this.debug('Executing api:file:post');
        this.debug(`MetdataInfo: ${JSON.stringify(this.metadataInfo)}`);
        if (!this.metadataInfo) {
            this.raiseError(`MetaDataInfo not found for: ${objectName}.`);
            return;
        }
        this.debug(`Records: ${records}`);
        if (!(await utils_1.default.pathExists(records))) {
            this.raiseError(`Path does not exists: ${records}.`);
            return;
        }
        const sfClient = new sf_client_1.SfClient(this.org);
        const errors = [];
        let counter = 0;
        for await (const recordRaw of utils_1.default.parseCSVFile(records)) {
            if (errors.length > 0 && (flags.allornothing)) {
                break;
            }
            counter++;
            this.debug(`RAW ${objectName} from CSV: ${JSON.stringify(recordRaw)}`);
            const record = this.sanitizeRecord(recordRaw, columns);
            const fileName = record[this.metadataInfo.Filename];
            const filePath = record[this.metadataInfo.DataName] ?? fileName;
            if (!filePath) {
                errors.push(`No file path found for record: ${JSON.stringify(record)}.`);
                continue;
            }
            if (!(await utils_1.default.pathExists(filePath))) {
                this.raiseError(`Path does not exists: ${filePath}.`);
                return;
            }
            const stats = await utils_1.default.getPathStat(filePath);
            // Do we need to use a multi-part POST?
            let result = null;
            try {
                if (stats.size > constants_1.default.CONENTVERSION_MAX_SIZE) {
                    result = await sfClient.postObjectMultipart(objectName, record, fileName, filePath);
                }
                else {
                    result = await this.postFile(objectName, record, filePath);
                }
            }
            catch (err) {
                result = new utils_1.RestResult();
                result.code = 0;
                result.isError = true;
                result.body = `Exception: ${err.message}`;
            }
            if (result.isError) {
                errors.push(`Error uploading: (${counter}) ${filePath} (${result.code}) => ${result.body}}`);
                this.debug(`Error api:file:post failed: ${filePath} (${result.code})=> ${result.body}`);
            }
            this.UX.log(`(${counter}) ${objectName} ${result.isError ? 'FAILED' : result.id} for file: ${fileName}`);
        }
        if (errors.length > 0) {
            this.UX.log('The following records failed:');
            for (const error of errors) {
                this.UX.log(error);
            }
            this.raiseError('Upload Failed');
        }
    }
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    async postFile(objectName, objectRecord, filePath) {
        this.debug(`POSTing: ${objectName} `);
        this.debug(`POSTing: ${JSON.stringify(objectRecord)}`);
        const result = new utils_1.RestResult();
        const base64Body = await utils_1.default.readFile(filePath, utils_1.default.ReadFileBase64EncodingOption);
        objectRecord[this.metadataInfo.DataName] = base64Body;
        const postResult = await this.org
            .getConnection()
            .sobject(objectName)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            .insert(objectRecord)[0];
        if (postResult.success) {
            result.id = postResult.id;
        }
        else {
            const saveError = postResult;
            result.code = Number(saveError.errorCode);
            result.body = JSON.stringify(saveError);
        }
        return result;
    }
    sanitizeRecord(raw, columns = []) {
        if (columns) {
            const newRaw = {};
            for (const column of columns) {
                if (column in raw) {
                    newRaw[column] = raw[column];
                }
                else {
                    this.raiseError(`The specified column/field ('${column}') does not exist in CSV record: ${JSON.stringify(raw)}`);
                }
            }
            const keys = Object.keys(raw);
            for (const key of keys) {
                if (columns.includes(key)) {
                    continue;
                }
                delete raw[key];
            }
        }
        else {
            for (const key of ['Id', 'FileType']) {
                if (key in raw) {
                    delete raw[key];
                }
            }
        }
        return raw;
    }
}
File.fileSObjectType = 'ContentVersion';
File.description = command_base_1.CommandBase.messages.getMessage('api.file.post.commandDescription');
File.examples = [
    `$ sf api file -u myOrgAlias -r ContentVersions.csv
    Uploads the ContentVersion records defined in ContentVersions.csv. 
    NOTE: filename = PathOnClient, filePath = ContentVersion then PathOnClient`,
    `$ sf api file -u myOrgAlias -r ContentVersions.csv -c ContentDocumentId,VersionData,PathOnClient
    Uploads the ContentVersion records defined in ContentVersions.csv using only the columns: ContentDocumentId,VersionData,PathOnClient. 
    NOTE: filename = PathOnClient, filePath = ContentVersion then PathOnClient`,
    `$ sf api file -u myOrgAlias -r ContentVersions.csv -a
    Uploads the ContentVersion records defined in ContentVersions.csv. The whole process will stop on the first failure.
    NOTE: filename = PathOnClient, filePath = ContentVersion then PathOnClient`,
];
File.flags = {
    records: sf_plugins_core_1.Flags.string({
        char: 'r',
        description: command_base_1.CommandBase.messages.getMessage('api.file.post.recordsFlagDescription'),
        required: true,
    }),
    columns: sf_plugins_core_1.Flags.string({
        char: 'c',
        description: command_base_1.CommandBase.messages.getMessage('api.file.post.columnsFlagDescription'),
        required: false,
    }),
    allornothing: sf_plugins_core_1.Flags.boolean({
        char: 'a',
        description: command_base_1.CommandBase.messages.getMessage('api.file.post.allOrNothingFlagDescription'),
        required: false,
    }),
    ...command_base_1.CommandBase.commonFlags,
};
exports.default = File;
//# sourceMappingURL=file.js.map