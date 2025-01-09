"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CmdResponse = exports.RestResult = exports.IOItem = exports.RestAction = exports.LoggerLevel = exports.NO_CONTENT_CODE = void 0;
const node_child_process_1 = require("node:child_process");
const path = require("path");
const node_fs_1 = require("node:fs");
const node_fs_2 = require("node:fs");
const node_readline_1 = require("node:readline");
const mime = require("mime-types");
const xpath = require("xpath");
const xmldom_1 = require("@xmldom/xmldom");
const xml2js = require("xml2js");
const constants_1 = require("./constants");
exports.NO_CONTENT_CODE = 204;
var LoggerLevel;
(function (LoggerLevel) {
    LoggerLevel["trace"] = "trace";
    LoggerLevel["debug"] = "debug";
    LoggerLevel["info"] = "info";
    LoggerLevel["warn"] = "warn";
    LoggerLevel["error"] = "error";
    LoggerLevel["fatal"] = "fatal";
})(LoggerLevel || (exports.LoggerLevel = LoggerLevel = {}));
var RestAction;
(function (RestAction) {
    RestAction["GET"] = "GET";
    RestAction["PUT"] = "PUT";
    RestAction["POST"] = "POST";
    RestAction["DELETE"] = "DELETE";
    RestAction["PATCH"] = "PATCH";
})(RestAction || (exports.RestAction = RestAction = {}));
var IOItem;
(function (IOItem) {
    IOItem["File"] = "File";
    IOItem["Folder"] = "Folder";
    IOItem["Both"] = "Both";
    IOItem["Unknown"] = "Unknown";
})(IOItem || (exports.IOItem = IOItem = {}));
class RestResult {
    constructor() {
        this.isError = false;
        this.isBinary = false;
    }
    get isRedirect() {
        for (const statusCode of constants_1.default.HTTP_STATUS_REDIRECT) {
            if (this.code === statusCode) {
                return true;
            }
        }
        return false;
    }
    get redirectUrl() {
        return this.isRedirect ? this.headers?.location : null;
    }
    throw() {
        if (this.isError) {
            throw this.getError();
        }
        else {
            return null;
        }
    }
    getContent() {
        return this.getError() || this.body || this.id;
    }
    getError() {
        return this.isError ? new Error(`(${this.code}) ${JSON.stringify(this.body)}`) : null;
    }
}
exports.RestResult = RestResult;
class CmdResponse {
}
exports.CmdResponse = CmdResponse;
class Utils {
    static async *getFiles(folderPath, isRecursive = true) {
        if (!folderPath) {
            return null;
        }
        for await (const item of Utils.getItems(folderPath, IOItem.File, isRecursive)) {
            yield item;
        }
    }
    static async *getFolders(folderPath, isRecursive = true) {
        for await (const item of Utils.getItems(folderPath, IOItem.Folder, isRecursive)) {
            yield item;
        }
    }
    static async *getItems(rootPath, itemKind, isRecursive = true, depth = 0) {
        if (!rootPath) {
            return null;
        }
        let fileItems;
        // If we have a wildcarded path - lets use glob
        const isGlob = await this.glob.hasMagic(rootPath);
        if (isGlob) {
            // Globs should be specific so just return
            fileItems = await this.glob(rootPath);
            for (const filePath of fileItems) {
                yield Utils.normalizePath(filePath);
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
            const subItems = await node_fs_1.promises.readdir(rootPath);
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
    static async *readFileLines(filePath) {
        if (!(await Utils.pathExists(filePath))) {
            return;
        }
        const rl = (0, node_readline_1.createInterface)({
            input: (0, node_fs_2.createReadStream)(filePath),
            // Note: we use the crlfDelay option to recognize all instances of CR LF
            // ('\r\n') in input.txt as a single line break.
            crlfDelay: Infinity,
        });
        // Walk the file
        for await (const line of rl) {
            yield line;
        }
    }
    static async readFile(filePath, options) {
        if (!filePath || !(await Utils.pathExists(filePath))) {
            return null;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return (await node_fs_1.promises.readFile(filePath, options)).toString();
    }
    static async pathExists(pathToCheck) {
        if (!pathToCheck) {
            return false;
        }
        try {
            await node_fs_1.promises.access(pathToCheck);
            return true;
        }
        catch (err) {
            if (!Utils.isENOENT(err)) {
                throw err;
            }
            return false;
        }
    }
    static async getPathStat(pathToCheck) {
        const result = !pathToCheck || !(await Utils.pathExists(pathToCheck)) ? null : await node_fs_1.promises.stat(pathToCheck);
        return result;
    }
    static async getPathKind(pathToCheck) {
        const stats = await Utils.getPathStat(pathToCheck);
        if (!stats) {
            return IOItem.Unknown;
        }
        if (stats.isFile()) {
            return IOItem.File;
        }
        else if (stats.isDirectory()) {
            return IOItem.Folder;
        }
        else {
            return IOItem.Unknown;
        }
    }
    static isENOENT(err) {
        return err?.code === constants_1.default.ENOENT;
    }
    static async mkDirPath(destination, hasFileName = false) {
        if (!destination) {
            return;
        }
        await node_fs_1.promises.mkdir(hasFileName ? path.dirname(destination) : destination, { recursive: true });
    }
    static async copyFile(source, destination) {
        if (!source || !destination) {
            return null;
        }
        try {
            await Utils.mkDirPath(destination, true);
            await node_fs_1.promises.copyFile(source, destination);
        }
        catch (err) {
            if (Utils.isENOENT(err)) {
                /* eslint-disable-next-line no-console */
                console.log(`${source} not found.`);
            }
            else {
                throw err;
            }
        }
    }
    static sortArray(array) {
        if (array) {
            array.sort((a, b) => {
                if (typeof a === 'number') {
                    return a - b;
                }
                else {
                    return a.localeCompare(b, 'en', { sensitivity: 'base' });
                }
            });
        }
        return array;
    }
    static selectXPath(xml, xPaths) {
        if (!xml || !xPaths || xPaths.length === 0) {
            return null;
        }
        const results = new Map();
        const doc = new xmldom_1.DOMParser().parseFromString(xml);
        for (const xp of xPaths) {
            if (!xp) {
                results.set(xp, null);
                continue;
            }
            const nodes = xpath.select(xp, doc);
            if (!nodes || nodes.length === 0) {
                results.set(xp, null);
                continue;
            }
            const values = [];
            for (const node of nodes) {
                values.push(node.toLocaleString());
            }
            results.set(xp, values);
        }
        return results;
    }
    static async deleteFile(filePath) {
        if (!filePath || (await Utils.getPathKind(filePath)) !== IOItem.File) {
            return false;
        }
        await node_fs_1.promises.unlink(filePath);
        return true;
    }
    static async sleep(sleepMilliseconds = 1000) {
        if (!sleepMilliseconds || sleepMilliseconds <= 0) {
            return;
        }
        await new Promise((resolve) => setTimeout(resolve, sleepMilliseconds));
    }
    static getFieldValues(records, fieldName = 'id', mustHaveValue = false) {
        if (!records) {
            return null;
        }
        const values = [];
        for (const record of records) {
            values.push(Utils.getFieldValue(record, fieldName, mustHaveValue));
        }
        return values;
    }
    static getFieldValue(record, fieldName = 'id', mustHaveValue = false) {
        if (!record) {
            return null;
        }
        const value = typeof record === 'string' ? record : record[fieldName];
        if (mustHaveValue && !value) {
            throw new Error(`Required Field: ${fieldName} not found in record: ${JSON.stringify(record)}.`);
        }
        return !value ? null : value;
    }
    static unmaskEmail(email, mask = '.invalid') {
        if (!email) {
            return null;
        }
        if (!email.includes(mask)) {
            return email;
        }
        return email.split(mask).join('');
    }
    static writeObjectToXml(metadata, xmlOptions) {
        if (!metadata) {
            return null;
        }
        const options = xmlOptions ?? Utils.defaultXmlOptions;
        let xml = new xml2js.Builder(options).buildObject(metadata);
        if (options.eofChar) {
            xml += options.eofChar;
        }
        return xml;
    }
    static async writeObjectToXmlFile(filePath, metadata, xmlOptions) {
        if (!filePath || !metadata) {
            return null;
        }
        await Utils.mkDirPath(filePath, true);
        const xml = Utils.writeObjectToXml(metadata, xmlOptions);
        await Utils.writeFile(filePath, xml);
        return filePath;
    }
    static async readObjectFromXmlFile(filePath, xmlOptions) {
        if (!filePath) {
            return null;
        }
        const options = xmlOptions ?? Utils.defaultXmlOptions;
        const xmlString = await node_fs_1.promises.readFile(filePath, { encoding: options.encoding });
        const result = await new xml2js.Parser(options).parseStringPromise(xmlString);
        return result;
    }
    static setCwd(newCwdPath) {
        if (!newCwdPath) {
            return null;
        }
        const currentCwd = path.resolve(process.cwd());
        const newCwd = path.resolve(newCwdPath);
        if (currentCwd !== newCwd) {
            process.chdir(newCwdPath);
        }
        return currentCwd;
    }
    static async deleteDirectory(dirPath, recursive = true) {
        if (!dirPath || (await Utils.getPathKind(dirPath)) !== IOItem.Folder) {
            return false;
        }
        await node_fs_1.promises.rm(dirPath, { recursive });
        return true;
    }
    static async writeFile(filePath, contents) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        await node_fs_1.promises.writeFile(filePath, contents);
    }
    static chunkRecords(recordsToChunk, chunkSize) {
        const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));
        return chunk(recordsToChunk, chunkSize);
    }
    static async getRestResult(action, url, parameter, headers, validStatusCodes, isFollowRedirects = true) {
        if (!action || !url) {
            return null;
        }
        let result = null;
        const apiPromise = Utils.bent(action.toString(), headers || {}, validStatusCodes || [200]);
        let tempUrl = url;
        do {
            result = new RestResult();
            try {
                const response = await apiPromise(tempUrl, parameter);
                // Do we have content?
                result.headers = response.headers;
                result.code = response.statusCode;
                switch (result.code) {
                    case exports.NO_CONTENT_CODE:
                        return result;
                    default:
                        // Read payload
                        /* eslint-disable-next-line camelcase */
                        response.content_type = response.headers[constants_1.default.HEADERS_CONTENT_TYPE];
                        if (response.content_type === constants_1.default.CONTENT_TYPE_APPLICATION) {
                            const buff = await response.arrayBuffer();
                            result.body = Buffer.from(buff);
                            result.isBinary = true;
                        }
                        else {
                            result.body = await response.json();
                        }
                        return result;
                }
            }
            catch (err) {
                result.isError = true;
                result.code = err.statusCode;
                result.body = err.message;
                result.headers = err.headers;
                tempUrl = result.redirectUrl;
            }
        } while (isFollowRedirects && result.isRedirect);
        return result;
    }
    static normalizePath(filePath) {
        let newFilePath = filePath;
        if (newFilePath) {
            newFilePath = path.normalize(newFilePath);
            // eslint-disable-next-line @typescript-eslint/quotes
            const regEx = new RegExp(path.sep === '\\' ? '/' : '\\\\', 'g');
            newFilePath = newFilePath.replace(regEx, path.sep);
        }
        return newFilePath;
    }
    static parseDelimitedLine(delimitedLine, delimiter = ',', wrapperChars = constants_1.default.DEFAULT_CSV_TEXT_WRAPPERS, skipChars = [constants_1.default.EOL, constants_1.default.CR, constants_1.default.LF]) {
        if (delimitedLine === null) {
            return null;
        }
        const parts = [];
        let part = null;
        let inWrapper = false;
        const addPart = function (ch) {
            part = part ? part + ch : ch;
            return part;
        };
        let lastChar = null;
        for (const ch of delimitedLine) {
            lastChar = ch;
            if (skipChars.includes(lastChar)) {
                continue;
            }
            if (lastChar === delimiter) {
                if (inWrapper) {
                    addPart(lastChar);
                }
                else {
                    // insert a blank string if part is null
                    parts.push(part);
                    part = null;
                }
                continue;
            }
            // is this part wrapped? (i.e. "this is wrapped, becuase it has the delimiter")
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
    static async *parseCSVFile(csvFilePath, delimiter = ',', wrapperChars = constants_1.default.DEFAULT_CSV_TEXT_WRAPPERS) {
        if (csvFilePath === null) {
            return null;
        }
        let headers = null;
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
    static getMIMEType(filename) {
        return mime.lookup(filename);
    }
    static stripANSI(input, onlyFirst = false) {
        const pattern = [
            '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
            '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))',
        ].join('|');
        return input.replace(new RegExp(pattern, onlyFirst ? undefined : 'g'), '');
    }
    static async command(cmd, hideWarnings = false) {
        if (!cmd) {
            return null;
        }
        return new Promise((resolve, reject) => {
            const opt = Utils.execOptions;
            if (hideWarnings) {
                opt['stdio'] = 'pipe';
            }
            (0, node_child_process_1.exec)(cmd, opt, (error, stdout) => {
                let response;
                try {
                    if (stdout && String(stdout) !== '') {
                        response = JSON.parse(Utils.stripANSI(stdout));
                    }
                }
                catch (err) {
                    if (!hideWarnings) {
                        /* eslint-disable-next-line no-console */
                        console.warn(stdout);
                    }
                }
                finally {
                    if (!response) {
                        if (error) {
                            reject(error);
                        }
                        else {
                            resolve(stdout);
                        }
                    }
                    else if (response.status !== 0) {
                        reject(new Error(JSON.stringify(response)));
                    }
                    else {
                        resolve(response.result);
                    }
                }
            });
        });
    }
}
Utils.isJsonEnabled = false;
Utils.ReadFileBase64EncodingOption = { encoding: 'base64' };
Utils.tempFilesPath = 'Processing_AcuPack_Temp_DoNotUse';
Utils.defaultXmlOptions = {
    renderOpts: { pretty: true, indent: '    ', newline: '\n' },
    xmldec: { version: '1.0', encoding: 'UTF-8' },
    eofChar: '\n',
    encoding: 'utf-8',
};
Utils.execOptions = { env: process.env, maxBuffer: 10 * 1024 * 1024 };
Utils.reqUtils = require('node:util');
Utils.reqGlob = require('glob');
Utils.glob = Utils.reqUtils.promisify(Utils.reqGlob);
Utils.bent = require('bent');
exports.default = Utils;
//# sourceMappingURL=utils.js.map