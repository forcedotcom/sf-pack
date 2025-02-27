import path from 'node:path';
import { promises as fs } from 'node:fs';
import Utils from './utils.js';
import { DeltaOptions } from './delta-options.js';
import Constants from './constants.js';
import SchemaUtils from './schema-utils.js';
export class Delta {
    deltaKind;
    deltaFile;
    constructor(deltaKind, deltaFile) {
        this.deltaKind = deltaKind;
        this.deltaFile = deltaFile;
    }
}
export class DeltaProvider {
    static deltaTypeKind = {
        NONE: 'NONE',
        A: 'A',
        M: 'M',
        D: 'D',
    };
    deltaOptions = new DeltaOptions();
    logFilePath;
    static getFullCopyPath(filePath, fullCopyDirNames, allowFullCopyPathWithExt = false) {
        let fullCopyPath = '';
        let gotFullCopyPath = false;
        if (filePath && fullCopyDirNames) {
            const pathParts = filePath.split(path.sep);
            for (const pathPart of pathParts) {
                if (gotFullCopyPath) {
                    // This will avoid returning a full file path when the file is
                    // the metdata file for an experience bundle - we only want the filename
                    const newPathPart = pathPart.endsWith(Constants.METADATA_FILE_SUFFIX) ? pathPart.split('.')[0] : pathPart;
                    fullCopyPath += newPathPart + path.sep;
                    break;
                }
                fullCopyPath += pathPart + path.sep;
                if (!gotFullCopyPath && fullCopyDirNames.includes(pathPart)) {
                    gotFullCopyPath = true;
                    continue;
                }
            }
        }
        // A full copy path should not have a file ext - its a directory
        // NOTE: a directory *could* be names with an ext so we provide the argument switch
        return gotFullCopyPath && (allowFullCopyPathWithExt || !path.extname(fullCopyPath)) ? fullCopyPath : null;
    }
    async run(deltaOptions) {
        if (!deltaOptions) {
            throw new Error('No DeltaOptions specified.');
        }
        else {
            this.deltaOptions = deltaOptions;
            this.deltaOptions.normalize();
        }
        // Reset log file
        if (this.logFilePath) {
            await Utils.deleteFile(this.logFilePath);
        }
        const metrics = {
            Copy: 0,
            Del: 0,
            None: 0,
            Ign: 0,
        };
        try {
            // Validate flags/options
            const result = await this.validateDeltaOptions(deltaOptions);
            if (result) {
                await this.logMessage(`Invalid Command Options: ${result}`, true);
                return metrics;
            }
            // Make sure all the paths are normalized (windows vs linux)
            const source = deltaOptions.source;
            const destination = deltaOptions.destination;
            const deleteReportFile = deltaOptions.deleteReportFile;
            const forceFile = deltaOptions.forceFile;
            const ignoreFile = deltaOptions.ignoreFile;
            const isDryRun = deltaOptions.isDryRun;
            const ignoreSet = new Set();
            const copiedSet = new Set();
            // No destination? no need to continue
            if (!destination) {
                await this.logMessage('No destination defined - nothing to do.');
                return metrics;
            }
            // Create Deleted Report File
            if (deleteReportFile && destination) {
                try {
                    // write the deleted-files.txt report into the parent folder of the destination
                    // Reset log file
                    await Utils.deleteFile(deleteReportFile);
                }
                catch (err) {
                    if (!Utils.isENOENT(err)) {
                        await this.logMessage(`Unable to delete old report: ${err.message}.`);
                    }
                }
            }
            if (ignoreFile) {
                await this.logMessage('Ignore Set:');
                for await (const line of Utils.readFileLines(ignoreFile)) {
                    for await (const filePath of Utils.getFiles(line)) {
                        ignoreSet.add(Utils.normalizePath(filePath));
                        await this.logMessage(`\t${filePath}`);
                    }
                }
            }
            if (isDryRun) {
                await this.logMessage(`Begin DRY-RUN Diff (${this.name})`);
            }
            else {
                await this.logMessage(`Begin Diff (${this.name})`);
            }
            // try and load the delta file
            await this.loadDeltaFile();
            if (forceFile) {
                if (this.deltas.size > 0) {
                    // Remove the force entries from the hash so they
                    // 'act' like new files and are copied to the destination.
                    await this.logMessage('Pruning force file entries from deltas.', true);
                    for await (const line of Utils.readFileLines(forceFile)) {
                        for await (const filePath of Utils.getFiles(line)) {
                            if (this.deltas.delete(filePath)) {
                                await this.logMessage(`Purged: ${filePath}`, true);
                            }
                        }
                    }
                }
            }
            await this.logMessage(`Scanning folder: ${source}.`, true);
            for await (const delta of this.diff(source)) {
                const deltaKind = delta.deltaKind;
                const deltaFile = delta.deltaFile;
                if (ignoreSet.has(deltaFile)) {
                    await this.logMessage(`Delta (${deltaKind}) ignored: ${deltaFile}`, true);
                    metrics.Ign++;
                    continue;
                }
                // Determine the action
                switch (deltaKind) {
                    // [D]eleted files
                    case DeltaProvider.deltaTypeKind.D:
                        await this.logMessage(`DELETED File: ${deltaFile}`);
                        if (deleteReportFile) {
                            await fs.appendFile(deleteReportFile, deltaFile + Constants.EOL);
                        }
                        metrics.Del++;
                        break;
                    // [A]dded & [M]odified files
                    case DeltaProvider.deltaTypeKind.A:
                    case DeltaProvider.deltaTypeKind.M: {
                        // check the source folder for associated files.
                        const fullCopyPath = DeltaProvider.getFullCopyPath(deltaFile, deltaOptions.fullCopyDirNames);
                        const dirName = fullCopyPath ?? path.dirname(deltaFile);
                        // const deltaFileBaseName = `${path.basename(deltaFile).split('.')[0]}.`;
                        const deltaFileBaseName = SchemaUtils.getMetadataBaseName(deltaFile);
                        for await (const filePath of Utils.getFiles(dirName, fullCopyPath != null)) {
                            // have we already processed this file?
                            if (copiedSet.has(filePath)) {
                                await this.logMessage(`Already Copied ${filePath} - skipping`);
                                continue;
                            }
                            if (filePath.startsWith(fullCopyPath) || path.basename(filePath).startsWith(deltaFileBaseName)) {
                                // are we ignoring this file?
                                if (ignoreSet.has(filePath)) {
                                    await this.logMessage(`Delta (${deltaKind}) ignored: ${filePath}`, true);
                                    metrics.Ign++;
                                }
                                else {
                                    const destinationPath = filePath.replace(source, destination);
                                    if (!isDryRun) {
                                        await Utils.copyFile(filePath, destinationPath);
                                    }
                                    await this.logMessage(`Delta (${deltaKind}) found: ${destinationPath}`);
                                    metrics.Copy++;
                                    copiedSet.add(filePath);
                                }
                            }
                        }
                        // Sometimes the meta-data files can be located in the parent dir (staticresources, documents, experiences)
                        // so let's check there
                        const parentDirName = path.dirname(dirName);
                        const deltaParentBaseName = `${path.basename(dirName)}.`;
                        for await (const parentFilePath of Utils.getFiles(parentDirName, false)) {
                            // have we already processed this file?
                            if (copiedSet.has(parentFilePath)) {
                                await this.logMessage(`Already Copied ${parentFilePath} - skipping`);
                                continue;
                            }
                            // are we ignoring this file?
                            if (ignoreSet.has(parentFilePath)) {
                                await this.logMessage(`Delta (${deltaKind}) ignored: ${parentFilePath}`, true);
                                metrics.Ign++;
                                continue;
                            }
                            if (path.basename(parentFilePath).startsWith(deltaParentBaseName) &&
                                parentFilePath.endsWith(Constants.METADATA_FILE_SUFFIX)) {
                                const destinationPath = parentFilePath.replace(source, destination);
                                if (!isDryRun) {
                                    await Utils.copyFile(parentFilePath, destinationPath);
                                }
                                await this.logMessage(`Delta (${deltaKind}) found: ${destinationPath}`);
                                metrics.Copy++;
                                copiedSet.add(parentFilePath);
                            }
                        }
                        break;
                    }
                    case DeltaProvider.deltaTypeKind.NONE:
                        await this.logMessage(`Delta (${deltaKind}): ${deltaFile}`);
                        metrics.None++;
                        break;
                    default:
                        await this.logMessage(`WARNING: Unknown Delta (${deltaKind}): ${deltaFile}`);
                }
            }
        }
        catch (err) {
            await this.logMessage(JSON.stringify(err), true);
        }
        finally {
            await this.logMessage(`Metrics: ${JSON.stringify(metrics)}`, true);
        }
        return metrics;
    }
    async loadDeltaFile(deltaFilePath) {
        // only load the hash once
        deltaFilePath = deltaFilePath ? Utils.normalizePath(deltaFilePath) : this.deltaOptions.deltaFilePath;
        if (deltaFilePath && this.deltas.size === 0) {
            await this.logMessage(`Loading delta file: ${deltaFilePath}`);
            for await (const line of Utils.readFileLines(deltaFilePath)) {
                if (!line?.trim()) {
                    continue;
                }
                if (!line.includes(this.deltaLineToken)) {
                    await this.logMessage(`Skipping invalid line: ${line}`, true);
                    continue;
                }
                this.processDeltaLine(line);
            }
            const isEmpty = this.deltas.size === 0;
            if (!isEmpty) {
                await this.logMessage(`Loaded delta file: ${deltaFilePath} with ${this.deltas.size} entries.`);
            }
            else {
                await this.logMessage(`WARNING: blank or invalid delta file: ${deltaFilePath}.`, true);
            }
        }
    }
    async logMessage(message, includeConsole = false) {
        if (this.logFilePath) {
            if (typeof message === 'string') {
                await fs.appendFile(this.logFilePath, `${message}${Constants.EOL}`);
            }
            else {
                await fs.appendFile(this.logFilePath, `${JSON.stringify(message)}${Constants.EOL}`);
            }
        }
        if (includeConsole || this.deltaOptions.logAllMessagesToConsole) {
            /* eslint-disable-next-line no-console */
            console.log(message);
        }
    }
    async validateDeltaOptions(deltaOptions) {
        const result = () => {
            if (!deltaOptions.source) {
                return 'No delta -s(ource) specified.';
            }
            return null;
        };
        return Promise.resolve(result());
    }
}
//# sourceMappingURL=delta-provider.js.map