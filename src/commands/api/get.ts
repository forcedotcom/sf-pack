import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from '../../helpers/command-base.js';
import Utils from '../../helpers/utils.js';
import { SfClient, ApiKind } from '../../helpers/sf-client.js';

export default class Get extends CommandBase {
  public static description = CommandBase.messages.getMessage('api.get.commandDescription');

  public static examples = [
    `$ sf api get -u myOrgAlias -m Account -i 068r0000003slVtAAI
    Performs the GET REST API action against the Account metadata type with an id of 068r0000003slVtAAI and writes the body to 068r0000003slVtAAI.json.`,
    `$ sf api get -u myOrgAlias -t true -m Account -i 068r0000003slVtAAI -f ./output/files/{Id}.json
    Performs the GET REST API action against the Account metadata type with an id of 068r0000003slVtAAI and writes the body to ./output/files/068r0000003slVtAAI.json.`,
    `$ sf api get -u myOrgAlias -m ContentVersion.VersionData -i 068r0000003slVtAAI -f ./output/files/{Id}.pdf
    Performs the GET REST API action against the ContentVersion metadata type with an id of 068r0000003slVtAAI and writes the VersionData field value body to 068r0000003slVtAAI.pdf.`,
    `$ sf api get -u myOrgAlias -m ContentVersion.VersionData -i test/ContentVersionIds.txt -f ./output/files/{Id}.pdf
    Performs the GET REST API action against the ContentVersion metadata type for each of the ids contained in the test/ContentVersionIds.txt and writes the VersionData field value body to 068r0000003slVtAAI.pdf.`,
    `NOTE: Not all metadata types support field data access.`,
  ];

  public static readonly flags = {
    metadata: Flags.string({
      char: 'm',
      description: CommandBase.messages.getMessage('api.get.metadataFlagDescription'),
      required: true,
    }),
    ids: Flags.string({
      char: 'i',
      description: CommandBase.messages.getMessage('api.get.idsFlagDescription'),
      required: true,
    }),
    file: Flags.string({
      char: 'f',
      description: CommandBase.messages.getMessage('api.get.outputFoldersFlagDescription'),
    }),
    tooling: Flags.boolean({
      char: 't',
      description: CommandBase.messages.getMessage('api.get.toolingAPIFlagDescription'),
    }),
    ...CommandBase.commonFlags,
    ...CommandBase.flags,
  };

  protected async runInternal(): Promise<void> {
    const { flags } = await this.parse(Get);
    const apiKind = flags.tooling ? ApiKind.TOOLING : ApiKind.DEFAULT;

    const sfClient = new SfClient(this.org);

    const ids = await CommandBase.readIdsFromFlagOrFile(flags.ids as string);
    for await (const response of sfClient.getByIds(flags.metadata as string, ids, apiKind)) {
      const outFilePath: string = flags.file || '{Id}.json';
      const content = response.getContent();
      if (response.isBinary) {
        await Utils.writeFile(outFilePath.replace('{Id}', response.id), content);
      } else {
        await Utils.writeFile(outFilePath.replace('{Id}', response.id), JSON.stringify(content));
      }
    }
  }
}
