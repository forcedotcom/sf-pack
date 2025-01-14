import { OptionsBase } from './options.js';
export class ScaffoldOptions extends OptionsBase {
    sObjectTypes = [];
    includeOptionalFields = false;
    includeRandomValues = true;
    loadDefaults() {
        return new Promise((resolve, reject) => {
            try {
                this.sObjectTypes = [];
                this.includeOptionalFields = false;
                this.includeRandomValues = false;
                resolve();
            }
            catch (err) {
                reject(err);
            }
        });
    }
}
//# sourceMappingURL=scaffold-options.js.map