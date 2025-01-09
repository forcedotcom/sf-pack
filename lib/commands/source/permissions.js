"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const sf_plugins_core_1 = require("@salesforce/sf-plugins-core");
const command_base_1 = require("../../helpers/command-base");
const utils_1 = require("../../helpers/utils");
const office_1 = require("../../helpers/office");
const sf_permission_1 = require("../../helpers/sf-permission");
const sf_project_1 = require("../../helpers/sf-project");
class Permissions extends command_base_1.CommandBase {
    constructor() {
        super(...arguments);
        this.defaultReportHeaderName = '_HEADERS_';
    }
    async runInternal() {
        const { flags } = await this.parse(Permissions);
        if (!flags.source) {
            flags.source = (await sf_project_1.default.default()).getDefaultDirectory();
        }
        // Are we including namespaces?
        const folders = flags.folders ? flags.folders.split(',') : Permissions.defaultMetadataFolders;
        const originalCwd = utils_1.default.setCwd(flags.source);
        const workbookMap = new Map();
        try {
            this.objectMetadata = new Map();
            this.fieldMetadata = new Map();
            this.permissions = new Map();
            for (const folder of folders) {
                this.UX.log(`Scanning metadata in: ${folder}`);
                for await (const filePath of utils_1.default.getFiles(folder)) {
                    const json = await utils_1.default.readObjectFromXmlFile(filePath);
                    if (json.CustomObject) {
                        this.processObjectMeta(filePath, json);
                    }
                    if (json.CustomField) {
                        this.processFieldMeta(filePath, json);
                    }
                    if (json.PermissionSet || json.Profile) {
                        this.processPermissionSetMeta(filePath, json);
                    }
                }
            }
            this.UX.log('Building Permissions Report');
            workbookMap.set('Objects', this.buildSheet('objectPermissions', this.objectMetadata));
            workbookMap.set('Fields', this.buildSheet('fieldPermissions', this.fieldMetadata));
            workbookMap.set('Users', this.buildSheet('userPermissions'));
            workbookMap.set('Apex Classes', this.buildSheet('classAccesses'));
            workbookMap.set('Apex Pages', this.buildSheet('pageAccesses'));
            workbookMap.set('Applications', this.buildSheet('applicationVisibilities'));
            workbookMap.set('Tabs', this.buildSheet('tabVisibilities'));
            workbookMap.set('Record Types', this.buildSheet('recordTypeVisibilities'));
        }
        finally {
            if (originalCwd !== flags.source) {
                process.chdir(originalCwd);
            }
        }
        const reportPath = path.resolve(flags.report || Permissions.defaultReportPath);
        this.UX.log(`Writing Report: ${reportPath}`);
        office_1.Office.writeXlxsWorkbook(workbookMap, reportPath);
        return;
    }
    buildSheet(permCollectionPropertyName, metadataDetails = null) {
        // Build map of metadata to permisisons
        const metaDataToPermissionsMap = new Map();
        for (const [permissionSetName, permissionSet] of this.permissions) {
            const permSetObject = permissionSet[`${permCollectionPropertyName}`] || [];
            // Add permissions for each metadata object
            for (const [apiName, perm] of permSetObject) {
                if (!metaDataToPermissionsMap.has(apiName)) {
                    // create placeholders for missing metadata
                    metaDataToPermissionsMap.set(apiName, []);
                }
                const sheetData = metaDataToPermissionsMap.get(apiName);
                sheetData.push([permissionSetName, sf_permission_1.SfPermission.getPermissionString(perm)]);
                metaDataToPermissionsMap.set(apiName, sheetData);
            }
        }
        const metaDataRows = new Map();
        const emptyMetadataRow = [];
        if (metadataDetails) {
            // Add metadata details to sheet first
            for (const [apiName, metaDataDetail] of metadataDetails) {
                const metadataData = metaDataToPermissionsMap.get(apiName);
                if (!metadataData) {
                    continue;
                }
                const metadataArray = [];
                for (const [key, value] of Object.entries(metaDataDetail)) {
                    metadataArray.push([key, value]);
                }
                metaDataRows.set(apiName, metadataArray);
                if (emptyMetadataRow.length === 0) {
                    for (const entry of metadataArray) {
                        emptyMetadataRow.push([entry[0], '']);
                    }
                }
            }
        }
        const workbookSheet = [];
        const columns = ['API Name'];
        const typeRow = ['Type'];
        for (const entry of emptyMetadataRow) {
            columns.push(entry[0]);
            typeRow.push('');
        }
        for (const [permName, permSet] of this.permissions) {
            columns.push(permName);
            typeRow.push(permSet.isProfile ? 'Profile' : 'Permission Set');
        }
        // First row is just columns
        workbookSheet.push(columns);
        workbookSheet.push(typeRow);
        const rows = [columns[0], typeRow[0]];
        // Pre-populate rows with API Names
        for (const metadataName of metaDataToPermissionsMap.keys()) {
            // Init array to hold all columns
            const row = new Array(columns.length);
            // set metadata name as first column value
            row[0] = metadataName;
            const metadataValues = metaDataRows.get(metadataName) || emptyMetadataRow;
            for (let index = 0; index < metadataValues.length; index++) {
                row[index + 1] = metadataValues[index][1];
            }
            // Add row
            workbookSheet.push(row);
            // Store metadata name for lookup later
            rows.push(metadataName);
        }
        // We now have a matrix that we can begine to populate
        for (const [apiName, permDatas] of metaDataToPermissionsMap) {
            // Add one to row index to account for header row
            const rowIndex = rows.indexOf(apiName);
            // Compare to zero NOT -1 since we added one above....
            if (rowIndex === 0) {
                this.raiseError(`Unable to find apiName:'${apiName}' in row collection`);
            }
            for (const permData of permDatas) {
                // Add one to col index to account for header row
                const colIndex = columns.indexOf(permData[0]);
                // Compare to zero NOT -1 since we added one above....
                if (colIndex === 0) {
                    this.raiseError(`Unable to find name:'${permData[0]}' in header collection`);
                }
                // Add data to matrix
                workbookSheet[rowIndex][colIndex] = permData[1];
            }
        }
        return workbookSheet;
    }
    getObjectDetails(name) {
        return this.objectMetadata.get(name) || new sf_permission_1.ObjectDetail();
    }
    getFieldDetails(name) {
        return this.fieldMetadata.get(name) || new sf_permission_1.FieldDetail();
    }
    processObjectMeta(filePath, json) {
        const objectDetail = sf_permission_1.ObjectDetail.fromJson(filePath, json);
        this.objectMetadata.set(objectDetail.name, objectDetail);
    }
    processFieldMeta(filePath, json) {
        const fieldDetail = sf_permission_1.FieldDetail.fromJson(filePath, json);
        this.fieldMetadata.set(fieldDetail.name, fieldDetail);
    }
    processPermissionSetMeta(filePath, json) {
        const permSet = sf_permission_1.PermissionSet.fromJson(filePath, json);
        this.permissions.set(permSet.name, permSet);
    }
}
Permissions.defaultReportPath = 'PermissionsReport.xlsx';
// Order Matters here!
Permissions.defaultMetadataFolders = [
    '**/objects/*/*.object-meta.xml',
    '**/objects/*/fields/*.field-meta.xml',
    '**/permissionsets/*.permissionset-meta.xml',
    '**/profiles/*.profile-meta.xml',
];
Permissions.description = command_base_1.CommandBase.messages.getMessage('source.permissions.commandDescription');
Permissions.examples = [
    `$ sf source permissions -u myOrgAlias
    Reads security information from source-formatted configuration files (${Permissions.defaultMetadataFolders.join(', ')}) located in default project source location and writes the '${Permissions.defaultReportPath}' report file.`,
];
Permissions.flags = {
    source: sf_plugins_core_1.Flags.directory({
        char: 'p',
        description: command_base_1.CommandBase.messages.getMessage('source.permissions.sourceFlagDescription'),
        required: false,
    }),
    report: sf_plugins_core_1.Flags.file({
        char: 'r',
        description: command_base_1.CommandBase.messages.getMessage('source.permissions.reportFlagDescription', [
            Permissions.defaultReportPath,
        ]),
        required: false,
    }),
    folders: sf_plugins_core_1.Flags.string({
        char: 'f',
        description: command_base_1.CommandBase.messages.getMessage('source.permissions.metadataFoldersFlagDescription', [
            Permissions.defaultMetadataFolders.join(', '),
        ]),
        required: false,
    }),
};
exports.default = Permissions;
//# sourceMappingURL=permissions.js.map