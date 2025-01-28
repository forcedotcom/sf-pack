import { exec, ExecOptions } from 'node:child_process';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
// import reqUtils from'node:util';
import mime from 'mime-types';
import { DOMParser, MIME_TYPE } from '@xmldom/xmldom';
import * as xpath from 'xpath';
import * as xml2js from 'xml2js';
import { Logger } from '@salesforce/core';
import { glob } from 'glob';
import bent  from'bent';
import Constants from './constants.js';

export const NO_CONTENT_CODE = 204;

export enum LoggerLevel {
  trace = 'trace',
  debug = 'debug',
  info = 'info',
  warn = 'warn',
  error = 'error',
  fatal = 'fatal',
}

export enum RestAction {
  GET = 'GET',
  PUT = 'PUT',
  POST = 'POST',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

export enum IOItem {
  File = 'File',
  Folder = 'Folder',
  Both = 'Both',
  Unknown = 'Unknown',
}

export class RestResult {
  public id: string | undefined;
  public code: number | undefined;
  public body: any;
  public isError = false;
  public contentType: string | undefined;
  public isBinary = false;
  public headers: any;

  public get isRedirect(): boolean {
    for (const statusCode of Constants.HTTP_STATUS_REDIRECT) {
      if (this.code === statusCode) {
        return true;
      }
    }
    return false;
  }

  public get redirectUrl(): string | undefined {
    return this.isRedirect ? (this.headers?.location as string) : undefined;
  }

  public throw(): Error | void {
    if (this.isError) {
      throw this.getError();
    }
  }

  public getContent(): any {
    return this.getError() || this.body || this.id;
  }

  private getError(): Error | undefined {
    return this.isError ? new Error(`(${this.code}) ${JSON.stringify(this.body)}`) : undefined;
  }
}

export class CmdResponse {
  public status: number | undefined;
  public result: any;
}

export default class Utils {
  public static logger: Logger;
  public static isJsonEnabled = false;
  public static ReadFileBase64EncodingOption = { encoding: 'base64' };

  public static tempFilesPath = 'Processing_AcuPack_Temp_DoNotUse';
  public static defaultXmlOptions: xml2js.BuilderOptions = {
    renderOpts: { pretty: true, indent: '    ', newline: '\n' },
    xmldec: { version: '1.0', encoding: 'UTF-8' },
  };

  public static execOptions: ExecOptions = { env: process.env, maxBuffer: 10 * 1024 * 1024};
  
  public static async *getFiles(folderPath: string, isRecursive = true): AsyncGenerator<string, void, void> {
    if (!folderPath) {
      return;
    }
    for await (const item of Utils.getItems(folderPath, IOItem.File, isRecursive)) {
      yield item;
    }
  }

  public static async *getFolders(folderPath: string, isRecursive = true): AsyncGenerator<string, void, void> {
    for await (const item of Utils.getItems(folderPath, IOItem.Folder, isRecursive)) {
      yield item;
    }
  }

  public static replaceBackslashes(pathWithBackslashes: string): string {
    return pathWithBackslashes.replace(/\\/g, '/');
  }

  public static async *getItems(
    rootPath: string,
    itemKind: IOItem,
    isRecursive = true,
    depth = 0
  ): AsyncGenerator<string, void, void> {
    if (!rootPath) {
      return null;
    }
    let fileItems;
    // If we have a wildcarded path - lets use glob
    const isGlob = glob.hasMagic(rootPath);
    if (isGlob) {
      // Globs should be specific so just return
      // glob ONLY works with forward slashes...sigh
      fileItems = await glob(Utils.replaceBackslashes(rootPath));
      for (const filePath of fileItems) {
        yield Utils.normalizePath(filePath as string);
      }
      return;
    }

    const stats = await Utils.getPathStat(rootPath);
    if (!stats) {
      // console.log(`WARNING: ${rootPath} not found.`);
      return;
    }

    if (stats.isFile()) {
      if (itemKind !== IOItem.Folder) {
        yield rootPath;
      }
      // Nothing else to do
      return;
    }

    // Are we recursive or just starting at the root folder
    if (isRecursive || depth === 0) {
      depth++;
      const subItems = await fs.readdir(rootPath);
      const folderNames = new Set();
      for (const subItem of subItems) {
        const subItemPath = path.join(rootPath, subItem);
        const subStats = await Utils.getPathStat(subItemPath);
        if (subStats) {
          if (subStats.isFile()) {
            if (itemKind !== IOItem.Folder) {
              yield Utils.normalizePath(subItemPath);
            }
            continue;
          }
          // We are on a folder again
          if (itemKind !== IOItem.File) {
            // don't return duplicate folders
            if (!folderNames.has(subItemPath)) {
              folderNames.add(subItemPath);
              yield Utils.normalizePath(subItemPath);
            }
          }
          if (isRecursive) {
            for await (const subFilePath of Utils.getItems(subItemPath, itemKind, isRecursive, depth)) {
              yield subFilePath;
            }
          }
        }
      }
    }
  }

  public static async *readFileLines(filePath: string): AsyncGenerator<string, void, void> {
    if (!(await Utils.pathExists(filePath))) {
      return;
    }

    const rl = createInterface({
      input: createReadStream(filePath),
      // Note: we use the crlfDelay option to recognize all instances of CR LF
      // ('\r\n') in input.txt as a single line break.
      crlfDelay: Infinity,
    });

    // Walk the file
    for await (const line of rl) {
      yield line;
    }
  }

  public static async readFile(filePath: string, options?: any): Promise<string|null> {
    if (!filePath || !(await Utils.pathExists(filePath))) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return (await fs.readFile(filePath, options)).toString();
  }

  public static async pathExists(pathToCheck: string): Promise<boolean> {
    if (!pathToCheck) {
      return false;
    }
    try {
      await fs.access(pathToCheck);
      return true;
    } catch (err) {
      if (!Utils.isENOENT(err)) {
        throw err;
      }
      return false;
    }
  }

  public static async getPathStat(pathToCheck: string): Promise<any> {
    const result = !pathToCheck || !(await Utils.pathExists(pathToCheck)) ? null : await fs.stat(pathToCheck);
    return result;
  }

  public static async getPathKind(pathToCheck: string): Promise<IOItem> {
    const stats = await Utils.getPathStat(pathToCheck);
    if (!stats) {
      return IOItem.Unknown;
    }
    if (stats.isFile()) {
      return IOItem.File;
    } else if (stats.isDirectory()) {
      return IOItem.Folder;
    } else {
      return IOItem.Unknown;
    }
  }

  public static isENOENT(err: any): boolean {
    return err?.code === Constants.ENOENT;
  }

  public static async mkDirPath(destination: string, hasFileName = false): Promise<void> {
    if (!destination) {
      return;
    }
    await fs.mkdir(hasFileName ? path.dirname(destination) : destination, { recursive: true });
  }

  public static async copyFile(source: string, destination: string): Promise<void> {
    if (!source || !destination) {
      return;
    }
    try {
      await Utils.mkDirPath(destination, true);
      await fs.copyFile(source, destination);
    } catch (err) {
      if (Utils.isENOENT(err)) {
        /* eslint-disable-next-line no-console */
        console.log(`${source} not found.`);
      } else {
        throw err;
      }
    }
  }

  public static sortArray(array: any[]): any[] {
    if (array) {
      array.sort((a: any, b: any): number => {
        if (typeof a === 'number') {
          return a - b;
        } else {
          return a.localeCompare(b, 'en', { sensitivity: 'base' }) as number;
        }
      });
    }
    return array;
  }

  
  public static selectXPath(xml: string, xPaths: string[]): Map<string, string[]> | undefined {
    if (xml && xPaths && xPaths.length !== 0) {
      const results = new Map<string, string[]>();
      const doc = new DOMParser().parseFromString(xml, MIME_TYPE.XML_TEXT);
  
      for (const xp of xPaths) {
        if (!xp) {
          results.set(xp, null);
          continue;
        }
        // @ts-expect-error missing Node properties are not needed
        const nodes: SelectReturnType = xpath.select(xp, doc);
  
        if (!nodes || nodes.length === 0) {
          results.set(xp, null);
          continue;
        }
        const values: string[] = [];
        for (const node of nodes) {
          values.push(node.toLocaleString() as string);
        }
        results.set(xp, values);
      }
      return results;  
    }
  }

  public static async deleteFile(filePath: string): Promise<boolean> {
    if (!filePath || (await Utils.getPathKind(filePath)) !== IOItem.File) {
      return false;
    }
    await fs.unlink(filePath);
    return true;
  }

  public static async sleep(sleepMilliseconds = 1000): Promise<void> {
    if (!sleepMilliseconds || sleepMilliseconds <= 0) {
      return;
    }
    
    await new Promise((resolve) => setTimeout(resolve, sleepMilliseconds));
  }

  public static getFieldValues(records: any[], fieldName = 'id', mustHaveValue = false): string[] | undefined{
    if (records) {
      const values: string[] = [];
      for (const record of records) {
        values.push(Utils.getFieldValue(record, fieldName, mustHaveValue));
      }
      return values;}
  }

  public static getFieldValue(record: any, fieldName = 'id', mustHaveValue = false): string | null{
    if (!record) {
      return null;
    }
    const value: string = typeof record === 'string' ? record : record[fieldName];
    if (mustHaveValue && !value) {
      throw new Error(`Required Field: ${fieldName} not found in record: ${JSON.stringify(record)}.`);
    }
    return !value ? null : value;
  }

  public static unmaskEmail(email: string, mask = '.invalid'): string | undefined {
    if (!email) {
      return;
    }
    if (!email.includes(mask)) {
      return email;
    }
    return email.split(mask).join('');
  }

  public static writeObjectToXml(metadata: any, xmlOptions?: xml2js.BuilderOptions): string | undefined {
    if (!metadata) {
      return;
    }
    const options = xmlOptions ?? Utils.defaultXmlOptions;
    let xml: string = new xml2js.Builder(options).buildObject(metadata);

    xml += Constants.DEFAULT_XML_EOF;
    return xml;
  }

  public static async writeObjectToXmlFile(filePath: string, metadata: any, xmlOptions?: xml2js.BuilderOptions): Promise<string | undefined> {
    if (!filePath || !metadata) {
      return;
    }
    await Utils.mkDirPath(filePath, true);
    const xml = Utils.writeObjectToXml(metadata, xmlOptions);
    await Utils.writeFile(filePath, xml);

    return filePath;
  }

  public static async readObjectFromXmlFile(filePath: string, xmlOptions?: xml2js.ParserOptions): Promise<any> {
    if (!filePath) {
      return null;
    }
    const xmlString = await fs.readFile(filePath, { encoding: Constants.DEFAULT_XML_ENCODING });
    const obj = await this.parseObjectFromXml(xmlString, xmlOptions);
    return obj;
  }

  public static async parseObjectFromXml(xml: string, xmlOptions?: xml2js.ParserOptions): Promise<any> {
    if (!xml) {
      return null;
    }
    const options = xmlOptions ?? Utils.defaultXmlOptions;
    const result: object = await new xml2js.Parser(options).parseStringPromise(xml);
    return result;
  }

  public static setCwd(newCwdPath: string): string | undefined{
    if (!newCwdPath) {
      return;
    }
    const currentCwd = path.resolve(process.cwd());
    const newCwd = path.resolve(newCwdPath);
    if (currentCwd !== newCwd) {
      process.chdir(newCwdPath);
    }
    return currentCwd;
  }

  public static async deleteDirectory(dirPath: string, recursive = true): Promise<boolean> {
    if (!dirPath || (await Utils.getPathKind(dirPath)) !== IOItem.Folder) {
      return false;
    }
    await fs.rm(dirPath, { recursive });
    return true;
  }

  public static async writeFile(filePath: string, contents: any): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await fs.writeFile(filePath, contents);
  }

  public static chunkRecords(recordsToChunk: any[], chunkSize: number): any[] {
    const chunk = (arr: any[], size: number): any[] =>
      Array.from({ length: Math.ceil(arr.length / size) }, (v: any, i: number): any[] =>
        arr.slice(i * size, i * size + size)
      );
    return chunk(recordsToChunk, chunkSize);
  }

  public static async getRestResult(
    action: RestAction,
    url: string,
    parameter?: any,
    headers?: any,
    validStatusCodes?: number[],
    isFollowRedirects = true
  ): Promise<RestResult | undefined> {
    if (!action || !url) {
      return;
    }
    let result = null;
    const apiPromise = bent(action.toString(), headers || {}, validStatusCodes || [200]);
    let tempUrl = url;
    do {
      result = new RestResult();
      try {
        const response = await apiPromise(tempUrl, parameter);
        // Do we have content?
        result.headers = response.headers;
        result.code = response.statusCode;
        switch (result.code) {
          case NO_CONTENT_CODE:
            return result;
          default:
            // Read payload
            /* eslint-disable-next-line camelcase */
            response.content_type = response.headers[Constants.HEADERS_CONTENT_TYPE];
            switch(response.content_type) {
              case Constants.CONTENT_TYPE_APPLICATION:
                // eslint-disable-next-line no-case-declarations
                const buff: ArrayBuffer = await response.arrayBuffer();
                result.body = Buffer.from(buff);
                result.isBinary = true;
                break;
              case Constants.CONTENT_TYPE_CSV:
              case Constants.CONTENT_TYPE_TEXT:
                result.body = await response.text();
                break;
              default:
                result.body = await response.json();
                break;
            }
            return result;
        }
      } catch (err) {
        result.isError = true;
        const statusError: any = err;
        result.code = statusError.statusCode;
        result.body = statusError.message;
        result.headers = statusError.headers;
        tempUrl = result.redirectUrl as string;
      }
    } while (isFollowRedirects && result.isRedirect);
    return result;
  }

  public static normalizePath(filePath: string): string {
    let newFilePath = filePath;
    if (newFilePath) {
      newFilePath = path.normalize(newFilePath);

      // eslint-disable-next-line @typescript-eslint/quotes
      const regEx = new RegExp(path.sep === '\\' ? '/' : '\\\\', 'g');
      newFilePath = newFilePath.replace(regEx, path.sep);
    }
    return newFilePath;
  }

  public static parseDelimitedLine(
    delimitedLine: string,
    delimiter = ',',
    wrapperChars = Constants.DEFAULT_CSV_TEXT_WRAPPERS,
    skipChars = [Constants.EOL, Constants.CR, Constants.LF]
  ): string[] | undefined {
    if (delimitedLine === null) {
      return;
    }
    const parts: string[] = [];
    let part: string = null as any;
    let inWrapper = false;
    const addPart = function (ch: string): string {
      part = part ? part + ch : ch;
      return part;
    };
    let lastChar: string = null as any;
    for (const ch of delimitedLine) {
      lastChar = ch;
      if (skipChars.includes(lastChar)) {
        continue;
      }
      if (lastChar === delimiter) {
        if (inWrapper) {
          addPart(lastChar);
        } else {
          // insert a blank string if part is null
          parts.push(part);
          part = null as any;
        }
        continue;
      }
      // is this part wrapped? (i.e. "this is wrapped, because it has the delimiter")
      if (wrapperChars.includes(lastChar)) {
        inWrapper = !inWrapper;
        if (part === null) {
          part = '';
        }
        continue;
      }
      addPart(lastChar);
    }
    // do we have a trailing part?
    if (part || lastChar === delimiter) {
      parts.push(part);
    }
    return parts;
  }

  public static async *parseCSVFile(
    csvFilePath: string,
    delimiter = ',',
    wrapperChars = Constants.DEFAULT_CSV_TEXT_WRAPPERS
  ): AsyncGenerator<any, void, void> {
    if (csvFilePath === null) {
      return;
    }

    let headers: string[] = null as any;

    for await (const line of this.readFileLines(csvFilePath)) {
      const parts = this.parseDelimitedLine(line, delimiter, wrapperChars);
      if (!parts) {
        continue;
      }
      if (!headers) {
        headers = parts;
        continue;
      }
      const csvObj = {};
      for (let index = 0; index < headers.length; index++) {
        const header = headers[index];
        csvObj[header] = index < parts.length ? parts[index] : null;
      }
      yield csvObj;
    }
  }

  public static getMIMEType(filename: string): string {
    return mime.lookup(filename) as string;
  }

  public static stripANSI(input: string, onlyFirst = false): string {
    const pattern = [
      '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
      '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))',
    ].join('|');
    return input.replace(new RegExp(pattern, onlyFirst ? undefined : 'g'), '');
  }

  public static async command(cmd: string, hideWarnings = false): Promise<any> {
    if (!cmd) {
      return null;
    }
    return new Promise((resolve, reject) => {
      exec(cmd, Utils.execOptions, (error: any, stdout: string) => {
        let response: CmdResponse = null as any;
        try {
          if (stdout && String(stdout) !== '') {
            response = JSON.parse(Utils.stripANSI(stdout)) as CmdResponse;
          }
        } catch (err) {
          if(!hideWarnings) {
            /* eslint-disable-next-line no-console */
            console.warn(stdout);
          }
        } finally {
          if (!response) {
            if (error) {
              reject(error);
            } else {
              resolve(stdout);
            }
          } else if (response.status !== 0) {
            reject(new Error(JSON.stringify(response)));
          } else {
            resolve(response.result);
          }
        }
      });
    });
  }
}
