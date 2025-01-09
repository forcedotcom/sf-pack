"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const sf_plugins_core_1 = require("@salesforce/sf-plugins-core");
const command_base_1 = require("../../helpers/command-base");
const sf_tasks_1 = require("../../helpers/sf-tasks");
const sf_permission_1 = require("../../helpers/sf-permission");
const sf_core_1 = require("../../helpers/sf-core");
const utils_1 = require("../../helpers/utils");
class Permissions extends command_base_1.CommandBase {
    async runInternal() {
        const { flags } = await this.parse(Permissions);
        // Gather metadata names to include
        const metaNames = utils_1.default.sortArray(flags.metadata ? flags.metadata.split(',') : sf_permission_1.SfPermission.defaultPermissionMetaTypes);
        this.metaNames = new Set(metaNames);
        // Are we including namespaces?
        this.namespaces = flags.namespaces ? new Set(flags.namespaces.split(',')) : new Set();
        this.packageFileName = flags.package || Permissions.packageFileName;
        const packageDir = path.dirname(this.packageFileName);
        if (packageDir && !(await utils_1.default.pathExists(packageDir))) {
            this.raiseError(`The specified package folder does not exist: '${packageDir}'`);
        }
        this.UX.log(`Gathering metadata from Org: ${this.orgAlias}(${this.orgId})`);
        const describeMetadata = await sf_tasks_1.SfTasks.describeMetadata(this.org);
        const describeMetadatas = new Set();
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
        const metadataMap = new Map();
        let counter = 0;
        for await (const entry of sf_tasks_1.SfTasks.getTypesForPackage(this.org, describeMetadatas, this.namespaces)) {
            metadataMap.set(entry.name, entry.members);
            this.UX.log(`Processed (${++counter}/${describeMetadatas.size}): ${entry.name}`);
        }
        // Write the final package
        await sf_core_1.SfCore.writePackageFile(metadataMap, this.packageFileName);
        return;
    }
}
Permissions.packageFileName = 'package-permissions.xml';
Permissions.description = command_base_1.CommandBase.messages.getMessage('package.permissions.commandDescription');
Permissions.examples = [
    `$ sf package permissions -u myOrgAlias
    Creates a package file (${Permissions.packageFileName}) which contains
    Profile & PermissionSet metadata related to ${sf_permission_1.SfPermission.defaultPermissionMetaTypes.join(', ')} permissions.`,
    `$ sf package permissions -u myOrgAlias -m CustomObject,CustomApplication
    Creates a package file (${Permissions.packageFileName}) which contains
    Profile & PermissionSet metadata related to CustomObject & CustomApplication permissions.`,
];
Permissions.flags = {
    package: sf_plugins_core_1.Flags.string({
        char: 'x',
        description: command_base_1.CommandBase.messages.getMessage('package.permissions.packageFlagDescription', [
            Permissions.packageFileName,
        ]),
    }),
    metadata: sf_plugins_core_1.Flags.string({
        char: 'm',
        description: command_base_1.CommandBase.messages.getMessage('package.permissions.metadataFlagDescription', [
            sf_permission_1.SfPermission.defaultPermissionMetaTypes.join(', '),
        ]),
    }),
    namespaces: sf_plugins_core_1.Flags.string({
        char: 'n',
        description: command_base_1.CommandBase.messages.getMessage('namespacesFlagDescription'),
    }),
    ...command_base_1.CommandBase.commonFlags,
};
exports.default = Permissions;
//# sourceMappingURL=permissions.js.map