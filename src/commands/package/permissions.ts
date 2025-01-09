import path = require('path');
import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from '../../helpers/command-base';
import { SfTasks } from '../../helpers/sf-tasks';
import { SfPermission } from '../../helpers/sf-permission';
import { SfCore } from '../../helpers/sf-core';
import Utils from '../../helpers/utils';

export default class Permissions extends CommandBase {
  public static packageFileName = 'package-permissions.xml';
  public static description = CommandBase.messages.getMessage('package.permissions.commandDescription');

  public static examples = [
    `$ sf package permissions -u myOrgAlias
    Creates a package file (${Permissions.packageFileName}) which contains
    Profile & PermissionSet metadata related to ${SfPermission.defaultPermissionMetaTypes.join(', ')} permissions.`,
    `$ sf package permissions -u myOrgAlias -m CustomObject,CustomApplication
    Creates a package file (${Permissions.packageFileName}) which contains
    Profile & PermissionSet metadata related to CustomObject & CustomApplication permissions.`,
  ];

  public static readonly flags = {
    package: Flags.string({
      char: 'x',
      description: CommandBase.messages.getMessage('package.permissions.packageFlagDescription', [
        Permissions.packageFileName,
      ]),
    }),
    metadata: Flags.string({
      char: 'm',
      description: CommandBase.messages.getMessage('package.permissions.metadataFlagDescription', [
        SfPermission.defaultPermissionMetaTypes.join(', '),
      ]),
    }),
    namespaces: Flags.string({
      char: 'n',
      description: CommandBase.messages.getMessage('namespacesFlagDescription'),
    }),
    ...CommandBase.commonFlags,
  };

  protected metaNames: Set<string>;
  protected namespaces: Set<string>;
  protected packageFileName: string;

  protected async runInternal(): Promise<void> {
    const { flags } = await this.parse(Permissions);

    // Gather metadata names to include
    const metaNames = Utils.sortArray(
      flags.metadata ? flags.metadata.split(',') : SfPermission.defaultPermissionMetaTypes
    );
    this.metaNames = new Set(metaNames);

    // Are we including namespaces?
    this.namespaces = flags.namespaces ? new Set<string>(flags.namespaces.split(',')) : new Set<string>();

    this.packageFileName = flags.package || Permissions.packageFileName;

    const packageDir = path.dirname(this.packageFileName);
    if (packageDir && !(await Utils.pathExists(packageDir))) {
      this.raiseError(`The specified package folder does not exist: '${packageDir}'`);
    }

    this.UX.log(`Gathering metadata from Org: ${this.orgAlias}(${this.orgId})`);
    const describeMetadata = await SfTasks.describeMetadata(this.org);

    const describeMetadatas = new Set<any>();
    for (const metadata of describeMetadata) {
      if (this.metaNames.has(metadata.xmlName)) {
        describeMetadatas.add(metadata);
        continue;
      }

      if (metadata.childXmlNames) {
        for (const childName of metadata.childXmlNames) {
          if (this.metaNames.has(childName)) {
            // 'adopt' the childName as the xmlName to pull the child metadata
            metadata.xmlName = childName;
            describeMetadatas.add(metadata);
          }
        }
      }
    }

    this.UX.log(`Generating: ${this.packageFileName}`);

    const metadataMap = new Map<string, string[]>();
    let counter = 0;
    for await (const entry of SfTasks.getTypesForPackage(this.org, describeMetadatas, this.namespaces)) {
      metadataMap.set(entry.name as string, entry.members as string[]);
      this.UX.log(`Processed (${++counter}/${describeMetadatas.size}): ${entry.name as string}`);
    }
    // Write the final package
    await SfCore.writePackageFile(metadataMap, this.packageFileName);
    return;
  }
}
