import { Ux } from '@salesforce/sf-plugins-core';
declare class MergeResult {
    source: any;
    destination: any;
}
export default class XmlMerge {
    static mergeXmlFiles(sourceXmlFile: string, destinationXmlFile: string, isPackageCompare?: boolean, ux?: Ux): Promise<any>;
    static mergeXmlToFile(sourceXml: any, destinationXmlFile: string): Promise<any>;
    static getType(pack: any, name: string): any;
    static logMessage(message: string, logFile: string, ux?: Ux): Promise<void>;
    static mergeObjects(source: any, destination: any, isPackageCompare?: boolean): MergeResult;
}
export {};
