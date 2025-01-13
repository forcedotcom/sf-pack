import { OptionsBase } from './options.js';
import { SfCore } from './sf-core.js';
export class UnmaskOptions extends OptionsBase {
    static defaultUserQuery = 'SELECT Id, username, IsActive, Email FROM User';
    sandboxes;
    userQuery;
    constructor() {
        super();
        this.sandboxes = new Map();
        this.userQuery = UnmaskOptions.defaultUserQuery;
    }
    async deserialize(serializedOptions) {
        return new Promise((resolve, reject) => {
            try {
                if (!serializedOptions) {
                    return null;
                }
                const options = JSON.parse(serializedOptions);
                const sandboxes = options.sandboxes;
                if (sandboxes) {
                    this.sandboxes = new Map(sandboxes);
                }
                if (options.userQuery) {
                    this.userQuery = options.userQuery;
                }
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
                    userQuery: this.userQuery,
                    sandboxes: Array.from(this.sandboxes.entries()),
                }, null, SfCore.jsonSpaces));
            }
            catch (err) {
                reject(err);
            }
        });
    }
    async loadDefaults() {
        return new Promise((resolve, reject) => {
            try {
                this.userQuery = UnmaskOptions.defaultUserQuery;
                this.sandboxes.set('SNDBX1', ['test.user@salesforce.com.sndbx1']);
                this.sandboxes.set('SNDBX2', ['test.user@salesforce.com.sndbx2']);
                this.sandboxes.set('SNDBX3', ['test.user@salesforce.com.sndbx3']);
            }
            catch (err) {
                reject(err);
            }
            resolve();
        });
    }
}
//# sourceMappingURL=unmask-options.js.map