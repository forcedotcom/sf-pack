import path from 'node:path';
import { CommandBase } from '../../../helpers/command-base.js';
import { FileBase } from '../../../helpers/file-base.js';
import Utils, { RestResult } from '../../../helpers/utils.js';
import Constants from '../../../helpers/constants.js';
export default class Post extends FileBase {
    static description = CommandBase.messages.getMessage('api.file.post.commandDescription');
    static examples = [
        `$ sf api file post -u myOrgAlias -r ContentVersions.csv -f ContentVersion
    Uploads the ContentVersion records defined in ContentVersions.csv using the {id} named files in ./ContentVersion.`,
        `$ sf api file post  -u myOrgAlias -r ContentVersions.csv -f ./ContentVersion -c ContentDocumentId,VersionData,PathOnClient
    Uploads the ContentVersion records defined in ContentVersions.csv using only the columns: ContentDocumentId,VersionData,PathOnClient.`,
        `$ sf api file post  -u myOrgAlias -r ContentVersions.csv -f ContentVersion -a
    Uploads the ContentVersion records defined in ContentVersions.csv. The whole process will stop on the first failure.`,
    ];
    static flags = {
        ...FileBase.flags,
    };
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    async doFileAction(recordRaw) {
        let result = null;
        const fileName = recordRaw[this.metadataInfo.DataName] ?? recordRaw[this.metadataInfo.Filename];
        const filePath = path.join(this.filesPath, recordRaw[this.metadataInfo.Id]);
        const record = this.columns ? this.sanitizeRecord(recordRaw, this.columns) : recordRaw;
        if (!filePath) {
            this.errors.push(`No file path found for record: ${JSON.stringify(record)}.`);
            return result;
        }
        if (!(await Utils.pathExists(filePath))) {
            this.raiseError(`Path does not exists: ${filePath}.`);
            return;
        }
        const stats = await Utils.getPathStat(filePath);
        this.debug(`POSTing: ${FileBase.fileSObjectType} `);
        this.debug(`POSTing: ${JSON.stringify(record)}`);
        const base64Body = await Utils.readFile(filePath, Utils.ReadFileBase64EncodingOption);
        record[this.metadataInfo.DataName] = base64Body;
        // Do we need to use a multi-part POST?
        try {
            if (stats.size > Constants.CONTENT_VERSION_MAX_SIZE) {
                result = await this.sfClient.postObjectMultipart(FileBase.fileSObjectType, record, fileName, filePath);
            }
            else {
                result = await this.postFile(FileBase.fileSObjectType, record, filePath);
            }
        }
        catch (err) {
            result = new RestResult();
            result.code = 0;
            result.isError = true;
            result.body = `Exception: ${err.message}`;
        }
        if (result.isError) {
            const errorMessage = `Error uploading: (${this.counter}) ${filePath} (${result.code}) => ${result.body}}`;
            this.errors.push(errorMessage);
            this.debug(errorMessage);
        }
        this.UX.log(`(${this.counter}) ${result.isError ? 'FAILED: ' + filePath : 'wrote: ' + result.id}`);
        return result;
    }
    async postFile(objectName, objectRecord, filePath) {
        const result = new RestResult();
        const base64Body = await Utils.readFile(filePath, Utils.ReadFileBase64EncodingOption);
        objectRecord[this.metadataInfo.DataName] = base64Body;
        const saveResults = await this.org
            .getConnection()
            .sobject(objectName)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            .insert(objectRecord);
        if (saveResults) {
            const saveResult = Array.isArray(saveResults) ? saveResults[0] : saveResults;
            if (saveResult.success) {
                result.id = saveResult.id;
            }
            else {
                const saveError = saveResult;
                result.code = Number(saveError.errorCode);
                result.body = JSON.stringify(saveError);
            }
            return result;
        }
    }
}
//# sourceMappingURL=post.js.map