"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sf_plugins_core_1 = require("@salesforce/sf-plugins-core");
const command_base_1 = require("../../helpers/command-base");
const utils_1 = require("../../helpers/utils");
const sf_client_1 = require("../../helpers/sf-client");
class Get extends command_base_1.CommandBase {
    async runInternal() {
        const { flags } = await this.parse(Get);
        const apiKind = flags.tooling ? sf_client_1.ApiKind.TOOLING : sf_client_1.ApiKind.DEFAULT;
        const sfClient = new sf_client_1.SfClient(this.org);
        const ids = flags.ids.split(',');
        for await (const response of sfClient.getByIds(flags.metadata, ids, apiKind)) {
            const outFilePath = flags.output || '{Id}.json';
            const content = response.getContent();
            if (response.isBinary) {
                await utils_1.default.writeFile(outFilePath.replace('{Id}', response.id), content);
            }
            else {
                await utils_1.default.writeFile(outFilePath.replace('{Id}', response.id), JSON.stringify(content));
            }
        }
    }
}
Get.description = command_base_1.CommandBase.messages.getMessage('api.get.commandDescription');
Get.examples = [
    `$ sf api get -u myOrgAlias -m Account -i 068r0000003slVtAAI
    Performs the GET REST API action against the Account metadata type with an id of 068r0000003slVtAAI and writes the body to 068r0000003slVtAAI.json.`,
    `$ sf api get -u myOrgAlias -t true -m Account -i 068r0000003slVtAAI -o ./output/files/{Id}.json
    Performs the GET REST API action against the Account metadata type with an id of 068r0000003slVtAAI and writes the body to ./output/files/068r0000003slVtAAI.json.`,
    `$ sf api get -u myOrgAlias -m ContentVersion.VersionData -i 068r0000003slVtAAI -o ./output/files/{Id}.pdf
    Performs the GET REST API action against the ContentVersion metadata type with an id of 068r0000003slVtAAI and writes the VersionData field value body to 068r0000003slVtAAI.pdf.
    NOTE: Not all metadata types support field data access.`,
];
Get.flags = {
    metadata: sf_plugins_core_1.Flags.string({
        char: 'm',
        description: command_base_1.CommandBase.messages.getMessage('api.get.metadataFlagDescription'),
        required: true,
    }),
    ids: sf_plugins_core_1.Flags.string({
        char: 'i',
        description: command_base_1.CommandBase.messages.getMessage('api.get.idsFlagDescription'),
        required: true,
    }),
    output: sf_plugins_core_1.Flags.string({
        char: 'o',
        description: command_base_1.CommandBase.messages.getMessage('api.get.outputFoldersFlagDescription'),
    }),
    tooling: sf_plugins_core_1.Flags.boolean({
        char: 't',
        description: command_base_1.CommandBase.messages.getMessage('api.get.toolingAPIFlagDescription'),
    }),
    ...command_base_1.CommandBase.commonFlags,
};
exports.default = Get;
//# sourceMappingURL=get.js.map