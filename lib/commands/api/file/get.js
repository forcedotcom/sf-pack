import path from 'node:path';
import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from '../../../helpers/command-base.js';
import { FileBase } from '../../../helpers/file-base.js';
import Utils from '../../../helpers/utils.js';
import { ApiKind } from '../../../helpers/sf-client.js';
export default class Get extends FileBase {
    static description = CommandBase.messages.getMessage('api.file.get.commandDescription');
    static examples = [
        `$ sf api file get -u myOrgAlias -r ContentVersions.csv  -f ./output/files
    Downloads the ContentVersion file contents defined in ContentVersions.csv and writes them to './output/files/{Id}'.`,
        'NOTE: the ContentVersion.csv file must have an Id column',
        `$ sf api file get -u myOrgAlias -m Attachment -r attachments.csv  -f ./output/files
    Downloads the Attachment file contents defined in attachments.csv and writes them to './output/files/{Id}'.`,
        'NOTE: the attachments.csv file must have an Id column'
    ];
    static flags = {
        ext: Flags.string({
            char: 'e',
            description: CommandBase.messages.getMessage('api.file.get.extFlagDescription'),
            required: false,
        }),
        ...FileBase.flags,
    };
    async parseFlags() {
        this.flags = (await this.parse(Get))?.flags;
    }
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    async doFileAction(recordRaw) {
        this.debug(`GETting: ${this.metadataType} `);
        this.debug(`GETting: ${JSON.stringify(recordRaw)}`);
        const id = recordRaw[this.metadataInfo.Id];
        if (!id) {
            this.raiseError('No Id column found in records file');
            return;
        }
        const result = await this.sfClient.getById(this.metadataName, id, ApiKind.DEFAULT);
        if (result.isError) {
            const errorMessage = `Error GETting: (${this.counter}) ${id} (${result.code}) => ${result.body}}`;
            this.errors.push(errorMessage);
            this.debug(errorMessage);
            return result;
        }
        const content = result.getContent();
        let outFilePath = path.join(this.filesPath, result.id);
        if (this.flags.ext) {
            const ext = recordRaw[this.flags.ext];
            if (ext) {
                outFilePath += '.' + ext;
            }
            else {
                this.UX.log(`Error: the column named '${this.flags.ext}' does not exist.`);
            }
        }
        // optionally append file ext
        await Utils.writeFile(outFilePath, result.isBinary ? content : JSON.stringify(content));
        this.UX.log(`(${this.counter}) ${result.isError ? 'FAILED: ' + result.id : 'wrote: ' + outFilePath}`);
        return result;
    }
}
//# sourceMappingURL=get.js.map