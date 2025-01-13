import * as vm from 'node:vm';
import path from 'node:path';
export default class SchemaUtils {
    static ENTITY_DEFINITION = 'EntityDefinition';
    static CONTEXT_FIELD = 'ctx';
    static CONTEXT_FIELD_NAME = SchemaUtils.CONTEXT_FIELD + '.name';
    static CONTEXT_SCHEMA = 'schema';
    static dynamicContext = {
        getPicklistValues(fld) {
            const values = [];
            if (fld.picklistValues) {
                for (const picklistValue of fld.picklistValues) {
                    // Show inactive values
                    values.push(`${picklistValue.active ? '' : '(-)'}${picklistValue.value}`);
                }
            }
            return values;
        },
        getPicklistDefaultValue(fld) {
            if (fld.picklistValues) {
                for (const picklistValue of fld.picklistValues) {
                    if (picklistValue.active && picklistValue.defaultValue) {
                        return picklistValue.value;
                    }
                }
            }
        },
    };
    static *getDynamicSchemaData(schema, dynamicCode, collection) {
        if (!schema) {
            throw new Error('The schema argument cannot be null.');
        }
        if (!schema.fields) {
            throw new Error('The schema argument does not contains a fields member.');
        }
        if (!dynamicCode) {
            throw new Error('The dynamicCode argument cannot be null.');
        }
        if (!collection) {
            throw new Error('The collection argument cannot be null.');
        }
        const context = SchemaUtils.dynamicContext;
        context[SchemaUtils.CONTEXT_SCHEMA] = schema;
        for (const item of collection) {
            context[SchemaUtils.CONTEXT_FIELD] = item;
            const row = vm.runInNewContext(dynamicCode, context);
            yield row;
        }
    }
    static getMetadataBaseName(metadataFilePath) {
        const parts = path.basename(metadataFilePath).split('.');
        return parts.slice(0, parts.length - 1).join('.');
    }
}
//# sourceMappingURL=schema-utils.js.map