import Utils from './utils.js';
import { DeltaCommandBase } from './delta-command.js';
import { OptionsBase } from './options.js';
export class DeltaOptions extends OptionsBase {
    static CURRENT_VERSION = 1.0;
    deltaFilePath = null;
    source = null;
    destination = null;
    deleteReportFile = null;
    forceFile = null;
    ignoreFile = null;
    isDryRun = false;
    fullCopyDirNames = DeltaCommandBase.defaultCopyDirList;
    logAllMessagesToConsole = false;
    // Make sure we have a default ctor
    constructor(init) {
        super(init);
        Object.assign(this, init);
    }
    get currentVersion() {
        return DeltaOptions.CURRENT_VERSION;
    }
    normalize() {
        if (this.deltaFilePath) {
            this.deltaFilePath = Utils.normalizePath(this.deltaFilePath);
        }
        if (this.source) {
            this.source = Utils.normalizePath(this.source);
        }
        if (this.destination) {
            this.destination = Utils.normalizePath(this.destination);
        }
        if (this.deleteReportFile) {
            this.deleteReportFile = Utils.normalizePath(this.deleteReportFile);
        }
        if (this.forceFile) {
            this.forceFile = Utils.normalizePath(this.forceFile);
        }
        if (this.ignoreFile) {
            this.ignoreFile = Utils.normalizePath(this.ignoreFile);
        }
    }
    loadDefaults() {
        return new Promise((resolve, reject) => {
            try {
                this.deltaFilePath = '';
                this.source = '';
                this.destination = '';
                this.deleteReportFile = '';
                this.forceFile = '';
                this.ignoreFile = '';
                this.isDryRun = false;
                this.fullCopyDirNames = DeltaCommandBase.defaultCopyDirList;
                resolve();
            }
            catch (err) {
                reject(err);
            }
        });
    }
}
//# sourceMappingURL=delta-options.js.map