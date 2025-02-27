import { promises as fs } from 'node:fs';
import Utils from './utils.js';
import { SfCore } from './sf-core.js';
import Constants from './constants.js';
class MergeResult {
    source;
    destination;
}
export default class XmlMerge {
    static async mergeXmlFiles(sourceXmlFile, destinationXmlFile, isPackageCompare, ux, logFilePath) {
        let results = new MergeResult();
        // const logFilePath = path.join(path.dirname(destinationXmlFile), 'xml-merge.log');
        try {
            // Reset log file
            if (logFilePath) {
                await Utils.deleteFile(logFilePath);
            }
            if (!(await Utils.pathExists(sourceXmlFile))) {
                await this.logMessage(`Source package does not exist: ${sourceXmlFile}`, logFilePath, ux);
                return;
            }
            const source = await Utils.readObjectFromXmlFile(sourceXmlFile);
            await this.logMessage(`Parsed source package: ${sourceXmlFile}`, logFilePath, ux);
            if (await Utils.pathExists(destinationXmlFile)) {
                const destination = await Utils.readObjectFromXmlFile(destinationXmlFile);
                await this.logMessage(`Parsed destination package: ${destinationXmlFile}`, logFilePath, ux);
                results = this.mergeObjects(source, destination, isPackageCompare);
            }
            else if (isPackageCompare) {
                await this.logMessage('Destination package does not exist.', logFilePath, ux);
                return;
            }
            else {
                await this.logMessage('Destination package does not exist - using source', logFilePath, ux);
                results.destination = source;
            }
            if (!isPackageCompare) {
                await Utils.writeObjectToXmlFile(destinationXmlFile, results.destination);
                await this.logMessage(`Merged package written: ${destinationXmlFile}`, logFilePath, ux);
            }
            else {
                await Utils.writeObjectToXmlFile(sourceXmlFile, results.source);
                await Utils.writeObjectToXmlFile(destinationXmlFile, results.destination);
                await this.logMessage(`Packages written: ${sourceXmlFile} & ${destinationXmlFile}`, logFilePath, ux);
            }
        }
        catch (err) {
            await this.logMessage(err, logFilePath, ux);
        }
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-return */
        return results?.destination;
    }
    static async mergeXmlToFile(sourceXml, destinationXmlFile) {
        let merged;
        if (await Utils.pathExists(destinationXmlFile)) {
            const destination = await Utils.readObjectFromXmlFile(destinationXmlFile);
            merged = this.mergeObjects(sourceXml, destination).destination;
        }
        else {
            merged = sourceXml;
        }
        await Utils.writeObjectToXmlFile(destinationXmlFile, merged);
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-return */
        return merged;
    }
    static getType(pack, name) {
        for (const type of pack.types) {
            if (type.name[0] === name) {
                return type;
            }
        }
        return null;
    }
    static async logMessage(message, logFile, ux) {
        if (logFile) {
            if (typeof message === 'string') {
                await fs.appendFile(logFile, `${message}${Constants.EOL}`);
            }
            else {
                await fs.appendFile(logFile, `${JSON.stringify(message)}${Constants.EOL}`);
            }
            if (ux) {
                ux.log(message);
            }
        }
    }
    static mergeObjects(source, destination, isPackageCompare) {
        const result = new MergeResult();
        result.source = source;
        result.destination = destination ?? new Object(destination);
        if (!result.source.Package) {
            result.source['Package'] = {};
        }
        if (!result.source.Package.types) {
            result.source.Package['types'] = [];
        }
        if (!result.destination.Package) {
            result.destination['Package'] = {};
        }
        if (!result.destination.Package.types) {
            result.destination.Package['types'] = [];
        }
        if (!result.destination.Package.version) {
            result.destination.Package['version'] = result.source.Package.version;
        }
        for (const sType of result.source.Package.types) {
            if (!sType.members) {
                continue;
            }
            const members = sType.members;
            Utils.sortArray(members);
            const name = sType.name;
            const dType = this.getType(result.destination.Package, name[0]);
            if (!dType?.members) {
                if (!isPackageCompare) {
                    result.destination.Package.types.push(sType);
                }
                continue;
            }
            const pops = [];
            for (const sMem of sType.members) {
                let dMem = null;
                for (const memName of dType.members) {
                    if (sMem === memName) {
                        dMem = memName;
                        break;
                    }
                }
                if (!dMem) {
                    if (!isPackageCompare) {
                        dType.members.push(sMem);
                    }
                }
                else if (isPackageCompare) {
                    pops.push(dMem);
                }
            }
            // remove all common types here
            for (const pop of pops) {
                sType.members.splice(sType.members.indexOf(pop), 1);
                dType.members.splice(dType.members.indexOf(pop), 1);
            }
            Utils.sortArray(members);
        }
        // If we removed items we may need to minify
        if (isPackageCompare) {
            result.source = SfCore.minifyPackage(result.source);
            result.destination = SfCore.minifyPackage(result.destination);
        }
        return result;
    }
}
//# sourceMappingURL=xml-merge.js.map