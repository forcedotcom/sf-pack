import { BuilderOptions } from 'xml2js';
import { Field } from '@jsforce/jsforce-node';
import Utils from './utils.js';
import SfProject from './sf-project.js';
import Constants from './constants.js';
import XmlMerge from './xml-merge.js';

export class SfCore {
  public static ASTERIX = '*';
  public static MAIN = 'main';
  public static DEFAULT = 'default';
  public static EMAIL_TEMPLATE_XML_NAME = 'EmailTemplate';

  public static jsonSpaces = 2;

  public static async getPackageBase(version = null): Promise<any> {
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

  public static async createPackage(packageTypes: Map<string, string[]>, version: string = null): Promise<any> {
    const packageObj = await SfCore.getPackageBase(version);

    const typeNames = Utils.sortArray(Array.from(packageTypes.keys())) as string[];
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

  public static minifyPackage(packageObj: any): any {
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

  public static async writePackageFile(
    metadataMap: Map<string, string[]>,
    packageFilePath: string,
    append?: boolean,
    xmlOptions?: BuilderOptions
  ): Promise<void> {
    // Convert into Package format
    const sfPackage = await SfCore.createPackage(metadataMap);
    if (append) {
      await XmlMerge.mergeXmlToFile(sfPackage, packageFilePath);
    } else {
      await Utils.writeObjectToXmlFile(packageFilePath, sfPackage, xmlOptions);
    }
  }
  
  public static generateValue(field: Field): any {
    // https://developer.salesforce.com/docs/atlas.en-us.pages.meta/pages/pages_variables_global_objecttype_schema_fields_reference.htm
    if (!field) {
      return field;
    }
    const noUnderscoreName: string = field.name.split('__')[0].replace(/_/g, '');

    const getStr = (fld: Field, maxLength?: number): string => {
      const value: string = fld.name;
      let strLen: number = fld.length;
      if (!strLen || strLen === 0 || strLen > maxLength) {
        strLen = maxLength;
      }

      // trim if we are too long
      if (strLen && value.length > strLen) {
        return value.substring(0, strLen);
      }
      return value;  
    };

    const getNum = (fld: Field): number => {
      let num = '';
      // precision is the current attribute name while digits is the legacy/classic name
      let precision = fld.precision ?? field.digits ?? 0;
      if (!precision) {
        return;
      }
      const scale = fld.scale ?? 0;
      if(scale) {
        // The length is the TOTAL character count for the number value (exclusive of the decimal point) AND scale
        // 123.45 has precision = 5 and scale = 2
        precision = precision - scale;
      }
      for (let index = 1; index <= precision; index++) {
        // Don't want starting or ending zeros as they may get truncated with parseFloat below!
        num += (index > 1 && index < precision-1) ? getRand(0,9) : getRand(1,9);
      }
      if (scale) {
        num += '.';
        for (let index = 1; index <= scale; index++) {
          // Don't want zeros as they may get truncated with parseFloat below!
          num += getRand(1,9);
        }
      }
      return parseFloat(num);
    };

    const getRand = (min: number, max: number): number => {
      return Math.floor(Math.random() * (max - min) + min);
    };

    const getPicklist = (picklistValues: any[], count: number): string[] => {
      const values: string[] = [];
      for (const picklist of picklistValues) {
        if (!picklist.active) {
          continue;
        }
        values.push(picklist.value as string);
        if (values.length === count) {
          break;
        }
      }
      return values;
    };

    const getId = (length: number): string => {
      let value = '';
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const charactersLength = characters.length;
      let counter = 0;
      while (counter < length) {
        value += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
      }
      return value;
    }
    
    // const today = new Date().toISOString();
    // const dateParts = today.split('T');

    const getValue = (fld: Field): any => {
      let index =0;
      switch (fld.type) {
        case 'anytype':
        case 'string':
        case 'encryptedString':
        case 'textarea':
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
          return new Date().toISOString().substring(0,10);

        case 'datetime':
          // toISOString "2025-02-20T14:24:00.000Z"
          // Salesforce  "2025-02-20T14:24:00"
          // return `${dateParts[0]} ${dateParts[1].substring(0,8)}`;
          return new Date().toISOString().substring(0,19);
        case 'time':
          // toISOString "2025-02-20T14:24:00.000Z"
          // Salesforce  "19:49:13"
          return new Date().toISOString().split('T')[1].substring(0,8);

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
          // random & invalid Account (001) record Id
          return '001' + getId(15);

        case 'reference':
        case 'combobox':
        case 'dataCategoryGroupReference':
        default:
          // return `Unknown: ${fld.name} (${fld.type})`;
      }  
    };
    return getValue(field);
  }
}
