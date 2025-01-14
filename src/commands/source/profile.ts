import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from '../../helpers/command-base.js';
import { SfTasks } from '../../helpers/sf-tasks.js';
import Utils from '../../helpers/utils.js';
import { SfPermission, PermissionSet } from '../../helpers/sf-permission.js';

export default class Profile extends CommandBase {
  public static defaultSourceFolder: string = null;
  public static defaultPermissionsGlobs = [
    '**/profiles/*.profile-meta.xml',
    '**/permissionsets/*.permissionset-meta.xml',
  ];

  public static description = CommandBase.messages.getMessage('source.profile.commandDescription');
  public static examples = [
    `$ sf source profile -u myOrgAlias
    Compares the profile metadata files in ${Profile.defaultPermissionsGlobs.join(
      ','
    )} to the specified Org to determine deployment compatibility.`,
    `$ sf source profile -m true -u myOrgAlias
    Compares the profile metadata files in ${Profile.defaultPermissionsGlobs.join(
      ','
    )} to the specified Org to and updates the metadata files to ensure deployment compatibility.`,
  ];

  public static readonly flags = {
    source: Flags.directory({
      char: 'p',
      description: CommandBase.messages.getMessage('source.profile.profilePathFlagDescription', [
        Profile.defaultPermissionsGlobs.join(','),
      ]),
      required: false,
    }),
    modify: Flags.boolean({
      char: 'm',
      description: CommandBase.messages.getMessage('source.profile.modifyFlagDescription'),
      required: false,
    }),
    output: Flags.directory({
      char: 'o',
      description: CommandBase.messages.getMessage('source.profile.outputFoldersFlagDescription'),
      required: false,
    }),
    ...CommandBase.commonFlags,
      ...CommandBase.flags,
  };

  protected permissions: Map<string, PermissionSet>;

  protected async runInternal(): Promise<void> {
    const { flags } = await this.parse(Profile);
    const sourceFolders: string[] = !flags.source ? Profile.defaultPermissionsGlobs : flags.source.split(',');

    this.permissions = new Map<string, PermissionSet>();
    let gotStandardTabs = false;

    const sourceFilePaths = new Set<string>();
    const custObjs = [];
    for (const sourceFolder of sourceFolders) {
      if (!sourceFolder) {
        continue;
      }
      this.UX.log(`Reading metadata in: ${sourceFolder}`);
      for await (const filePath of Utils.getFiles(sourceFolder.trim())) {
        this.UX.log(`\tProcessing: ${filePath}`);
        const json = await Utils.readObjectFromXmlFile(filePath);

        if (!json.PermissionSet && !json.Profile) {
          this.UX.log(`\tUnable to process file: ${filePath}`);
          continue;
        }
        // Read all the CustomObject typenames PermissionSet from and add to the customObjects Set
        const permSet = PermissionSet.fromJson(filePath, json);
        custObjs.push(...Array.from(permSet.getPermissionCollection(SfPermission.customObject).keys()));

        // Add to collection for update later
        sourceFilePaths.add(filePath);
      }
    }
    // Debug
    const customObjects: Set<string> = new Set<string>(Utils.sortArray(custObjs));
    this.UX.log(`CustomObjects: ${[...customObjects].join(',')}`);

    // Get Objects and fields first
    const notFoundInOrg = new Set<string>();
    let custFields = [];
    let counter = 0;
    for (const customObject of customObjects) {
      this.UX.log(`Gathering (${++counter}/${customObjects.size}) ${customObject} schema...`);
      try {
        const objMeta = await SfTasks.describeObject(this.org, customObject);
        for (const field of objMeta.fields) {
          custFields.push(`${customObject}.${field.name}`);
        }
      } catch (ex) {
        this.UX.log(`Error Gathering ${customObject} schema: ${ex.message as string}`);
        notFoundInOrg.add(customObject);
      }
    }
    custFields = Utils.sortArray(custFields);
    const customFields = new Set<string>(custFields);
    // Debug
    this.UX.log(`CustomFields: ${[...custFields].join(',')}`);

    // Now get rest - and skip Objects & Fields
    const orgMetaDataMap = new Map<string, Set<string>>();
    orgMetaDataMap.set(SfPermission.customObject, customObjects);
    orgMetaDataMap.set(SfPermission.customField, customFields);

    this.UX.log(`${SfPermission.defaultPermissionMetaTypes.join(',')}`);
    for (const permissionMetaDataType of SfPermission.defaultPermissionMetaTypes) {
      switch (permissionMetaDataType) {
        case SfPermission.customObject:
        case SfPermission.customField:
          continue;
        default: {
          const nameSet = new Set<string>();
          for await (const metaData of SfTasks.listMetadata(this.org, permissionMetaDataType)) {
            if (!metaData.fullName) {
              this.UX.log(`Error No fullName field on type ${permissionMetaDataType}`);
              continue;
            }
            nameSet.add(metaData.fullName);
          }
          orgMetaDataMap.set(permissionMetaDataType, nameSet);
        }
      }
    }

    // Now run back through Permission files and determine if anything is missing in Org
    counter = 0;

    for (const sourceFilePath of sourceFilePaths) {
      const permSetErrors: string[] = [];
      const permSetStandardTabs: string[] = [];
      this.UX.log(`Verifying (${++counter}/${sourceFilePaths.size}) ${sourceFilePath} schema...`);
      const json = await Utils.readObjectFromXmlFile(sourceFilePath);
      const permSet = PermissionSet.fromJson(sourceFilePath, json);

      for (const metadataName of SfPermission.defaultPermissionMetaTypes) {
        const permCollection = permSet.getPermissionCollection(metadataName);
        if (!permCollection) {
          switch (metadataName) {
            case SfPermission.profile:
            case SfPermission.permissionSet:
              // These items are not found in the Profile or PermissionSet XML
              continue;
            default:
              permSetErrors.push(`WARNING: No Permission entries found for ${metadataName}.`);
              break;
          }
          continue;
        }
        let permSetExistingNames: string[] = [];
        switch (metadataName) {
          case SfPermission.customTab:
            if (permSet.tabVisibilities) {
              for (const [tabName, tabPerm] of permCollection) {
                if (tabPerm['isStandard']) {
                  // Standard Tabs are not exposed via the Metadata API
                  permSetStandardTabs.push(tabName);
                  gotStandardTabs = true;
                  continue;
                }
                permSetExistingNames.push(tabName);
              }
            }
            break;
          default:
            permSetExistingNames = Array.from(permCollection.keys());
            break;
        }
        for (const permSetExistingName of permSetExistingNames) {
          const orgTypeNames = orgMetaDataMap.get(metadataName);
          if (!orgTypeNames.has(permSetExistingName)) {
            if (!notFoundInOrg.has(permSetExistingName.split('.')[0])) {
              permSetErrors.push(`${permSetExistingName} NOT visible/found in Org.`);
            }
          }
        }
      }

      if (permSetStandardTabs.length > 0) {
        for (const standardTab of permSetStandardTabs) {
          permSetErrors.push(`\t${standardTab} (*)`);
        }
      }
      if (permSetErrors.length > 0) {
        this.UX.log('Warnings & Errors:');
        for (const error of permSetErrors) {
          this.UX.log(`\t\t${error}`);
        }
      }
      if (notFoundInOrg.size > 0) {
        this.UX.log('Objects Not Visible/Found:');
        for (const notFound of notFoundInOrg) {
          this.UX.log(`\t\t${notFound}`);
        }
      }

      if (flags.modify) {
        /*
        const outFilePath = this.flags.output
          ? path.join(this.flags.output, filePath)
          : filePath;

        this.UX.log(`\tUpdating: ${outFilePath}`);
        await Utils.writeObjectToXmlFile(outFilePath, newPermSet.toXmlObj());
        */
      }
    }

    if (gotStandardTabs) {
      this.UX.log('(*) WARNING: Standard Tab permissions detected.');
      this.UX.log('Salesforce does not expose Standard Tabs via the Metadata API.');
      this.UX.log(`Compatibility with '${this.orgAlias}' can only be ensured if these permissions are removed.`);
    }
    return;
  }
}
