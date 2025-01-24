/// <reference types="node" resolution-mode="require"/>
import { ExecOptions } from 'node:child_process';
import * as xml2js from 'xml2js';
import { Logger } from '@salesforce/core';
export declare const NO_CONTENT_CODE = 204;
export declare enum LoggerLevel {
    trace = "trace",
    debug = "debug",
    info = "info",
    warn = "warn",
    error = "error",
    fatal = "fatal"
}
export declare enum RestAction {
    GET = "GET",
    PUT = "PUT",
    POST = "POST",
    DELETE = "DELETE",
    PATCH = "PATCH"
}
export declare enum IOItem {
    File = "File",
    Folder = "Folder",
    Both = "Both",
    Unknown = "Unknown"
}
export declare class RestResult {
    id: string | undefined;
    code: number | undefined;
    body: any;
    isError: boolean;
    contentType: string | undefined;
    isBinary: boolean;
    headers: any;
    get isRedirect(): boolean;
    get redirectUrl(): string | undefined;
    throw(): Error | void;
    getContent(): any;
    private getError;
}
export declare class CmdResponse {
    status: number | undefined;
    result: any;
}
export default class Utils {
    static logger: Logger;
    static isJsonEnabled: boolean;
    static ReadFileBase64EncodingOption: {
        encoding: string;
    };
    static tempFilesPath: string;
    static defaultXmlOptions: xml2js.BuilderOptions;
    static execOptions: ExecOptions;
    static getFiles(folderPath: string, isRecursive?: boolean): AsyncGenerator<string, void, void>;
    static getFolders(folderPath: string, isRecursive?: boolean): AsyncGenerator<string, void, void>;
    static replaceBackslashes(pathWithBackslashes: string): string;
    static getItems(rootPath: string, itemKind: IOItem, isRecursive?: boolean, depth?: number): AsyncGenerator<string, void, void>;
    static readFileLines(filePath: string): AsyncGenerator<string, void, void>;
    static readFile(filePath: string, options?: any): Promise<string | null>;
    static pathExists(pathToCheck: string): Promise<boolean>;
    static getPathStat(pathToCheck: string): Promise<any>;
    static getPathKind(pathToCheck: string): Promise<IOItem>;
    static isENOENT(err: any): boolean;
    static mkDirPath(destination: string, hasFileName?: boolean): Promise<void>;
    static copyFile(source: string, destination: string): Promise<void>;
    static sortArray(array: any[]): any[];
    static selectXPath(xml: string, xPaths: string[]): Map<string, string[]> | undefined;
    static deleteFile(filePath: string): Promise<boolean>;
    static sleep(sleepMilliseconds?: number): Promise<void>;
    static getFieldValues(records: any[], fieldName?: string, mustHaveValue?: boolean): string[] | undefined;
    static getFieldValue(record: any, fieldName?: string, mustHaveValue?: boolean): string | null;
    static unmaskEmail(email: string, mask?: string): string | undefined;
    static writeObjectToXml(metadata: any, xmlOptions?: xml2js.BuilderOptions): string | undefined;
    static writeObjectToXmlFile(filePath: string, metadata: any, xmlOptions?: xml2js.BuilderOptions): Promise<string | undefined>;
    static readObjectFromXmlFile(filePath: string, xmlOptions?: xml2js.ParserOptions): Promise<any>;
    static parseObjectFromXml(xml: string, xmlOptions?: xml2js.ParserOptions): Promise<any>;
    static setCwd(newCwdPath: string): string | undefined;
    static deleteDirectory(dirPath: string, recursive?: boolean): Promise<boolean>;
    static writeFile(filePath: string, contents: any): Promise<void>;
    static chunkRecords(recordsToChunk: any[], chunkSize: number): any[];
    static getRestResult(action: RestAction, url: string, parameter?: any, headers?: any, validStatusCodes?: number[], isFollowRedirects?: boolean): Promise<RestResult | undefined>;
    static normalizePath(filePath: string): string;
    static parseDelimitedLine(delimitedLine: string, delimiter?: string, wrapperChars?: string[], skipChars?: string[]): string[] | undefined;
    static parseCSVFile(csvFilePath: string, delimiter?: string, wrapperChars?: string[]): AsyncGenerator<any, void, void>;
    static getMIMEType(filename: string): string;
    static stripANSI(input: string, onlyFirst?: boolean): string;
    static command(cmd: string, hideWarnings?: boolean): Promise<any>;
}
