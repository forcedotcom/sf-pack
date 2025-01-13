import { BuilderOptions } from 'xml2js';
export declare class SfCore {
    static ASTERIX: string;
    static MAIN: string;
    static DEFAULT: string;
    static EMAIL_TEMPLATE_XML_NAME: string;
    static jsonSpaces: number;
    static getPackageBase(version?: any): Promise<any>;
    static createPackage(packageTypes: Map<string, string[]>, version?: string): Promise<any>;
    static minifyPackage(packageObj: any): any;
    static writePackageFile(metadataMap: Map<string, string[]>, packageFilePath: string, append?: boolean, xmlOptions?: BuilderOptions): Promise<void>;
}
