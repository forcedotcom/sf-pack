"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnmaskOptions = void 0;
const options_1 = require("./options");
const sf_core_1 = require("./sf-core");
class UnmaskOptions extends options_1.OptionsBase {
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
                }, null, sf_core_1.SfCore.jsonSpaces));
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
exports.UnmaskOptions = UnmaskOptions;
UnmaskOptions.defaultUserQuery = 'SELECT Id, username, IsActive, Email FROM User';
//# sourceMappingURL=unmask-options.js.map