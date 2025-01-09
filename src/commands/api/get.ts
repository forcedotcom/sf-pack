import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from '../../helpers/command-base';
import Utils from '../../helpers/utils';
import { SfClient, ApiKind } from '../../helpers/sf-client';

export default class Get extends CommandBase {
  public static description = CommandBase.messages.getMessage('api.get.commandDescription');

  public static examples = [
    `$ sf api get -u myOrgAlias -m Account -i 068r0000003slVtAAI
    Performs the GET REST API action against the Account metadata type with an id of 068r0000003slVtAAI and writes the body to 068r0000003slVtAAI.json.`,
    `$ sf api get -u myOrgAlias -t true -m Account -i 068r0000003slVtAAI -o ./output/files/{Id}.json
    Performs the GET REST API action against the Account metadata type with an id of 068r0000003slVtAAI and writes the body to ./output/files/068r0000003slVtAAI.json.`,
    `$ sf api get -u myOrgAlias -m ContentVersion.VersionData -i 068r0000003slVtAAI -o ./output/files/{Id}.pdf
    Performs the GET REST API action against the ContentVersion metadata type with an id of 068r0000003slVtAAI and writes the VersionData field value body to 068r0000003slVtAAI.pdf.
    NOTE: Not all metadata types support field data access.`,
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
    output: Flags.string({
      char: 'o',
      description: CommandBase.messages.getMessage('api.get.outputFoldersFlagDescription'),
    }),
    tooling: Flags.boolean({
      char: 't',
      description: CommandBase.messages.getMessage('api.get.toolingAPIFlagDescription'),
    }),
    ...CommandBase.commonFlags,
  };

  protected async runInternal(): Promise<void> {
    const { flags } = await this.parse(Get);
    const apiKind = flags.tooling ? ApiKind.TOOLING : ApiKind.DEFAULT;

    const sfClient = new SfClient(this.org);

    const ids: string[] = flags.ids.split(',');
    for await (const response of sfClient.getByIds(flags.metadata, ids, apiKind)) {
      const outFilePath: string = flags.output || '{Id}.json';
      const content = response.getContent();
      if (response.isBinary) {
        await Utils.writeFile(outFilePath.replace('{Id}', response.id), content);
      } else {
        await Utils.writeFile(outFilePath.replace('{Id}', response.id), JSON.stringify(content));
      }
    }
  }
}
