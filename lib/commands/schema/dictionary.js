"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const path = require("path");
const sf_plugins_core_1 = require("@salesforce/sf-plugins-core");
const command_base_1 = require("../../helpers/command-base");
const sf_tasks_1 = require("../../helpers/sf-tasks");
const utils_1 = require("../../helpers/utils");
const options_factory_1 = require("../../helpers/options-factory");
const office_1 = require("../../helpers/office");
const schema_utils_1 = require("../../helpers/schema-utils");
const schema_options_1 = require("../../helpers/schema-options");
const sf_query_1 = require("../../helpers/sf-query");
const constants_1 = require("../../helpers/constants");
class Dictionary extends command_base_1.CommandBase {
    async runInternal() {
        const { flags } = await this.parse(Dictionary);
        // Read/Write the options file if it does not exist already
        this.options = await options_factory_1.OptionsFactory.get(schema_options_1.default, flags.options);
        if (flags.tmpFile) {
            this.UX.log(`Writing Xlsx file from tmp file ${flags.tmpFile}...`);
            await this.writeDictionary(flags.tmpFile, flags.report);
            return;
        }
        const schemaTmpFile = `schema-${this.orgAlias}.tmp`;
        const sortedTypeNames = await this.getSortedTypeNames(flags.namespaces);
        // sortedTypeNames = ['Account', 'Case', 'Lead'];
        // Create for writing - truncates if exists
        const fileStream = (0, node_fs_1.createWriteStream)(schemaTmpFile, { flags: 'w' });
        let counter = 0;
        const schemas = new Set();
        const validationRuleName = 'validationRules';
        for (const metaDataType of sortedTypeNames) {
            this.UX.log(`Gathering (${++counter}/${sortedTypeNames.length}) ${metaDataType} schema...`);
            try {
                const schema = await sf_tasks_1.SfTasks.describeObject(this.org, metaDataType);
                // Avoid duplicates (Account)
                if (schemas.has(schema.name)) {
                    continue;
                }
                for (const name of this.options.outputDefMap.keys()) {
                    // These are addressed later
                    if (name === validationRuleName) {
                        continue;
                    }
                    fileStream.write(`*${name}${constants_1.default.EOL}`);
                    const collection = schema[name];
                    if (!collection) {
                        continue;
                    }
                    let nameFieldIndex = -1;
                    // Query for Entity & Field Definition
                    const entityDefinitionFields = this.options.getEntityDefinitionFields(name);
                    const outputDefs = this.options.outputDefMap.get(name);
                    if (entityDefinitionFields.length > 0) {
                        for (let index = 0; index < outputDefs.length; index++) {
                            const outputDef = outputDefs[index];
                            if (outputDef.includes(`|${schema_utils_1.default.CONTEXT_FIELD_NAME}`)) {
                                nameFieldIndex = index;
                                break;
                            }
                        }
                        if (nameFieldIndex === -1) {
                            this.raiseError('No Name field found');
                        }
                    }
                    const fieldDefinitionMap = await this.entityDefinitionValues(metaDataType, entityDefinitionFields);
                    const dynamicCode = this.options.getDynamicCode(name);
                    const schemaRows = new Map();
                    for await (const row of schema_utils_1.default.getDynamicSchemaData(schema, dynamicCode, collection)) {
                        if (row.length === 0) {
                            continue;
                        }
                        schemaRows.set(row[nameFieldIndex], row);
                    }
                    for (const fieldName of fieldDefinitionMap.keys()) {
                        const row = schemaRows.get(fieldName);
                        if (!row || row.length === 0) {
                            continue;
                        }
                        const fieldDefinitionRecord = fieldDefinitionMap.get(fieldName);
                        if (fieldDefinitionRecord != null && outputDefs) {
                            for (let index = 0; index < outputDefs.length; index++) {
                                const outputDef = outputDefs[index];
                                for (const entityDefinitionField of entityDefinitionFields) {
                                    if (outputDef.includes(`|${schema_utils_1.default.ENTITY_DEFINITION}.${entityDefinitionField}`)) {
                                        row[index] = fieldDefinitionRecord[entityDefinitionField];
                                    }
                                }
                            }
                        }
                        fileStream.write(`${JSON.stringify(row)}${constants_1.default.EOL}`);
                    }
                }
                schemas.add(schema.name);
            }
            catch (err) {
                this.UX.log(`FAILED: ${err.message}.`);
            }
        }
        if (this.options.includeValidationRules) {
            this.UX.log(`Gathering ValidationRules...`);
            fileStream.write(`*${validationRuleName}${constants_1.default.EOL}`);
            const defMap = this.options.getDefinitionMap(validationRuleName);
            const headerRow = Array.from(defMap.keys());
            // fileStream.write(`${JSON.stringify(headerRow)}${Constants.EOL}`);
            const vrs = await sf_query_1.SfQuery.getValidationRules(this.org, true);
            let vrIndex = 1;
            for (const vr of vrs) {
                this.UX.log(`Gathering (${vrIndex++}/${vrs.length}) ValidationRules...`);
                const vrRow = [];
                for (const header of headerRow) {
                    vrRow.push(vr[defMap.get(header)]);
                }
                fileStream.write(`${JSON.stringify(vrRow)}${constants_1.default.EOL}`);
            }
        }
        fileStream.end();
        await this.writeDictionary(schemaTmpFile, flags.report);
        // Clean up file at end
        await utils_1.default.deleteFile(schemaTmpFile);
        // Write options JSON incase there have been structure changes since it was last saved.
        if (flags.options) {
            await this.options.save(flags.options);
        }
    }
    async writeDictionary(schemaTmpFile, reportPathFlag) {
        const workbookMap = new Map();
        const reportPath = path
            .resolve(reportPathFlag || Dictionary.defaultReportPath)
            .replace(/\{ORG\}/, this.orgAlias);
        const invalidLines = [];
        this.UX.log('Preparing Data Dictionary');
        try {
            let sheetName = null;
            let sheet = null;
            for await (const line of utils_1.default.readFileLines(schemaTmpFile)) {
                if (line.startsWith('*')) {
                    sheetName = line.substring(1);
                    const headers = this.options.getDefinitionHeaders(sheetName);
                    sheet = workbookMap.get(sheetName);
                    if (!sheet) {
                        sheet = [[...headers]];
                        workbookMap.set(sheetName, sheet);
                    }
                    continue;
                }
                if (line.length > constants_1.default.MAX_EXCEL_LENGTH) {
                    invalidLines.push(line);
                    continue;
                }
                sheet.push(JSON.parse(line));
            }
        }
        catch (err) {
            this.UX.log('Error Preparing Data Dictionary: ' + JSON.stringify(err.message));
            throw err;
        }
        if (invalidLines.length > 0) {
            this.UX.warn('Dictionary lines exceed max length for Excel: ');
            for await (const line of invalidLines) {
                this.UX.warn(line);
            }
        }
        this.UX.log(`Writing Data Dictionary: ${reportPath}`);
        try {
            office_1.Office.writeXlxsWorkbook(workbookMap, reportPath);
        }
        catch (err) {
            this.UX.log('Error Writing Data Dictionary: ' + JSON.stringify(err.message));
            throw err;
        }
    }
    async getSortedTypeNames(includedNamespaces) {
        let typeNames = null;
        if (this.options.includeCustomObjectNames && this.options.includeCustomObjectNames.length > 0) {
            this.UX.log('Gathering CustomObject names from options');
            typeNames = new Set(this.options.includeCustomObjectNames);
        }
        else {
            // Are we including namespaces?
            const namespaces = includedNamespaces ? new Set(includedNamespaces.split(',')) : null;
            this.UX.log(`Gathering CustomObject names from Org: ${this.orgAlias}(${this.org.getOrgId()})`);
            const objectMap = await sf_tasks_1.SfTasks.listMetadatas(this.org, ['CustomObject'], null, namespaces);
            typeNames = new Set();
            for (const typeName of objectMap.get('CustomObject')) {
                typeNames.add(typeName.fullName);
            }
        }
        if (this.options.excludeCustomObjectNames) {
            this.options.excludeCustomObjectNames.forEach((item) => typeNames.delete(item));
        }
        return utils_1.default.sortArray(Array.from(typeNames));
    }
    async entityDefinitionValues(sObjectName, fieldNames) {
        const valueMap = new Map();
        if (!sObjectName || !fieldNames || fieldNames.length === 0) {
            return valueMap;
        }
        let query = `SELECT DurableID FROM EntityDefinition WHERE QualifiedApiName='${sObjectName}'`;
        let records = await sf_query_1.SfQuery.queryOrg(this.org, query);
        const durableId = records[0].DurableId;
        query = `SELECT QualifiedApiName,${fieldNames.join(',')} FROM FieldDefinition where EntityDefinition.DurableID='${durableId}' ORDER BY QualifiedApiName`;
        records = await sf_query_1.SfQuery.queryOrg(this.org, query);
        for (const record of records) {
            valueMap.set(record.QualifiedApiName, record);
        }
        return valueMap;
    }
}
Dictionary.description = command_base_1.CommandBase.messages.getMessage('schema.dictionary.commandDescription');
Dictionary.defaultReportPath = 'DataDictionary-{ORG}.xlsx';
Dictionary.examples = [
    `$ sf schema dictionary -u myOrgAlias
    Generates a ${Dictionary.defaultReportPath.replace(/\{ORG\}/, 'myOrgAlias')} file from an Org's configured Object & Field metadata.`,
];
Dictionary.flags = {
    report: sf_plugins_core_1.Flags.file({
        char: 'r',
        description: command_base_1.CommandBase.messages.getMessage('schema.dictionary.reportFlagDescription', [
            Dictionary.defaultReportPath,
        ]),
    }),
    namespaces: sf_plugins_core_1.Flags.string({
        char: 'n',
        description: command_base_1.CommandBase.messages.getMessage('namespacesFlagDescription'),
    }),
    options: sf_plugins_core_1.Flags.file({
        char: 'o',
        description: command_base_1.CommandBase.messages.getMessage('schema.dictionary.optionsFlagDescription'),
    }),
    tmpFile: sf_plugins_core_1.Flags.file({
        char: 't',
        description: command_base_1.CommandBase.messages.getMessage('schema.dictionary.tmpFileFlagDescription'),
    }),
    ...command_base_1.CommandBase.commonFlags,
};
exports.default = Dictionary;
//# sourceMappingURL=dictionary.js.map