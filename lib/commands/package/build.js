"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const sf_plugins_core_1 = require("@salesforce/sf-plugins-core");
const command_base_1 = require("../../helpers/command-base");
const sf_core_1 = require("../../helpers/sf-core");
const utils_1 = require("../../helpers/utils");
const package_options_1 = require("../../helpers/package-options");
const sf_tasks_1 = require("../../helpers/sf-tasks");
const options_factory_1 = require("../../helpers/options-factory");
const constants_1 = require("../../helpers/constants");
const delta_provider_1 = require("../../helpers/delta-provider");
const delta_command_1 = require("../../helpers/delta-command");
const schema_utils_1 = require("../../helpers/schema-utils");
const sf_ui_1 = require("../../helpers/sf-ui");
class Build extends command_base_1.CommandBase {
    // Comment this out if your command does not require an org username
    // protected static requiresUsername = true;
    // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
    // protected static requiresProject = false;
    // eslint-disable-next-line complexity
    async getMetadataMapFromOrg(options, flags) {
        const metadataMap = new Map();
        const excluded = new Set(options.excludeMetadataTypes);
        let filterMetadataTypes = null;
        if (flags.metadata) {
            filterMetadataTypes = new Set();
            for (const metaName of flags.metadata.split(',')) {
                filterMetadataTypes.add(metaName.trim());
            }
        }
        if (flags.source) {
            this.warn('Source Tracking packages are not longer supported with sf commands');
            this.warn('USE: project retrieve start');
            return;
            /*
            const statuses = await SfTasks.getSourceTrackingStatus(this.orgAlias);
            if (!statuses || statuses.length === 0) {
              this.log('No Source Tracking changes found.');
              return;
            }
            const results = SfTasks.getMapFromSourceTrackingStatus(statuses);
            if (results.conflicts.size > 0) {
              this.log('WARNING: The following conflicts were found:');
              for (const [conflictType, members] of results.conflicts) {
                this.log(`\t${conflictType as string}`);
                for (const member of members) {
                  this.log(`\t\t${member as string}`);
                }
              }
              throw new Error('All Conflicts must be resolved.');
            }
            if (results.deletes.size > 0) {
              this.log('WARNING: The following deleted items need to be handled manually:');
              for (const [deleteType, members] of results.deletes) {
                this.log(`\t${deleteType as string}`);
                for (const member of members) {
                  this.log(`\t\t${member as string}`);
                }
              }
            }
            if (!results.map?.size) {
              this.log('No Deployable Source Tracking changes found.');
              return;
            }
            for (const [name, members] of results.map) {
              const typeName: string = name;
              if ((filterMetadataTypes && !filterMetadataTypes.has(typeName)) || excluded.has(typeName)) {
                continue;
              }
              metadataMap.set(typeName, members as string[]);
            }
            */
        }
        else {
            const describeMetadata = await sf_tasks_1.SfTasks.describeMetadata(this.org);
            const describeMetadatas = new Set();
            for (const md of describeMetadata) {
                const xmlName = md.xmlName;
                if ((filterMetadataTypes && !filterMetadataTypes.has(xmlName)) || excluded.has(xmlName)) {
                    continue;
                }
                describeMetadatas.add(md);
            }
            // Are we including namespaces?
            const namespaces = flags.namespace ? new Set(flags.namespace.split(',')) : new Set();
            let counter = 0;
            sf_ui_1.SfUI.writeMessageCallback = (message) => {
                this.log(`Processing (${++counter}/${describeMetadatas.size}): ${message}`);
            };
            for await (const entry of sf_tasks_1.SfTasks.getTypesForPackage(this.org, describeMetadatas, namespaces)) {
                // If specific members were defined previously - just use them
                const name = entry.name;
                metadataMap.set(name, entry.members);
                // this.log(`Processed (${++counter}/${describeMetadatas.size}): ${name}`);
            }
        }
        return metadataMap;
    }
    async getMetadataMapFromFolder(folder, options) {
        const metadataMap = new Map();
        const excluded = new Set(options.excludeMetadataTypes);
        if (!excluded) {
            return;
        }
        if (!(await utils_1.default.pathExists(folder))) {
            throw new Error(`The specified MDAPI folder does not exist: ${folder}`);
        }
        // Get all the folders from the root of the MDAPI folder
        for await (const folderPath of utils_1.default.getFolders(folder, false)) {
            const packageType = options.mdapiMap.get(path.basename(folderPath));
            if (!packageType) {
                continue;
            }
            const members = [];
            for await (const memberFile of this.getMDAPIFiles(packageType, folderPath, false)) {
                members.push(memberFile.replace(folderPath + path.sep, ''));
            }
            metadataMap.set(packageType, members);
        }
        return metadataMap;
    }
    async *getMDAPIFiles(xmlName, folder, isDocument = false) {
        for await (const filePath of utils_1.default.getItems(folder, utils_1.IOItem.Both, false)) {
            if (filePath.endsWith(constants_1.default.METADATA_FILE_SUFFIX)) {
                continue;
            }
            const itemName = path.basename(filePath);
            const isDir = await utils_1.default.getPathKind(filePath) === utils_1.IOItem.Folder;
            if (itemName !== 'unfiled$public') {
                if (isDocument) {
                    yield itemName;
                }
                else if (!isDir) {
                    yield schema_utils_1.default.getMetadataBaseName(itemName);
                }
            }
            // if not os.path.isdir(filePath) and xmlName in INST_PKG_REF_METADATA:
            // Common.removeInstPkgReference(filePath, Common.canRemoveAllPackageReferences(xmlName))
            if (isDir) {
                const fullCopyPath = delta_provider_1.DeltaProvider.getFullCopyPath(filePath, delta_command_1.DeltaCommandBase.defaultCopyDirList);
                if (fullCopyPath) {
                    yield itemName;
                }
                else {
                    for await (const subFilePath of this.getMDAPIFiles(xmlName, filePath, xmlName === 'Document')) {
                        yield path.join(filePath, subFilePath);
                    }
                }
            }
        }
    }
    async runInternal() {
        const { flags } = await this.parse(Build);
        // Validate the package path
        const packageFileName = flags.package || constants_1.default.DEFAULT_PACKAGE_PATH;
        const packageDir = path.dirname(flags.folder ? flags.folder : packageFileName);
        if (packageDir && !(await utils_1.default.pathExists(packageDir))) {
            this.raiseError(`The specified package folder does not exist: '${packageDir}'`);
        }
        let options;
        // Read/Write the options file if it does not exist already
        if (flags.options) {
            const optionsPath = flags.options;
            options = await options_factory_1.OptionsFactory.get(package_options_1.PackageOptions, optionsPath);
            if (!options) {
                this.raiseError(`Unable to read options file: ${optionsPath}.`);
            }
        }
        else {
            options = new package_options_1.PackageOptions();
            await options.loadDefaults();
        }
        let metadataMap = null;
        try {
            if (flags.folder) {
                this.info(`Gathering metadata from folder: ${flags.folder})`);
                metadataMap = await this.getMetadataMapFromFolder(flags.folder, options);
            }
            else {
                this.info(`Gathering metadata from Org: ${this.orgAlias}(${this.orgId})`);
                metadataMap = await this.getMetadataMapFromOrg(options, flags);
            }
        }
        catch (err) {
            this.raiseError(err.message);
        }
        const packageMap = new Map();
        const excluded = new Set(options.excludeMetadataTypes);
        // Filter excluded types
        for (const [name, mems] of metadataMap) {
            const typeName = name;
            if (!excluded.has(typeName)) {
                const members = mems;
                utils_1.default.sortArray(members);
                packageMap.set(typeName, members);
            }
        }
        this.info(`Generating: ${packageFileName}`);
        // Write the final package
        await sf_core_1.SfCore.writePackageFile(packageMap, packageFileName, flags.append);
        return;
    }
}
Build.description = command_base_1.CommandBase.messages.getMessage('package.build.commandDescription');
Build.examples = [
    `$ sf package build -o options/package-options.json -x manifest/package-acu.xml -u myOrgAlias
    Builds a SF package file (./manifest/package.xml) which contains all the metadata from the myOrgAlias.
    The options defined (options/package-options.json) are honored when building the package.`,
    `$ sf package build -f deploy
    Builds a SF package file (./manifest/package.xml) from the MDAPI formatted data in the deploy folder .`,
];
Build.flags = {
    package: sf_plugins_core_1.Flags.string({
        char: 'x',
        description: command_base_1.CommandBase.messages.getMessage('package.build.packageFlagDescription', [
            constants_1.default.DEFAULT_PACKAGE_NAME,
        ]),
    }),
    metadata: sf_plugins_core_1.Flags.string({
        char: 'm',
        description: command_base_1.CommandBase.messages.getMessage('package.build.metadataFlagDescription'),
    }),
    options: sf_plugins_core_1.Flags.string({
        char: 'o',
        description: command_base_1.CommandBase.messages.getMessage('package.build.optionsFlagDescription'),
    }),
    namespaces: sf_plugins_core_1.Flags.string({
        char: 'n',
        description: command_base_1.CommandBase.messages.getMessage('namespacesFlagDescription'),
    }),
    folder: sf_plugins_core_1.Flags.string({
        char: 'f',
        description: command_base_1.CommandBase.messages.getMessage('package.build.mdapiFolderFlagDescription'),
    }),
    append: sf_plugins_core_1.Flags.boolean({
        char: 'a',
        description: command_base_1.CommandBase.messages.getMessage('package.build.appendFlagDescription'),
    }),
    ...command_base_1.CommandBase.commonFlags,
};
exports.default = Build;
//# sourceMappingURL=build.js.map