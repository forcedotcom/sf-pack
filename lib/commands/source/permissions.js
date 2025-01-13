import path from 'node:path';
import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from '../../helpers/command-base.js';
import Utils from '../../helpers/utils.js';
import { Office } from '../../helpers/office.js';
import { SfPermission, ObjectDetail, FieldDetail, PermissionSet, } from '../../helpers/sf-permission.js';
import SfProject from '../../helpers/sf-project.js';
export default class Permissions extends CommandBase {
    static defaultReportPath = 'PermissionsReport.xlsx';
    // Order Matters here!
    static defaultMetadataFolders = [
        '**/objects/*/*.object-meta.xml',
        '**/objects/*/fields/*.field-meta.xml',
        '**/permissionsets/*.permissionset-meta.xml',
        '**/profiles/*.profile-meta.xml',
    ];
    static description = CommandBase.messages.getMessage('source.permissions.commandDescription');
    static examples = [
        `$ sf source permissions -u myOrgAlias
    Reads security information from source-formatted configuration files (${Permissions.defaultMetadataFolders.join(', ')}) located in default project source location and writes the '${Permissions.defaultReportPath}' report file.`,
    ];
    static flags = {
        source: Flags.directory({
            char: 'p',
            description: CommandBase.messages.getMessage('source.permissions.sourceFlagDescription'),
            required: false,
        }),
        report: Flags.file({
            char: 'r',
            description: CommandBase.messages.getMessage('source.permissions.reportFlagDescription', [
                Permissions.defaultReportPath,
            ]),
            required: false,
        }),
        folders: Flags.string({
            char: 'f',
            description: CommandBase.messages.getMessage('source.permissions.metadataFoldersFlagDescription', [
                Permissions.defaultMetadataFolders.join(', '),
            ]),
            required: false,
        }),
        ...CommandBase.commonFlags,
        ...CommandBase.flags,
    };
    defaultReportHeaderName = '_HEADERS_';
    objectMetadata;
    fieldMetadata;
    permissions;
    reportHeaders;
    async runInternal() {
        const { flags } = await this.parse(Permissions);
        if (!flags.source) {
            flags.source = (await SfProject.default()).getDefaultDirectory();
        }
        // Are we including namespaces?
        const folders = flags.folders ? flags.folders.split(',') : Permissions.defaultMetadataFolders;
        const originalCwd = Utils.setCwd(flags.source);
        const workbookMap = new Map();
        try {
            this.objectMetadata = new Map();
            this.fieldMetadata = new Map();
            this.permissions = new Map();
            for (const folder of folders) {
                this.UX.log(`Scanning metadata in: ${folder}`);
                for await (const filePath of Utils.getFiles(folder)) {
                    const json = await Utils.readObjectFromXmlFile(filePath);
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
        Office.writeXlxsWorkbook(workbookMap, reportPath);
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
                sheetData.push([permissionSetName, SfPermission.getPermissionString(perm)]);
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
        return this.objectMetadata.get(name) || new ObjectDetail();
    }
    getFieldDetails(name) {
        return this.fieldMetadata.get(name) || new FieldDetail();
    }
    processObjectMeta(filePath, json) {
        const objectDetail = ObjectDetail.fromJson(filePath, json);
        this.objectMetadata.set(objectDetail.name, objectDetail);
    }
    processFieldMeta(filePath, json) {
        const fieldDetail = FieldDetail.fromJson(filePath, json);
        this.fieldMetadata.set(fieldDetail.name, fieldDetail);
    }
    processPermissionSetMeta(filePath, json) {
        const permSet = PermissionSet.fromJson(filePath, json);
        this.permissions.set(permSet.name, permSet);
    }
}
//# sourceMappingURL=permissions.js.map