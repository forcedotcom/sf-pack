import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from '../../helpers/command-base.js';
import { SfTasks } from '../../helpers/sf-tasks.js';
import Utils from '../../helpers/utils.js';
import { OptionsFactory } from '../../helpers/options-factory.js';
import { Office } from '../../helpers/office.js';
import SchemaUtils from '../../helpers/schema-utils.js';
import SchemaOptions from '../../helpers/schema-options.js';
import { SfQuery } from '../../helpers/sf-query.js';
import Constants from '../../helpers/constants.js';
export default class Dictionary extends CommandBase {
    static description = CommandBase.messages.getMessage('schema.dictionary.commandDescription');
    static defaultReportPath = 'DataDictionary-{ORG}.xlsx';
    static examples = [
        `$ sf schema dictionary -u myOrgAlias
    Generates a ${Dictionary.defaultReportPath.replace(/\{ORG\}/, 'myOrgAlias')} file from an Org's configured Object & Field metadata.`,
    ];
    static flags = {
        report: Flags.file({
            char: 'r',
            description: CommandBase.messages.getMessage('schema.dictionary.reportFlagDescription', [
                Dictionary.defaultReportPath,
            ]),
        }),
        namespaces: Flags.string({
            char: 'n',
            description: CommandBase.messages.getMessage('namespacesFlagDescription'),
        }),
        options: Flags.file({
            char: 'o',
            description: CommandBase.messages.getMessage('schema.dictionary.optionsFlagDescription'),
        }),
        tmpFile: Flags.file({
            char: 't',
            description: CommandBase.messages.getMessage('schema.dictionary.tmpFileFlagDescription'),
        }),
        ...CommandBase.commonFlags,
        ...CommandBase.flags,
    };
    options;
    async runInternal() {
        const { flags } = await this.parse(Dictionary);
        // Read/Write the options file if it does not exist already
        this.options = await OptionsFactory.get(SchemaOptions, flags.options);
        if (flags.tmpFile) {
            this.UX.log(`Writing Xlsx file from tmp file ${flags.tmpFile}...`);
            await this.writeDictionary(flags.tmpFile, flags.report);
            return;
        }
        const schemaTmpFile = `schema-${this.orgAlias}.tmp`;
        const sortedTypeNames = await this.getSortedTypeNames(flags.namespaces);
        // sortedTypeNames = ['Account', 'Case', 'Lead'];
        // Create for writing - truncates if exists
        const fileStream = createWriteStream(schemaTmpFile, { flags: 'w' });
        let counter = 0;
        const schemas = new Set();
        const validationRuleName = 'validationRules';
        for (const metaDataType of sortedTypeNames) {
            this.UX.log(`Gathering (${++counter}/${sortedTypeNames.length}) ${metaDataType} schema...`);
            try {
                // const schema: DescribeSObjectResult = await SfTasks.describeObject(this.org, metaDataType);
                let schema = null;
                try {
                    schema = await SfTasks.describeObject(this.org, metaDataType);
                }
                catch (err) {
                    if (!schemas.has(metaDataType)) {
                        schemas.add(metaDataType);
                        fileStream.write(`*${this.options.outputDefMap.keys().next().value}${Constants.EOL}`);
                        fileStream.write(`${JSON.stringify([metaDataType, `ERROR: ${err.message}`])}${Constants.EOL}`);
                    }
                    continue;
                }
                // Avoid duplicates (Account)
                if (schemas.has(schema.name)) {
                    continue;
                }
                for (const name of this.options.outputDefMap.keys()) {
                    // These are addressed later
                    if (name === validationRuleName) {
                        continue;
                    }
                    fileStream.write(`*${name}${Constants.EOL}`);
                    const collection = schema[name];
                    if (!collection) {
                        continue;
                    }
                    let nameFieldIndex = null;
                    // First try and find a Name field
                    const outputDefs = this.options.outputDefMap.get(name);
                    for (let index = 0; index < outputDefs.length; index++) {
                        const outputDef = outputDefs[index];
                        if (outputDef.includes(`|${SchemaUtils.CONTEXT_FIELD_NAME}`)) {
                            nameFieldIndex = index;
                            break;
                        }
                    }
                    const dynamicCode = this.options.getDynamicCode(name);
                    const schemaRows = new Map();
                    for await (const row of SchemaUtils.getDynamicSchemaData(schema, dynamicCode, collection)) {
                        if (row.length !== 0) {
                            schemaRows.set(row[nameFieldIndex ?? 0], row);
                        }
                    }
                    // Query for Entity & Field Definition
                    const entityDefinitionFields = this.options.getEntityDefinitionFields(name);
                    const fieldDefinitionMap = await this.entityDefinitionValues(metaDataType, entityDefinitionFields);
                    for (const fieldName of schemaRows.keys()) {
                        const row = schemaRows.get(fieldName);
                        const fieldDefinitionRecord = fieldDefinitionMap.get(fieldName);
                        if (fieldDefinitionRecord != null && outputDefs) {
                            for (let index = 0; index < outputDefs.length; index++) {
                                const outputDef = outputDefs[index];
                                for (const entityDefinitionField of entityDefinitionFields) {
                                    if (outputDef.includes(`|${SchemaUtils.ENTITY_DEFINITION}.${entityDefinitionField}`)) {
                                        row[index] = fieldDefinitionRecord[entityDefinitionField];
                                    }
                                }
                            }
                        }
                        fileStream.write(`${JSON.stringify(row)}${Constants.EOL}`);
                    }
                }
                schemas.add(schema.name);
            }
            catch (err) {
                // Handle errors gracefully
                this.UX.log(`FAILED ${metaDataType}: ${err.message}.`);
            }
        }
        if (this.options.includeValidationRules) {
            this.UX.log(`Gathering ValidationRules...`);
            fileStream.write(`*${validationRuleName}${Constants.EOL}`);
            const defMap = this.options.getDefinitionMap(validationRuleName);
            const headerRow = Array.from(defMap.keys());
            // fileStream.write(`${JSON.stringify(headerRow)}${Constants.EOL}`);
            const vrs = await SfQuery.getValidationRules(this.org, true);
            let vrIndex = 1;
            for (const vr of vrs) {
                this.UX.log(`Gathering (${vrIndex++}/${vrs.length}) ValidationRules...`);
                const vrRow = [];
                for (const header of headerRow) {
                    vrRow.push(vr[defMap.get(header)]);
                }
                fileStream.write(`${JSON.stringify(vrRow)}${Constants.EOL}`);
            }
        }
        fileStream.end();
        await this.writeDictionary(schemaTmpFile, flags.report);
        // Clean up file at end
        await Utils.deleteFile(schemaTmpFile);
        // Write options JSON incase there have been structure changes since it was last saved.
        if (flags.options) {
            await this.options.save(flags.options);
        }
    }
    async writeDictionary(schemaTmpFile, reportPathFlag) {
        const workbookMap = new Map();
        const reportPath = path.resolve(reportPathFlag || Dictionary.defaultReportPath).replace(/\{ORG\}/, this.orgAlias);
        const invalidLines = [];
        this.UX.log('Preparing Data Dictionary');
        try {
            let sheetName = null;
            let sheet = null;
            for await (const line of Utils.readFileLines(schemaTmpFile)) {
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
                if (line.length > Constants.MAX_EXCEL_LENGTH) {
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
            Office.writeXlxsWorkbook(workbookMap, reportPath);
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
            const objectMap = await SfTasks.listMetadatas(this.org, ['CustomObject'], null, namespaces);
            typeNames = new Set();
            for (const typeName of objectMap.get('CustomObject')) {
                typeNames.add(typeName.fullName);
            }
        }
        if (this.options.excludeCustomObjectNames) {
            this.options.excludeCustomObjectNames.forEach((item) => typeNames.delete(item));
        }
        return Utils.sortArray(Array.from(typeNames));
    }
    async entityDefinitionValues(sObjectName, fieldNames) {
        const valueMap = new Map();
        if (!sObjectName || !fieldNames || fieldNames.length === 0) {
            return valueMap;
        }
        let query = `SELECT DurableID FROM EntityDefinition WHERE QualifiedApiName='${sObjectName}'`;
        let records = await SfQuery.queryOrg(this.org, query);
        const durableId = records[0].DurableId;
        query = `SELECT QualifiedApiName,${fieldNames.join(',')} FROM FieldDefinition where EntityDefinition.DurableID='${durableId}' ORDER BY QualifiedApiName`;
        records = await SfQuery.queryOrg(this.org, query);
        for (const record of records) {
            valueMap.set(record.QualifiedApiName, record);
        }
        return valueMap;
    }
}
//# sourceMappingURL=dictionary.js.map