import { OptionsBase } from './options.js';
import { SfCore } from './sf-core.js';
export class EventLogOptions extends OptionsBase {
    static CURRENT_VERSION = 1.0;
    static DEFAULT_QUERY = "SELECT Id, EventType, LogFile, LogDate, LogFileLength FROM EventLogFile WHERE LogDate>Yesterday AND EventType='ContentTransfer'";
    static DEFAULT_OUTPUT_DIR = './';
    soqlQuery = null;
    outputFolder = null;
    get currentVersion() {
        return EventLogOptions.CURRENT_VERSION;
    }
    async loadDefaults() {
        return new Promise((resolve, reject) => {
            try {
                this.soqlQuery = EventLogOptions.DEFAULT_QUERY;
                this.outputFolder = EventLogOptions.DEFAULT_OUTPUT_DIR;
                resolve();
            }
            catch (err) {
                reject(err);
            }
        });
    }
    async deserialize(serializedOptions) {
        return new Promise((resolve, reject) => {
            try {
                const options = JSON.parse(serializedOptions);
                this.soqlQuery = options.soqlQuery;
                this.outputFolder = options.outputFolder;
                resolve();
            }
            catch (err) {
                reject(err);
            }
        });
    }
    async serialize() {
        return new Promise((resolve, reject) => {
            try {
                resolve(JSON.stringify({
                    soqlQuery: this.soqlQuery ? this.soqlQuery : EventLogOptions.DEFAULT_QUERY,
                    outputFolder: this.outputFolder ? this.outputFolder : EventLogOptions.DEFAULT_OUTPUT_DIR,
                }, null, SfCore.jsonSpaces));
            }
            catch (err) {
                reject(err);
            }
        });
    }
}
//# sourceMappingURL=eventlog-options.js.map