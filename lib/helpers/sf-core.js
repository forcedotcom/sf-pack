import Utils from './utils.js';
import SfProject from './sf-project.js';
import Constants from './constants.js';
import XmlMerge from './xml-merge.js';
export class SfCore {
    static ASTERIX = '*';
    static MAIN = 'main';
    static DEFAULT = 'default';
    static EMAIL_TEMPLATE_XML_NAME = 'EmailTemplate';
    static jsonSpaces = 2;
    static ignoreFieldTypes = [];
    static async getPackageBase(version = null) {
        return {
            Package: {
                $: {
                    xmlns: Constants.DEFAULT_XML_NAMESPACE,
                },
                types: [],
                version: version || (await SfProject.default()).sourceApiVersion,
            },
        };
    }
    static async createPackage(packageTypes, version = null) {
        const packageObj = await SfCore.getPackageBase(version);
        const typeNames = Utils.sortArray(Array.from(packageTypes.keys()));
        for (const typeName of typeNames) {
            const members = Utils.sortArray(packageTypes.get(typeName));
            packageObj.Package.types.push({
                name: [typeName],
                members,
            });
        }
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-return */
        return packageObj;
    }
    static minifyPackage(packageObj) {
        if (!packageObj) {
            return null;
        }
        const popIndexes = [];
        let typeIndex = 0;
        for (const sType of packageObj.Package.types) {
            if (sType?.members) {
                const memPopIndexes = [];
                let memIndex = 0;
                for (const member of sType.members) {
                    if (!member || member === '') {
                        memPopIndexes.push(memIndex);
                    }
                    memIndex++;
                }
                while (memPopIndexes.length) {
                    sType.members.splice(memPopIndexes.pop(), 1);
                }
            }
            if (!sType?.members || sType.members.length === 0) {
                popIndexes.push(typeIndex);
            }
            typeIndex++;
        }
        while (popIndexes.length) {
            packageObj.Package.types.splice(popIndexes.pop(), 1);
        }
        return packageObj;
    }
    static async writePackageFile(metadataMap, packageFilePath, append, xmlOptions) {
        // Convert into Package format
        const sfPackage = await SfCore.createPackage(metadataMap);
        if (append) {
            await XmlMerge.mergeXmlToFile(sfPackage, packageFilePath);
        }
        else {
            await Utils.writeObjectToXmlFile(packageFilePath, sfPackage, xmlOptions);
        }
    }
    static generateValue(field) {
        // https://developer.salesforce.com/docs/atlas.en-us.pages.meta/pages/pages_variables_global_objecttype_schema_fields_reference.htm
        if (!field) {
            return field;
        }
        const noUnderscoreName = field.name.split('__')[0].replace(/_/g, '');
        const getStr = (fld, maxLength) => {
            const value = fld.name;
            let strLen = fld.length;
            if (!strLen || strLen === 0 || strLen > maxLength) {
                strLen = maxLength;
            }
            // trim if we are too long
            if (strLen && value.length > strLen) {
                return value.substring(0, strLen);
            }
            return value;
        };
        const getNum = (fld) => {
            let num = '';
            // precision is the current attribute name while digits is the legacy/classic name
            let precision = fld.precision ?? field.digits ?? 0;
            if (!precision) {
                return;
            }
            const scale = fld.scale ?? 0;
            if (scale) {
                // The length is the TOTAL character count for the number value (exclusive of the decimal point) AND scale
                // 123.45 has precision = 5 and scale = 2
                precision = precision - scale;
            }
            for (let index = 1; index <= precision; index++) {
                // Don't want starting or ending zeros as they may get truncated with parseFloat below!
                num += (index > 1 && index < precision - 1) ? getRand(0, 9) : getRand(1, 9);
            }
            if (scale) {
                num += '.';
                for (let index = 1; index <= scale; index++) {
                    // Don't want zeros as they may get truncated with parseFloat below!
                    num += getRand(1, 9);
                }
            }
            return parseFloat(num);
        };
        const getRand = (min, max) => {
            return Math.floor(Math.random() * (max - min) + min);
        };
        const getPicklist = (picklistValues, count) => {
            const values = [];
            for (const picklist of picklistValues) {
                if (!picklist.active) {
                    continue;
                }
                values.push(picklist.value);
                if (values.length === count) {
                    break;
                }
            }
            return values;
        };
        const getId = (length) => {
            let value = '';
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            const charactersLength = characters.length;
            let counter = 0;
            while (counter < length) {
                value += characters.charAt(Math.floor(Math.random() * charactersLength));
                counter += 1;
            }
            return value;
        };
        // const today = new Date().toISOString();
        // const dateParts = today.split('T');
        const getValue = (fld) => {
            if (!this.ignoreFieldTypes.includes(fld.type)) {
                let index = 0;
                switch (fld.type) {
                    case 'anytype':
                    case 'string':
                    case 'encryptedstring':
                    case 'textarea':
                    case 'dataCategoryGroupReference':
                        return `${getStr(fld)}`;
                    case 'base64':
                        return Buffer.from(getStr(fld)).toString('base64');
                    case 'textarea1': {
                        const lineCount = 3;
                        // Calculate length of each line (subtract for \n) then divide
                        const lineLength = Math.floor((fld.length - lineCount) / 3);
                        const lines = [];
                        for (let lineIndex = 0; lineIndex < lineCount; lineIndex++) {
                            lines.push(`${getStr(fld, lineLength)}`);
                        }
                        return lines.join('+\n');
                    }
                    case 'int':
                    case 'integer':
                        return getNum(fld);
                    case 'long':
                        return getNum(fld);
                    case 'double':
                    case 'percent':
                        return getNum(fld);
                    case 'currency':
                        return getNum(fld);
                    case 'address':
                        return `123 ${fld.name} St.`;
                    case 'boolean':
                        return Math.random() < 0.5;
                    case 'date':
                        // toISOString "2025-02-20T14:24:00.000Z"
                        // Salesforce  "2025-02-20"
                        return new Date().toISOString().substring(0, 10);
                    case 'datetime':
                        // toISOString "2025-02-20T14:24:00.000Z"
                        // Salesforce  "2025-02-20T14:24:00"
                        // return `${dateParts[0]} ${dateParts[1].substring(0,8)}`;
                        return new Date().toISOString().substring(0, 19);
                    case 'time':
                        // toISOString "2025-02-20T14:24:00.000Z"
                        // Salesforce  "19:49:13"
                        return new Date().toISOString().split('T')[1].substring(0, 8);
                    case 'email':
                        return `${fld.name}@${noUnderscoreName}.email.org`;
                    case 'phone': {
                        const phone = `555-${getRand(100, 999)}-${getRand(1000, 9999)} ext ${++index}`;
                        // phone max is 40
                        return `${phone.substring(0, 40)}`;
                    }
                    case 'multipicklist': {
                        if (fld.picklistValues?.length === 0) {
                            return `No picklist Values for: ${fld.name} (${fld.type})`;
                        }
                        const count = Math.ceil(fld.picklistValues.length / 2);
                        const values = getPicklist(fld.picklistValues, count);
                        return values ? `${values.join(';').replace(/'/g, "\\'")}` : null;
                    }
                    case 'combobox':
                    case 'picklist': {
                        if (fld.picklistValues?.length === 0) {
                            return `No picklist Values for: ${fld.name} (${fld.type})`;
                        }
                        const value = getPicklist(fld.picklistValues, 1);
                        return value ? `${value.join(';').replace(/'/g, "\\'")}` : null;
                    }
                    case 'url':
                        return `https://www.salesforce.com/${noUnderscoreName}/index`;
                    case 'id':
                    case 'reference':
                        // random & invalid Account (001) record Id
                        return '001' + getId(15);
                    case 'location':
                        // 26.7109444444;67.66725
                        // eslint-disable-next-line no-case-declarations
                        const latFld = {
                            type: 'number',
                            precision: 12,
                            scale: 10
                        };
                        // eslint-disable-next-line no-case-declarations
                        const longFld = {
                            type: 'number',
                            precision: 7,
                            scale: 5
                        };
                        return `${getNum(latFld)};${getNum(longFld)}`;
                    default:
                    // return `Unknown: ${fld.name} (${fld.type})`;
                }
            }
        };
        return getValue(field);
    }
}
//# sourceMappingURL=sf-core.js.map