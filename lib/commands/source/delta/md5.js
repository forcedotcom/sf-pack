import { promises as fs } from 'node:fs';
import path from 'node:path';
import md5File from 'md5-file';
import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from '../../../helpers/command-base.js';
import Utils from '../../../helpers/utils.js';
import { DeltaCommandBase } from '../../../helpers/delta-command.js';
import { DeltaProvider, Delta } from '../../../helpers/delta-provider.js';
import Constants from '../../../helpers/constants.js';
export default class Md5 extends CommandBase {
    static description = CommandBase.messages.getMessage('source.delta.md5.commandDescription');
    static examples = [
        `$ sf source delta md5 -m md5.txt -s force-app -d deploy
    Reads the specified -(m)d5 file 'md5.txt' and uses it to identify the deltas in
    -(s)ource 'force-app' and copies them to -(d)estination 'deploy'`,
    ];
    static md5DeltaProvider = class extends DeltaProvider {
        deltaLineToken = '=';
        name = 'md5';
        deltas = new Map();
        processDeltaLine(deltaLine) {
            const parts = deltaLine.split(this.deltaLineToken);
            this.deltas.set(parts[0], { hash: parts[1], isFound: false });
        }
        getMessage(name) {
            return CommandBase.messages.getMessage(name);
        }
        async *diff(source) {
            let hasUpdates = false;
            source = source ? Utils.normalizePath(source) : this.deltaOptions.source;
            for await (const deltaFile of Utils.getFiles(source)) {
                if (source && !deltaFile.startsWith(source)) {
                    await this.logMessage(`Skipping delta file line: '${deltaFile}' not in source path: '${source}'.`, true);
                    continue;
                }
                const hash = md5File.sync(deltaFile);
                const entry = this.deltas.get(deltaFile);
                let deltaKind;
                // Is this the same?
                if (!entry) {
                    deltaKind = DeltaProvider.deltaTypeKind.A;
                    this.deltas.set(deltaFile, { hash, isFound: true });
                    hasUpdates = true;
                }
                else if (hash !== entry.hash) {
                    deltaKind = DeltaProvider.deltaTypeKind.M;
                    this.deltas.set(deltaFile, { hash, isFound: true });
                    hasUpdates = true;
                }
                else {
                    deltaKind = DeltaProvider.deltaTypeKind.NONE;
                    this.deltas.set(deltaFile, { hash, isFound: true });
                }
                // return the delta
                yield new Delta(deltaKind, deltaFile);
            }
            // Check for deletes
            const deleted = [];
            for (const [fp, data] of this.deltas) {
                if (!data.isFound) {
                    // note deleted files
                    deleted.push({ deltaKind: DeltaProvider.deltaTypeKind.D, deltaFile: fp });
                    hasUpdates = true;
                }
            }
            // Return deleted entries
            for (const del of deleted) {
                yield del;
                // Remove the delete entry from the deltas
                this.deltas.delete(del.deltaFile);
            }
            // Update hash file?
            if (hasUpdates) {
                const md5FilePath = this.deltaOptions.deltaFilePath;
                await this.logMessage('Updating hash file...', true);
                if (!(await Utils.pathExists(md5FilePath))) {
                    const folder = path.dirname(md5FilePath);
                    if (folder && !(await Utils.pathExists(folder))) {
                        await Utils.mkDirPath(folder);
                    }
                }
                else {
                    await fs.unlink(md5FilePath);
                }
                for (const [fp, data] of this.deltas) {
                    await fs.appendFile(md5FilePath, `${fp}${this.deltaLineToken}${data.hash}${Constants.EOL}`);
                }
                await this.logMessage(`Updated hash file: ${md5FilePath} with ${this.deltas.size} entries.`, true);
            }
        }
    };
    static flags = DeltaCommandBase.getFlagsConfig({
        md5: Flags.file({
            char: 'm',
            description: CommandBase.messages.getMessage('source.delta.md5.md5FlagDescription'),
        }),
    });
    name = 'md5';
    deltas = new Map();
    async runInternal() {
        const { flags } = await this.parse(Md5);
        const deltaOptions = await DeltaCommandBase.getDeltaOptions(flags);
        if (!deltaOptions.deltaFilePath) {
            deltaOptions.deltaFilePath = flags.md5;
        }
        const provider = new Md5.md5DeltaProvider();
        await provider.run(deltaOptions);
    }
}
//# sourceMappingURL=md5.js.map