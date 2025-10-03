import path from 'node:path';
import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from '../../helpers/command-base.js';
import { SfCore } from '../../helpers/sf-core.js';
import Utils, { IOItem } from '../../helpers/utils.js';
import { PackageOptions } from '../../helpers/package-options.js';
import { SfTasks } from '../../helpers/sf-tasks.js';
import { OptionsFactory } from '../../helpers/options-factory.js';
import Constants from '../../helpers/constants.js';
import { DeltaProvider } from '../../helpers/delta-provider.js';
import SchemaUtils from '../../helpers/schema-utils.js';
import { SfUI } from '../../helpers/sf-ui.js';

export default class Build extends CommandBase {
  public static description = CommandBase.messages.getMessage('package.build.commandDescription');

  public static examples = [
    `$ sf package build -o options/package-options.json -x manifest/package-acu.xml -u myOrgAlias
    Builds a SF package file (./manifest/package.xml) which contains all the metadata from the myOrgAlias.
    The options defined (options/package-options.json) are honored when building the package.`,
    `$ sf package build -f deploy
    Builds a SF package file (./manifest/package.xml) from the MDAPI formatted data in the deploy folder .`,
  ];

  public static readonly flags = {
    package: Flags.string({
      char: 'x',
      description: CommandBase.messages.getMessage('package.build.packageFlagDescription', [
        Constants.DEFAULT_PACKAGE_NAME,
      ]),
    }),
    metadata: Flags.string({
      char: 'm',
      description: CommandBase.messages.getMessage('package.build.metadataFlagDescription'),
    }),
    options: Flags.string({
      char: 'o',
      description: CommandBase.messages.getMessage('package.build.optionsFlagDescription'),
    }),
    namespaces: Flags.string({
      char: 'n',
      description: CommandBase.messages.getMessage('namespacesFlagDescription'),
    }),
    folder: Flags.string({
      char: 'f',
      description: CommandBase.messages.getMessage('package.build.mdapiFolderFlagDescription'),
    }),
    append: Flags.boolean({
      char: 'a',
      description: CommandBase.messages.getMessage('package.build.appendFlagDescription'),
    }),
    ...CommandBase.commonFlags,
    ...CommandBase.flags,
  };

  // Comment this out if your command does not require an org username
  // protected static requiresUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  // protected static requiresProject = false;

  // eslint-disable-next-line complexity
  protected async getMetadataMapFromOrg(options: PackageOptions, flags: any): Promise<Map<string, string[]>> {
    const metadataMap = new Map<string, string[]>();
    const excluded = new Set<string>(options.excludeMetadataTypes);

    let filterMetadataTypes: Set<string> = null;
    if (flags.metadata) {
      filterMetadataTypes = new Set<string>();
      for (const metaName of (flags.metadata as string).split(',')) {
        filterMetadataTypes.add(metaName.trim());
      }
    }

    if (flags.source) {
      this.warn('Source Tracking packages are not longer supported with sf commands');
      this.warn('USE: project retrieve start');
      return;
    } else {
      const describeMetadata = await SfTasks.describeMetadata(this.org);
      const describeMetadatas = new Set<any>();
      for (const md of describeMetadata) {
        const xmlName: string = md.xmlName;
        if ((filterMetadataTypes && !filterMetadataTypes.has(xmlName)) || excluded.has(xmlName)) {
          continue;
        }
        describeMetadatas.add(md);
      }

      // Are we including namespaces?
      const namespaces = flags.namespace ? new Set<string>((flags.namespace as string).split(',')) : new Set<string>();

      let counter = 0;
      SfUI.writeMessageCallback = (message: string): void => {
        this.log(`Processing (${++counter}/${describeMetadatas.size}): ${message}`);
      };

      for await (const entry of SfTasks.getTypesForPackage(this.org, describeMetadatas, namespaces)) {
        // If specific members were defined previously - just use them
        const name: string = entry.name;
        metadataMap.set(name, entry.members as string[]);
        // this.log(`Processed (${++counter}/${describeMetadatas.size}): ${name}`);
      }
    }
    return metadataMap;
  }

  protected async getMetadataMapFromFolder(folder: string, options: PackageOptions): Promise<Map<string, string[]>> {
    const metadataMap = new Map<string, string[]>();

    const excluded = new Set<string>(options.excludeMetadataTypes);
    if (!excluded) {
      return;
    }
    if (!(await Utils.pathExists(folder))) {
      throw new Error(`The specified MDAPI folder does not exist: ${folder}`);
    }
    // Get all the folders from the root of the MDAPI folder
    for await (const folderPath of Utils.getFolders(folder, false)) {
      const packageType = options.mdapiMap.get(path.basename(folderPath));
      if (!packageType) {
        continue;
      }
      const members: string[] = [];
      for await (const memberFile of this.getMDAPIFiles(packageType, folderPath, false)) {
        members.push(memberFile.replace(folderPath + path.sep, ''));
      }
      metadataMap.set(packageType, members);
    }
    return metadataMap;
  }

  protected async *getMDAPIFiles(
    xmlName: string,
    folder: string,
    isDocument = false
  ): AsyncGenerator<string, void, void> {
    for await (const filePath of Utils.getItems(folder, IOItem.Both, false)) {
      if (filePath.endsWith(Constants.METADATA_FILE_SUFFIX)) {
        continue;
      }
      const itemName = path.basename(filePath);
      const isDir = (await Utils.getPathKind(filePath)) === IOItem.Folder;
      if (itemName !== 'unfiled$public') {
        if (isDocument) {
          yield itemName;
        } else if (!isDir) {
          yield SchemaUtils.getMetadataBaseName(itemName);
        }
      }
      // if not os.path.isdir(filePath) and xmlName in INST_PKG_REF_METADATA:
      // Common.removeInstPkgReference(filePath, Common.canRemoveAllPackageReferences(xmlName))
      if (isDir) {
        const fullCopyPath = DeltaProvider.getFullCopyPath(filePath, Constants.DEFAULT_COPY_DIR_LIST);
        if (fullCopyPath) {
          yield itemName;
        } else {
          for await (const subFilePath of this.getMDAPIFiles(xmlName, filePath, xmlName === 'Document')) {
            yield path.join(filePath, subFilePath);
          }
        }
      }
    }
  }

  protected async runInternal(): Promise<void> {
    const { flags } = await this.parse(Build);
    // Validate the package path
    const packageFileName: string = flags.package || Constants.DEFAULT_PACKAGE_PATH;
    const folder: string = flags.folder as string;

    const packageDir: string = path.dirname(folder ? folder : packageFileName);

    if (packageDir && !(await Utils.pathExists(packageDir))) {
      this.raiseError(`The specified package folder does not exist: '${packageDir}'`);
    }

    let options: PackageOptions;
    // Read/Write the options file if it does not exist already
    if (flags.options) {
      const optionsPath: string = flags.options;
      options = await OptionsFactory.get(PackageOptions, optionsPath);
      if (!options) {
        this.raiseError(`Unable to read options file: ${optionsPath}.`);
      }
    } else {
      options = new PackageOptions();
      await options.loadDefaults();
    }

    let metadataMap = null;
    try {
      if (folder) {
        this.info(`Gathering metadata from folder: ${folder})`);
        metadataMap = await this.getMetadataMapFromFolder(folder, options);
      } else {
        this.info(`Gathering metadata from Org: ${this.orgAlias}(${this.orgId})`);
        metadataMap = await this.getMetadataMapFromOrg(options, flags);
      }
    } catch (err) {
      this.raiseError(err.message as string);
    }

    const packageMap = new Map<string, string[]>();
    const excluded = new Set<string>(options.excludeMetadataTypes);

    // Filter excluded types
    for (const [name, mems] of metadataMap) {
      const typeName: string = name;
      if (!excluded.has(typeName)) {
        const members: string[] = mems;
        Utils.sortArray(members);
        packageMap.set(typeName, members);
      }
    }

    this.info(`Generating: ${packageFileName}`);
    // Write the final package
    await SfCore.writePackageFile(packageMap, packageFileName, flags.append as boolean);
    return;
  }
}
