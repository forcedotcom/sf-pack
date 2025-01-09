"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sf_plugins_core_1 = require("@salesforce/sf-plugins-core");
const command_base_1 = require("../../helpers/command-base");
const sf_tasks_1 = require("../../helpers/sf-tasks");
const utils_1 = require("../../helpers/utils");
const sf_permission_1 = require("../../helpers/sf-permission");
class Profile extends command_base_1.CommandBase {
    async runInternal() {
        const { flags } = await this.parse(Profile);
        const sourceFolders = !flags.source ? Profile.defaultPermissionsGlobs : flags.source.split(',');
        this.permissions = new Map();
        let gotStandardTabs = false;
        const sourceFilePaths = new Set();
        const custObjs = [];
        for (const sourceFolder of sourceFolders) {
            if (!sourceFolder) {
                continue;
            }
            this.UX.log(`Reading metadata in: ${sourceFolder}`);
            for await (const filePath of utils_1.default.getFiles(sourceFolder.trim())) {
                this.UX.log(`\tProcessing: ${filePath}`);
                const json = await utils_1.default.readObjectFromXmlFile(filePath);
                if (!json.PermissionSet && !json.Profile) {
                    this.UX.log(`\tUnable to process file: ${filePath}`);
                    continue;
                }
                // Read all the CustomObject typenames PermissionSet from and add to the customObjects Set
                const permSet = sf_permission_1.PermissionSet.fromJson(filePath, json);
                custObjs.push(...Array.from(permSet.getPermissionCollection(sf_permission_1.SfPermission.customObject).keys()));
                // Add to collection for update later
                sourceFilePaths.add(filePath);
            }
        }
        // Debug
        const customObjects = new Set(utils_1.default.sortArray(custObjs));
        this.UX.log(`CustomObjects: ${[...customObjects].join(',')}`);
        // Get Objects and fields first
        const notFoundInOrg = new Set();
        let custFields = [];
        let counter = 0;
        for (const customObject of customObjects) {
            this.UX.log(`Gathering (${++counter}/${customObjects.size}) ${customObject} schema...`);
            try {
                const objMeta = await sf_tasks_1.SfTasks.describeObject(this.org, customObject);
                for (const field of objMeta.fields) {
                    custFields.push(`${customObject}.${field.name}`);
                }
            }
            catch (ex) {
                this.UX.log(`Error Gathering ${customObject} schema: ${ex.message}`);
                notFoundInOrg.add(customObject);
            }
        }
        custFields = utils_1.default.sortArray(custFields);
        const customFields = new Set(custFields);
        // Debug
        this.UX.log(`CustomFields: ${[...custFields].join(',')}`);
        // Now get rest - and skip Objects & Fields
        const orgMetaDataMap = new Map();
        orgMetaDataMap.set(sf_permission_1.SfPermission.customObject, customObjects);
        orgMetaDataMap.set(sf_permission_1.SfPermission.customField, customFields);
        this.UX.log(`${sf_permission_1.SfPermission.defaultPermissionMetaTypes.join(',')}`);
        for (const permissionMetaDataType of sf_permission_1.SfPermission.defaultPermissionMetaTypes) {
            switch (permissionMetaDataType) {
                case sf_permission_1.SfPermission.customObject:
                case sf_permission_1.SfPermission.customField:
                    continue;
                default: {
                    const nameSet = new Set();
                    for await (const metaData of sf_tasks_1.SfTasks.listMetadata(this.org, permissionMetaDataType)) {
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
            const permSetErrors = [];
            const permSetStandardTabs = [];
            this.UX.log(`Verifying (${++counter}/${sourceFilePaths.size}) ${sourceFilePath} schema...`);
            const json = await utils_1.default.readObjectFromXmlFile(sourceFilePath);
            const permSet = sf_permission_1.PermissionSet.fromJson(sourceFilePath, json);
            for (const metadataName of sf_permission_1.SfPermission.defaultPermissionMetaTypes) {
                const permCollection = permSet.getPermissionCollection(metadataName);
                if (!permCollection) {
                    switch (metadataName) {
                        case sf_permission_1.SfPermission.profile:
                        case sf_permission_1.SfPermission.permissionSet:
                            // These items are not found in the Profile or PermissionSet XML
                            continue;
                        default:
                            permSetErrors.push(`WARNING: No Permission entries found for ${metadataName}.`);
                            break;
                    }
                    continue;
                }
                let permSetExistingNames = [];
                switch (metadataName) {
                    case sf_permission_1.SfPermission.customTab:
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
Profile.defaultSourceFolder = null;
Profile.defaultPermissionsGlobs = [
    '**/profiles/*.profile-meta.xml',
    '**/permissionsets/*.permissionset-meta.xml',
];
Profile.description = command_base_1.CommandBase.messages.getMessage('source.profile.commandDescription');
Profile.examples = [
    `$ sf source profile -u myOrgAlias
    Compares the profile metadata files in ${Profile.defaultPermissionsGlobs.join(',')} to the specified Org to determine deployment compatibility.`,
    `$ sf source profile -m true -u myOrgAlias
    Compares the profile metadata files in ${Profile.defaultPermissionsGlobs.join(',')} to the specified Org to and updates the metadata files to ensure deployment compatibility.`,
];
Profile.flags = {
    source: sf_plugins_core_1.Flags.directory({
        char: 'p',
        description: command_base_1.CommandBase.messages.getMessage('source.profile.profilePathFlagDescription', [
            Profile.defaultPermissionsGlobs.join(','),
        ]),
        required: false,
    }),
    modify: sf_plugins_core_1.Flags.boolean({
        char: 'm',
        description: command_base_1.CommandBase.messages.getMessage('source.profile.modifyFlagDescription'),
        required: false,
    }),
    output: sf_plugins_core_1.Flags.directory({
        char: 'o',
        description: command_base_1.CommandBase.messages.getMessage('source.profile.outputFoldersFlagDescription'),
        required: false,
    }),
};
exports.default = Profile;
//# sourceMappingURL=profile.js.map