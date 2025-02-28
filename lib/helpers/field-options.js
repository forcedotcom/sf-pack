import { OptionsBase } from './options.js';
import { SfCore } from './sf-core.js';
export class FieldOptions extends OptionsBase {
    metaDataTypes = [];
    excludeRules;
    loadDefaults() {
        return new Promise((resolve, reject) => {
            try {
                this.metaDataTypes = [];
                this.excludeRules = new Map();
                this.excludeRules.set('createable', false);
                resolve();
            }
            catch (err) {
                reject(err);
            }
        });
    }
    removeExcluded(fields) {
        if (this.excludeRules) {
            const included = [];
            for (const field of fields) {
                if (!this.isExcluded(field)) {
                    included.push(field);
                }
            }
        }
        return fields;
    }
    isExcluded(field) {
        if (this.excludeRules) {
            for (const ruleAtt of this.excludeRules.keys()) {
                const ruleValue = this.excludeRules.get(ruleAtt);
                const attValue = field[ruleAtt];
                if (ruleValue === attValue) {
                    return true;
                }
            }
        }
        return false;
    }
    async deserialize(serializedOptions) {
        return new Promise((resolve, reject) => {
            try {
                const options = JSON.parse(serializedOptions);
                this.metaDataTypes = options.metaDataTypes;
                if (options.excludeRules) {
                    this.excludeRules = new Map(options.excludeRules);
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
                    metaDataTypes: this.metaDataTypes ? this.metaDataTypes : [],
                    excludeRules: Array.from(this.excludeRules.entries()),
                }, null, SfCore.jsonSpaces));
            }
            catch (err) {
                reject(err);
            }
        });
    }
}
//# sourceMappingURL=field-options.js.map